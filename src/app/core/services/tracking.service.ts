import { Injectable, signal, inject } from '@angular/core';
import { MoyenTransport, StatutLivreur } from '../models';
import { LivreurService } from './livreur.service';
import { TrackingGateway } from '../realtime/tracking.gateway';

export interface PositionLivreur {
  latitude: number;
  longitude: number;
  timestamp: number;
  livreurId?: number;
  commandeId?: number;
}

export interface ProfilLivreur {
  id: number;
  nom: string;
  telephone: string;
  moyenTransport: MoyenTransport;
  statut: StatutLivreur;
  note: number;
}

@Injectable({ providedIn: 'root' })
export class TrackingService {

  // Position GPS actuelle du livreur
  positionLivreur  = signal<PositionLivreur | null>(null);

  // Statut connexion livreur
  statutLivreur    = signal<StatutLivreur>('HORS_LIGNE');

  // Moyen de transport
  moyenTransport   = signal<MoyenTransport>('MOTO');

  // Est-ce que le livreur est en train de tracker
  estEnTracking    = signal(false);

  private livreurApi = inject(LivreurService);
  private gateway = inject(TrackingGateway);

  private watchId: number | null = null;
  private intervalSim: any       = null;
  /** Dernière position connue — sert au repli REST POST /api/livreur/position. */
  private derniereMajPosition = 0;
  /** Commande en cours de livraison : permet de publier sur le bon topic. */
  private commandeIdEnCours: number | null = null;

  // ══ LIVREUR — démarre le tracking GPS ════════════════════
  demarrerTracking(livreurId: number, commandeId?: number): void {
    if (this.estEnTracking()) return;

    this.commandeIdEnCours = commandeId ?? null;
    this.estEnTracking.set(true);
    this.statutLivreur.set('DISPONIBLE');

    if (!navigator.geolocation) {
      this.simulerPosition(livreurId, commandeId);
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const position: PositionLivreur = {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: pos.timestamp,
          livreurId,
          commandeId,
        };
        this.positionLivreur.set(position);

        // Diffusion temps réel + repli REST (voir pousserPosition)
        this.pousserPosition(position.latitude, position.longitude);
      },
      (err) => {
        console.warn('GPS error:', err);
        // Fallback vers simulation si GPS indispo
        this.simulerPosition(livreurId, commandeId);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }

  // ══ Simulation pour dev (quand pas de GPS dispo) ══════════
  simulerPosition(livreurId: number, commandeId?: number): void {
    // Position de départ — Akwa Douala
    let lat = 4.0483;
    let lng = 9.7043;

    this.intervalSim = setInterval(() => {
      // Bouge légèrement à chaque tick
      lat += (Math.random() - 0.5) * 0.001;
      lng += (Math.random() - 0.5) * 0.001;

      this.positionLivreur.set({
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
        livreurId,
        commandeId,
      });

      this.pousserPosition(lat, lng);
    }, 3000);
  }

  /**
   * Envoie la position au backend :
   *  1. via WebSocket (`/app/livreur.position`) pour le temps réel ;
   *  2. via REST en repli/ persistance (throttlé à 10 s).
   */
  private pousserPosition(latitude: number, longitude: number): void {
    // 1. Temps réel — le client abonné à /topic/commande/{id}/position le reçoit.
    this.gateway.publier('/app/livreur.position', {
      latitude,
      longitude,
      commandeId: this.commandeIdEnCours,
      timestamp: Date.now(),
    });

    // 2. Persistance REST (throttlée) — la position reste consultable même
    //    si personne n'écoute le WebSocket à cet instant.
    const maintenant = Date.now();
    if (maintenant - this.derniereMajPosition < 10_000) return;
    this.derniereMajPosition = maintenant;
    this.livreurApi.majPosition(latitude, longitude).subscribe({
      error: () => { /* position non critique — on ignore l'échec */ },
    });
  }

  // ══ LIVREUR — arrête le tracking ═════════════════════════
  arreterTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.intervalSim) {
      clearInterval(this.intervalSim);
      this.intervalSim = null;
    }
    this.estEnTracking.set(false);
    this.statutLivreur.set('HORS_LIGNE');
    this.positionLivreur.set(null);
    this.commandeIdEnCours = null;
  }

  // ══ Change le moyen de transport ═════════════════════════
  setMoyenTransport(moyen: MoyenTransport): void {
    this.moyenTransport.set(moyen);
    this.livreurApi.changerTransport(moyen).subscribe({
      error: () => { /* le transport local reste appliqué */ },
    });
  }

  // ══ Change le statut ══════════════════════════════════════
  setStatut(statut: StatutLivreur): void {
    this.statutLivreur.set(statut);
    this.livreurApi.changerStatut(statut).subscribe({
      error: () => { /* le statut local reste appliqué */ },
    });
  }

  getIconTransport(): string {
    const icons: Record<MoyenTransport, string> = {
      MOTO:    '🛵',
      VOITURE: '🚗',
      VELO:    '🚲',
      PIED:    '🚶',
    };
    return icons[this.moyenTransport()];
  }
}