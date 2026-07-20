import { Injectable, signal } from '@angular/core';
import { MoyenTransport, StatutLivreur } from '../models';

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

  private watchId: number | null = null;
  private intervalSim: any       = null;

  // ══ LIVREUR — démarre le tracking GPS ════════════════════
  demarrerTracking(livreurId: number, commandeId?: number): void {
    if (this.estEnTracking()) return;

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

        // En production → envoyer au backend via WebSocket
        // this.websocket.emit('livreur:position', position);
        console.log('Position livreur mise à jour:', position);
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
    }, 3000);
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
  }

  // ══ Change le moyen de transport ═════════════════════════
  setMoyenTransport(moyen: MoyenTransport): void {
    this.moyenTransport.set(moyen);
    // En prod → PATCH /api/livreur/transport { moyen }
  }

  // ══ Change le statut ══════════════════════════════════════
  setStatut(statut: StatutLivreur): void {
    this.statutLivreur.set(statut);
    // En prod → PATCH /api/livreur/statut { statut }
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