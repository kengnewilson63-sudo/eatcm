import { Injectable, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Client STOMP minimal (sans dépendance externe) branché sur le broker
 * Spring du backend : `WebSocketConfig` expose `/ws/tracking`.
 *
 *  - Livreur → serveur : SEND /app/livreur.position
 *  - Serveur → abonnés : SUBSCRIBE /topic/...
 *
 * Le JWT est transmis dans le CONNECT (`Authorization: Bearer ...`) ; il est
 * lu à la connexion, donc à reconnecter si l'utilisateur change de session.
 */

export interface StompMessage {
  /** Corps JSON déjà désérialisé. */
  body: any;
  /** Entêtes de destination/abonnement. */
  headers: Record<string, string>;
  /** Destination du message (topic). */
  destination: string;
}

export type StompEtat = 'DECONNECTE' | 'CONNEXION' | 'CONNECTE';

/** Un abonnement actif : permet de se désabonner proprement. */
interface Abonnement {
  topic: string;
  handler: (message: StompMessage) => void;
}

@Injectable({ providedIn: 'root' })
export class TrackingGateway {
  private auth = inject(AuthService);

  private sock: WebSocket | null = null;
  private abonnements: Abonnement[] = [];
  /** SubId STOMP → abonnement local. */
  private subIds = new Map<string, Abonnement>();
  private seq = 0;
  private etat: StompEtat = 'DECONNECTE';
  /** Ré-abonnement automatique après une reconnexion. */
  private reconnexionPrevue = false;

  // ===== CONNEXION =====

  get estConnecte(): boolean {
    return this.etat === 'CONNECTE'
      && this.sock !== null
      && this.sock.readyState === WebSocket.OPEN;
  }

  /** Ouvre la connexion STOMP si nécessaire (idempotent). */
  connecter(): void {
    if (this.sock && (this.etat === 'CONNEXION' || this.etat === 'CONNECTE')) return;

    const token = this.auth.getToken();
    if (!token) return;

    const url = this.wsUrl();
    try {
      this.sock = new WebSocket(url);
    } catch {
      this.sock = null;
      return;
    }

    this.etat = 'CONNEXION';

    this.sock.onopen = () => {
      // Frame CONNECT (STOMP 1.2) — authentification par entête Bearer
      this.envoyer('CONNECT', {
        'accept-version': '1.2',
        'heart-beat': '10000,10000',
        Authorization: `Bearer ${token}`,
      });
    };

    this.sock.onmessage = event => this.recevoir(String(event.data));

    this.sock.onerror = () => { /* le repli REST prend le relais */ };

    this.sock.onclose = () => {
      const etaitConnecte = this.etat === 'CONNECTE';
      this.etat = 'DECONNECTE';
      this.sock = null;
      this.subIds.clear();
      // Reconnexion silencieuse si on avait des abonnements actifs
      if (etaitConnecte && this.abonnements.length > 0) {
        this.reconnecterPlusTard();
      }
    };
  }

  deconnecter(): void {
    if (this.sock && this.estConnecte) {
      this.envoyer('DISCONNECT', {});
    }
    this.reconnexionPrevue = false;
    this.abonnements = [];
    this.subIds.clear();
    this.etat = 'DECONNECTE';
    if (this.sock) {
      this.sock.onclose = null;
      try { this.sock.close(); } catch { /* déjà fermé */ }
      this.sock = null;
    }
  }

  // ===== ABONNEMENTS =====

  /** S'abonne à un topic `/topic/...` et retourne une fonction de désabonnement. */
  souscrire(topic: string, handler: (message: StompMessage) => void): () => void {
    const abonnement: Abonnement = { topic, handler };
    this.abonnements.push(abonnement);

    this.connecter();
    if (this.estConnecte) {
      this.abonner(abonnement);
    }

    return () => this.desabonner(abonnement);
  }

  private abonner(abonnement: Abonnement): void {
    const subId = `sub-${++this.seq}`;
    this.subIds.set(subId, abonnement);
    this.envoyer('SUBSCRIBE', { id: subId, destination: abonnement.topic });
  }

  private desabonner(abonnement: Abonnement): void {
    this.abonnements = this.abonnements.filter(a => a !== abonnement);
    for (const [subId, ab] of this.subIds) {
      if (ab !== abonnement) continue;
      if (this.estConnecte) this.envoyer('UNSUBSCRIBE', { id: subId });
      this.subIds.delete(subId);
    }
  }

  /** Ré-abonne tous les abonnements locaux (après reconnexion CONNECTED). */
  private reabonnerTout(): void {
    this.subIds.clear();
    for (const abonnement of this.abonnements) {
      this.abonner(abonnement);
    }
  }

  // ===== ENVOI =====

  /** Publie un message JSON sur `/app/...` (destination serveur). */
  publier(destination: string, body: unknown): void {
    if (!this.estConnecte) {
      this.connecter();
      return; // le repli REST est géré par l'appelant
    }
    this.envoyer('SEND', {
      destination,
      'content-type': 'application/json',
    }, JSON.stringify(body));
  }

  // ===== STOMP bas niveau =====

  private envoyer(command: string, headers: Record<string, string>, body?: string): void {
    if (!this.sock || this.sock.readyState !== WebSocket.OPEN) return;
    const lignes = [command];
    for (const [cle, valeur] of Object.entries(headers)) {
      lignes.push(`${cle}:${valeur}`);
    }
    lignes.push('', body ?? '');
    try {
      this.sock.send(lignes.join('\n') + '\0');
    } catch { /* socket fermé entre-temps */ }
  }

  /** Parse une (ou plusieurs) frame(s) STOMP reçue(s) du serveur. */
  private recevoir(brut: string): void {
    for (const frame of brut.split('\0')) {
      this.traiterFrame(frame);
    }
  }

  private traiterFrame(frame: string): void {
    const propre = frame.replace(/^\n+/, '');
    if (!propre) return;

    const separateur = propre.indexOf('\n\n');
    const entetesBruts = (separateur >= 0 ? propre.slice(0, separateur) : propre).split('\n');
    const corps = separateur >= 0 ? propre.slice(separateur + 2) : '';

    const command = entetesBruts.shift()?.trim();
    if (!command) return;

    const headers: Record<string, string> = {};
    for (const ligne of entetesBruts) {
      const idx = ligne.indexOf(':');
      if (idx > 0) headers[ligne.slice(0, idx)] = ligne.slice(idx + 1);
    }

    switch (command) {
      case 'CONNECTED':
        this.etat = 'CONNECTE';
        this.reconnexionPrevue = false;
        this.reabonnerTout();
        break;

      case 'MESSAGE':
        this.dispatch(headers, corps);
        break;

      case 'ERROR':
        console.warn('STOMP ERROR', headers['message'] ?? corps);
        break;

      default:
        break; // RECEIPT / heart-beat (\n) : ignorés
    }
  }

  private dispatch(headers: Record<string, string>, corps: string): void {
    // Le broker renvoie l'id d'abonnement local (sub-N) → résolution directe.
    const abonnement = this.subIds.get(headers['subscription'] ?? '')
      ?? this.abonnements.find(a => a.topic === headers['destination']);

    if (!abonnement) return;

    let body: any = corps;
    if (corps) {
      try { body = JSON.parse(corps); } catch { /* payload brut conservé */ }
    }

    abonnement.handler({ body, headers, destination: headers['destination'] ?? abonnement.topic });
  }

  private reconnecterPlusTard(): void {
    if (this.reconnexionPrevue) return;
    this.reconnexionPrevue = true;
    setTimeout(() => {
      this.reconnexionPrevue = false;
      if (this.abonnements.length > 0) this.connecter();
    }, 5000);
  }

  /** `http://localhost:8080/api` → `ws://localhost:8080/ws/tracking`. */
  private wsUrl(): string {
    const base = environment.apiUrl.replace(/\/api\/?$/, '').replace(/^http/, 'ws');
    return `${base}/ws/tracking`;
  }
}