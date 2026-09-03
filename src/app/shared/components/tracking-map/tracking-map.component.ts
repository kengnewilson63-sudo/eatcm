import { Component, ChangeDetectionStrategy, signal, input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingService } from '../../../core/services/tracking.service';

declare const L: any;

@Component({
  selector: 'app-tracking-map',
  imports: [CommonModule],
  templateUrl: './tracking-map.component.html',
  styleUrl: './tracking-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingMapComponent implements OnInit, OnDestroy {
  private tracking = inject(TrackingService);

  commandeId       = input.required<number>();
  restaurantLat    = input<number>(4.0483);
  restaurantLng    = input<number>(9.7043);
  restaurantNom    = input<string>('Restaurant');
  clientLat        = input<number>(4.0600);
  clientLng        = input<number>(9.7200);

  private map: any = null;
  private markerLivreur: any = null;
  private markerResto: any = null;
  private markerClient: any = null;
  private routeLine: any = null;
  private intervalSim: any = null;

  readonly positionLivreur = this.tracking.positionLivreur;
  statutLivraison = signal<'VERS_RESTAURANT' | 'VERS_CLIENT' | 'ARRIVE'>('VERS_RESTAURANT');
  distanceRestante = signal('Calcul...');
  tempsRestant = signal('...');
  chargement = signal(true);
  erreurCarte = signal('');

  private simLat = 4.0483;
  private simLng = 9.7043;

  ngOnInit(): void {
    setTimeout(() => this.initMap(), 300);
    this.demarrerSimulation();
  }

  private async initMap(): Promise<void> {
    const el = document.getElementById('tracking-map');
    if (!el) {
      this.erreurCarte.set('Élément carte introuvable.');
      this.chargement.set(false);
      return;
    }

    if (typeof L === 'undefined') {
      this.erreurCarte.set('Leaflet et OpenStreetMap sont indisponibles dans ce navigateur.');
      this.chargement.set(false);
      return;
    }

    try {
      this.map = L.map('tracking-map', {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      }).setView([this.restaurantLat(), this.restaurantLng()], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(this.map);

      this.markerResto = L.marker([this.restaurantLat(), this.restaurantLng()], {
        icon: this.creerIcone('#FF5A36', '🍽️'),
      }).addTo(this.map);

      this.markerClient = L.marker([this.clientLat(), this.clientLng()], {
        icon: this.creerIcone('#3B82F6', '🏠'),
      }).addTo(this.map);

      this.markerLivreur = L.marker([this.simLat, this.simLng], {
        icon: this.creerIcone('#22C55E', '🛵', true),
      }).addTo(this.map);

      this.routeLine = L.polyline([
        [this.simLat, this.simLng],
        [this.restaurantLat(), this.restaurantLng()],
      ], {
        color: '#FF5A36',
        weight: 4,
        opacity: 0.8,
      }).addTo(this.map);

      this.chargement.set(false);
      this.calculerItineraire();
    } catch (err) {
      console.error('Leaflet tracking init error:', err);
      this.erreurCarte.set('Impossible de charger la carte OpenStreetMap.');
      this.chargement.set(false);
    }
  }

  private creerIcone(couleur: string, emoji: string, pulse = false): any {
    const pulseClass = pulse ? 'livreur-marker' : '';
    return L.divIcon({
      className: '',
      html: `
        <div class="${pulseClass}" style="
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: ${couleur};
          border: 3px solid white;
          box-shadow: 0 8px 18px rgba(0,0,0,0.18);
          font-size: 20px;
          transform: translateY(-4px);
        ">${emoji}</div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 41],
      popupAnchor: [0, -30],
    });
  }

  private calculerItineraire(): void {
    if (!this.map || !this.routeLine) {
      return;
    }

    const target = this.statutLivraison() === 'VERS_RESTAURANT'
      ? [this.restaurantLat(), this.restaurantLng()]
      : [this.clientLat(), this.clientLng()];

    this.routeLine.setLatLngs([
      [this.simLat, this.simLng],
      target,
    ]);

    const distanceKm = this.calculerDist(this.simLat, this.simLng, target[0], target[1]);
    const minutes = Math.max(1, Math.ceil((distanceKm * 60) / 18));

    if (distanceKm < 1) {
      this.distanceRestante.set(`${Math.round(distanceKm * 1000)} m`);
    } else {
      this.distanceRestante.set(`${distanceKm.toFixed(1)} km`);
    }

    this.tempsRestant.set(`${minutes} min`);
  }

  private demarrerSimulation(): void {
    this.intervalSim = setInterval(() => {
      const cible = this.statutLivraison() === 'VERS_RESTAURANT' || this.statutLivraison() === 'VERS_CLIENT'
        ? this.statutLivraison() === 'VERS_RESTAURANT'
          ? { lat: this.restaurantLat(), lng: this.restaurantLng() }
          : { lat: this.clientLat(), lng: this.clientLng() }
        : null;

      if (!cible) return;

      this.simLat += (cible.lat - this.simLat) * 0.12;
      this.simLng += (cible.lng - this.simLng) * 0.12;

      if (this.markerLivreur) {
        this.markerLivreur.setLatLng([this.simLat, this.simLng]);
      }

      if (this.map) {
        this.map.panTo([this.simLat, this.simLng], { animate: true, duration: 0.5 });
      }

      this.tracking.positionLivreur.set({
        latitude: this.simLat,
        longitude: this.simLng,
        timestamp: Date.now(),
      });

      const distResto = this.calculerDist(this.simLat, this.simLng, this.restaurantLat(), this.restaurantLng());
      const distClient = this.calculerDist(this.simLat, this.simLng, this.clientLat(), this.clientLng());

      if (this.statutLivraison() === 'VERS_RESTAURANT' && distResto < 0.05) {
        this.statutLivraison.set('VERS_CLIENT');
        this.distanceRestante.set('Récupération...');
        setTimeout(() => this.distanceRestante.set(`${(distClient * 1000).toFixed(0)} m`), 1500);
      }

      if (this.statutLivraison() === 'VERS_CLIENT' && distClient < 0.03) {
        this.statutLivraison.set('ARRIVE');
        this.distanceRestante.set('Arrivé !');
        this.tempsRestant.set('0 min');
        clearInterval(this.intervalSim);
      }

      this.calculerItineraire();
    }, 2000);
  }

  private calculerDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  centrerSurLivreur(): void {
    if (this.map && this.simLat) {
      this.map.flyTo([this.simLat, this.simLng], 15, { duration: 0.8 });
    }
  }

  ngOnDestroy(): void {
    if (this.intervalSim) clearInterval(this.intervalSim);
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.tracking.positionLivreur.set(null);
  }
}