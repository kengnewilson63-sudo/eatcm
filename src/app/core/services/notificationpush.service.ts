import { Injectable, signal, inject } from '@angular/core';
import { NotificationService } from './notification.service';

export interface NotificationPush {
  id: string;
  type: 'NOUVELLE_COMMANDE' | 'STATUT_COMMANDE' | 'COURSE_DISPONIBLE' | 'COURSE_ACCEPTEE';
  titre: string;
  message: string;
  commandeId?: number;
  lu: boolean;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationPushService {
  private notif = inject(NotificationService);

  notifications = signal<NotificationPush[]>([]);
  private intervalPolling: any = null;

  // Nombre non lues
  get totalNonLues(): number {
    return this.notifications().filter(n => !n.lu).length;
  }

  // ══ RESTAURANT — Nouvelle commande reçue ══════════════════
  notifierNouvelleCommande(commandeId: number, clientNom: string, montant: number): void {
    const n: NotificationPush = {
      id: crypto.randomUUID(),
      type: 'NOUVELLE_COMMANDE',
      titre: '🍽️ Nouvelle commande !',
      message: `${clientNom} vient de commander — ${montant.toLocaleString()} FCFA`,
      commandeId,
      lu: false,
      date: new Date().toISOString(),
    };
    this.ajouterNotification(n);
    // Toast visible immédiatement
    this.notif.success(`🍽️ Nouvelle commande de ${clientNom} — ${montant.toLocaleString()} FCFA`);
    // Son notification
    this.jouerSon();
  }

  // ══ CLIENT — Changement statut commande ═══════════════════
  notifierChangementStatut(commandeId: number, statut: string): void {
    const messages: Record<string, { titre: string; message: string }> = {
      'ACCEPTEE':       { titre: '✅ Commande acceptée !',      message: 'Le restaurant a accepté ta commande et commence à préparer.' },
      'EN_PREPARATION': { titre: '👨‍🍳 En préparation !',        message: 'Ton plat est en cours de préparation.' },
      'PRETE':          { titre: '🎉 Commande prête !',          message: 'Ton plat est prêt — un livreur va bientôt le récupérer.' },
      'EN_LIVRAISON':   { titre: '🛵 Livreur en route !',        message: 'Ton livreur a récupéré ta commande et est en route.' },
      'LIVREE':         { titre: '✅ Commande livrée !',          message: 'Bon appétit ! N\'oublie pas de noter le restaurant.' },
      'ANNULEE':        { titre: '❌ Commande annulée',           message: 'Ta commande a été annulée. Remboursement en cours si applicable.' },
    };

    const info = messages[statut];
    if (!info) return;

    const n: NotificationPush = {
      id: crypto.randomUUID(),
      type: 'STATUT_COMMANDE',
      titre: info.titre,
      message: info.message,
      commandeId,
      lu: false,
      date: new Date().toISOString(),
    };
    this.ajouterNotification(n);
    this.notif.info(`${info.titre} — ${info.message}`);
  }

  // ══ LIVREUR — Course disponible ═══════════════════════════
  notifierCourseDisponible(commandeId: number, restaurant: string, frais: number, distance: number): void {
    const n: NotificationPush = {
      id: crypto.randomUUID(),
      type: 'COURSE_DISPONIBLE',
      titre: '🛵 Course disponible !',
      message: `${restaurant} — ${frais.toLocaleString()} FCFA • ${distance.toFixed(1)} km`,
      commandeId,
      lu: false,
      date: new Date().toISOString(),
    };
    this.ajouterNotification(n);
    this.notif.info(`🛵 Nouvelle course — ${restaurant} — ${frais.toLocaleString()} FCFA`);
    this.jouerSon();
  }

  // ══ LIVREUR — Course acceptée par un autre ════════════════
  notifierCourseAcceptee(): void {
    this.notif.warning('⚡ Cette course a été prise par un autre livreur.');
  }

  // ══ Polling simulation (remplacer par WebSocket en prod) ══
  demarrerPolling(role: string, userId: number): void {
    // En production → remplacer par WebSocket
    // this.ws = new WebSocket(`wss://api.eatscm.com/ws?userId=${userId}`)
    // this.ws.onmessage = (msg) => this.traiterMessage(JSON.parse(msg.data))

    // Simulation polling toutes les 30s
    this.intervalPolling = setInterval(() => {
      // En prod → GET /api/notifications/nouvelles
      console.log('Polling notifications...', role, userId);
    }, 30000);
  }

  arreterPolling(): void {
    if (this.intervalPolling) {
      clearInterval(this.intervalPolling);
      this.intervalPolling = null;
    }
  }

  marquerLue(id: string): void {
    this.notifications.update(l => l.map(n => n.id === id ? { ...n, lu: true } : n));
  }

  marquerToutesLues(): void {
    this.notifications.update(l => l.map(n => ({ ...n, lu: true })));
  }

  supprimerNotification(id: string): void {
    this.notifications.update(l => l.filter(n => n.id !== id));
  }

  private ajouterNotification(n: NotificationPush): void {
    this.notifications.update(l => [n, ...l].slice(0, 50)); // Max 50
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
    const diff = Date.now() - new Date(d).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1)  return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)   return `il y a ${h}h`;
    return new Date(d).toLocaleDateString('fr-FR');
  }
}