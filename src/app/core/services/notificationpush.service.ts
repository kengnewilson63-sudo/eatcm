import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TrackingGateway } from '../realtime/tracking.gateway';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

/** Types renvoyés par le backend (`TypeNotification`). */
export type TypeNotificationBackend =
  | 'NOUVELLE_COMMANDE'
  | 'STATUT_COMMANDE'
  | 'COURSE_DISPONIBLE'
  | 'COURSE_PRISE'
  | 'PAIEMENT'
  | 'COMPTE'
  | 'LITIGE';

/**
 * Notification telle que persistée par le backend (table `notifications`).
 * `dateCreation` est un LocalDateTime sérialisé en ISO sans fuseau.
 */
export interface NotificationPush {
  id: number;
  type: TypeNotificationBackend;
  titre: string;
  message: string | null;
  commandeId: number | null;
  restaurantId: number | null;
  montant: number | null;
  lu: boolean;
  dateCreation: string;
}

/**
 * Notifications utilisateur branchées sur le backend.
 *
 *  - Chargement initial : GET    /api/notifications
 *  - Temps réel         : STOMP  /topic/user/{userId}/notifications
 *  - Marquage lu        : PATCH  /api/notifications/{id}/lire, /tout-lire
 *  - Suppression        : DELETE /api/notifications/{id}
 *
 * Un repli par polling prend le relais quand le WebSocket n'est pas disponible,
 * pour que le badge de la cloche reste à jour.
 */
@Injectable({ providedIn: 'root' })
export class NotificationPushService implements OnDestroy {
  private http    = inject(HttpClient);
  private gateway = inject(TrackingGateway);
  private auth    = inject(AuthService);
  private notif   = inject(NotificationService);

  private readonly api = `${environment.apiUrl}/notifications`;

  notifications = signal<NotificationPush[]>([]);
  /** Vrai quand le flux STOMP des notifications est actif. */
  tempsReelActif = signal(false);

  private arrets: (() => void)[] = [];
  private intervalPolling: ReturnType<typeof setInterval> | null = null;
  private demarre = false;

  // Nombre non lues
  get totalNonLues(): number {
    return this.notifications().filter(n => !n.lu).length;
  }

  // ══════════════════════════════════
  //  DÉMARRAGE
  // ══════════════════════════════════════════════════════════

  /** Charge les notifications et branche le temps réel (idempotent). */
  demarrer(): void {
    if (this.demarre) return;
    const user = this.auth.currentUser();
    if (!user) return;
    this.demarre = true;

    this.charger();
    this.brancherTempsReel(user.id);
    this.demarrerPollingDeSecours();
  }

  private charger(): void {
    this.http.get<NotificationPush[]>(this.api).subscribe({
      next: liste => this.notifications.set(liste),
      error: () => { /* silencieux : le badge reste simplement vide */ },
    });
  }

  /** S'abonne au topic personnel ; bascule sur polling si indisponible. */
  private brancherTempsReel(userId: number): void {
    this.arrets.push(
      this.gateway.souscrire(`/topic/user/${userId}/notifications`, message => {
        const notif = message.body as NotificationPush;
        if (!notif || notif.id == null) return;
        this.ajouterNotification(notif);
        this.notif.info(notif.titre);
        this.jouerSon();
      })
    );

    // Le gateway se connecte de façon asynchrone : on évalue l'état un peu après.
    setTimeout(() => this.tempsReelActif.set(this.gateway.estConnecte), 2500);
  }

  /**
   * Repli : recharge la liste périodiquement tant que le WebSocket n'est pas
   * connecté, afin que le badge ne reste pas figé.
   */
  private demarrerPollingDeSecours(): void {
    if (this.intervalPolling) return;
    this.intervalPolling = setInterval(() => {
      if (this.gateway.estConnecte) {
        this.tempsReelActif.set(true);
        return;
      }
      this.tempsReelActif.set(false);
      this.charger();
    }, 30000);
  }

  /** Arrête le temps réel et le polling (déconnexion). */
  arreter(): void {
    this.arrets.forEach(off => off());
    this.arrets = [];
    if (this.intervalPolling) {
      clearInterval(this.intervalPolling);
      this.intervalPolling = null;
    }
    this.demarre = false;
    this.tempsReelActif.set(false);
    this.notifications.set([]);
  }

  ngOnDestroy(): void {
    this.arreter();
  }

  /** Recharge depuis le serveur. */
  rafraichir(): void {
    this.charger();
  }

  // ══════════════════════════════════
  //  ACTIONS
  // ══════════════════════════════════════════════════════════

  marquerLue(id: number): void {
    const notif = this.notifications().find(n => n.id === id);
    if (notif?.lu) return;

    // Optimiste : l'UI réagit tout de suite, on annule si le serveur refuse.
    this.notifications.update(l => l.map(n => n.id === id ? { ...n, lu: true } : n));
    this.http.patch(`${this.api}/${id}/lire`, {}).subscribe({
      error: () => this.notifications.update(l => l.map(n => n.id === id ? { ...n, lu: false } : n)),
    });
  }

  marquerToutesLues(): void {
    const precedent = this.notifications();
    this.notifications.update(l => l.map(n => ({ ...n, lu: true })));
    this.http.patch(`${this.api}/tout-lire`, {}).subscribe({
      error: () => this.notifications.set(precedent),
    });
  }

  supprimerNotification(id: number): void {
    const precedent = this.notifications();
    this.notifications.update(l => l.filter(n => n.id !== id));
    this.http.delete(`${this.api}/${id}`).subscribe({
      error: () => this.notifications.set(precedent),
    });
  }

  private ajouterNotification(n: NotificationPush): void {
    this.notifications.update(l =>
      l.some(x => x.id === n.id) ? l : [n, ...l].slice(0, 50) // Max 50
    );
  }

  private jouerSon(): void {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  formaterDate(d: string): string {
    if (!d) return '';
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1)  return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)   return `il y a ${h}h`;
    return date.toLocaleDateString('fr-FR');
  }

  /** Emoji affiché dans la liste selon le type de notification. */
  emoji(type: TypeNotificationBackend): string {
    switch (type) {
      case 'NOUVELLE_COMMANDE': return '🍽️';
      case 'STATUT_COMMANDE':   return '📦';
      case 'COURSE_DISPONIBLE': return '🛵';
      case 'COURSE_PRISE':      return '⚡';
      case 'PAIEMENT':          return '💳';
      case 'LITIGE':            return '⚠️';
      default:                  return '✅';
    }
  }

  /** Classe de fond de la pastille selon le type. */
  couleurFond(type: TypeNotificationBackend): string {
    switch (type) {
      case 'NOUVELLE_COMMANDE': return 'bg-orange-100';
      case 'STATUT_COMMANDE':   return 'bg-blue-100';
      case 'COURSE_DISPONIBLE': return 'bg-green-100';
      case 'PAIEMENT':          return 'bg-purple-100';
      case 'LITIGE':            return 'bg-red-100';
      default:                  return 'bg-gray-100';
    }
  }
}