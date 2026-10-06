import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { TrackingGateway, StompMessage } from './tracking.gateway';
import { Commande } from '../models';

/**
 * Façade temps réel côté restaurant : traduit les topics STOMP du backend
 * (voir backend `realtime.WebSocketConfig`) en flux métier.
 *
 * Topics écoutés :
 *   /topic/restaurant/{restaurantId}/commandes  → nouvelle commande
 *   /topic/commande/{commandeId}/statut         → changement de statut
 *
 * Le transport (STOMP minimal) et les reconnexions sont gérés par
 * `TrackingGateway` ; ce service ne fait que router les messages et
 * fournir un repli REST si le WebSocket n'est pas disponible.
 */
@Injectable({ providedIn: 'root' })
export class RestaurantRealtimeService {
  private gateway = inject(TrackingGateway);

  /** Vrai quand le WebSocket STOMP est connecté (sinon repli REST). */
  readonly connecte = signal(false);

  /** Abonnements de commande actifs : commandeId → fonction de désabonnement. */
  private abonnementsStatut = new Map<number, () => void>();
  private abonnementsNouvelleCommande: (() => void)[] = [];

  // ===== NOUVELLES COMMANDES =====

  /**
   * S'abonne aux nouvelles commandes du restaurant.
   * Retourne une fonction de désabonnement à appeler dans `ngOnDestroy`.
   */
  surNouvelleCommande(
    restaurantId: number,
    handler: (commande: Commande) => void,
  ): () => void {
    this.gateway.connecter();
    const off = this.gateway.souscrire(
      `/topic/restaurant/${restaurantId}/commandes`,
      (message: StompMessage) => handler(message.body as Commande),
    );
    this.abonnementsNouvelleCommande.push(off);
    this.mettreAJourEtat();

    return () => {
      off();
      this.abonnementsNouvelleCommande = this.abonnementsNouvelleCommande.filter(a => a !== off);
      this.mettreAJourEtat();
    };
  }

  // ===== CHANGEMENTS DE STATUT =====

  /**
   * S'abonne au changement de statut d'une commande précise.
   * Appelé pour chaque commande active affichée ; idempotent par commandeId.
   */
  surStatutCommande(
    commandeId: number,
    handler: (statut: string, message?: string) => void,
  ): () => void {
    this.gateway.connecter();

    // Un seul abonnement par commande : on remplace l'ancien handler.
    this.abonnementsStatut.get(commandeId)?.();

    const off = this.gateway.souscrire(
      `/topic/commande/${commandeId}/statut`,
      (message: StompMessage) => handler(message.body?.statut, message.body?.message),
    );
    this.abonnementsStatut.set(commandeId, off);
    this.mettreAJourEtat();

    return () => {
      off();
      this.abonnementsStatut.delete(commandeId);
      this.mettreAJourEtat();
    };
  }

  /** Cesse d'écouter le statut d'une commande (ex. après livraison/annulation). */
  arreterStatutCommande(commandeId: number): void {
    this.abonnementsStatut.get(commandeId)?.();
    this.abonnementsStatut.delete(commandeId);
    this.mettreAJourEtat();
  }

  /** Coupe tous les abonnements (à la destruction du composant). */
  toutArreter(): void {
    this.abonnementsNouvelleCommande.forEach(off => off());
    this.abonnementsNouvelleCommande = [];
    this.abonnementsStatut.forEach(off => off());
    this.abonnementsStatut.clear();
    this.mettreAJourEtat();
  }

  /**
   * Repli REST : interroge l'API à intervalle régulier tant que le
   * WebSocket n'est pas connecté. Retourne une fonction d'annulation.
   */
  repliPolling<T>(requete: () => Observable<T>, handler: (data: T) => void, intervalleMs = 20000): () => void {
    let stop = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (stop || this.gateway.estConnecte) return;
      requete().subscribe({
        next: data => handler(data),
        error: () => { /* le déclenchement manuel reste possible */ },
      });
    };

    const demarrer = () => {
      if (this.gateway.estConnecte) return;
      tick();
      timer = setInterval(tick, intervalleMs);
    };
    demarrer();

    return () => {
      stop = true;
      if (timer) clearInterval(timer);
    };
  }

  private mettreAJourEtat(): void {
    this.connecte.set(this.gateway.estConnecte);
  }
}