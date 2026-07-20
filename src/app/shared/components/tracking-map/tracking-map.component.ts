import { Component, ChangeDetectionStrategy, signal, input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingService } from '../../../core/services/tracking.service';

declare const google: any;

@Component({
  selector: 'app-tracking-map',
  imports: [CommonModule],
  templateUrl: './tracking-map.component.html',
  styleUrl: './tracking-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingMapComponent implements OnInit, OnDestroy {
  private tracking = inject(TrackingService);

  // Inputs
  commandeId       = input.required<number>();
  restaurantLat    = input<number>(4.0483);
  restaurantLng    = input<number>(9.7043);
  restaurantNom    = input<string>('Restaurant');
  clientLat        = input<number>(4.0600);
  clientLng        = input<number>(9.7200);

  // State
  private map: any          = null;
  private markerLivreur: any = null;
  private markerResto: any   = null;
  private markerClient: any  = null;
  private directionsRenderer: any = null;
  private intervalSim: any   = null;

  readonly positionLivreur = this.tracking.positionLivreur;
  statutLivraison = signal<'VERS_RESTAURANT' | 'VERS_CLIENT' | 'ARRIVE'>('VERS_RESTAURANT');
  distanceRestante = signal('Calcul...');
  tempsRestant     = signal('...');
  chargement       = signal(true);
  erreurCarte      = signal('');

  // Simulation GPS livreur
  private simLat = 4.0483;
  private simLng = 9.7043;
  private simStep = 0;

  ngOnInit(): void {
    setTimeout(() => this.initMap(), 300);
    this.demarrerSimulation();
  }

  private async initMap(): Promise<void> {
    const el = document.getElementById('tracking-map');
    if (!el) { this.erreurCarte.set('Élément carte introuvable.'); return; }

    try {
      const { Map }                   = await google.maps.importLibrary('maps');
      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
      const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary('routes');

      this.map = new Map(el, {
        center: { lat: this.restaurantLat(), lng: this.restaurantLng() },
        zoom: 14,
        mapId: 'eatscm_tracking',
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      // Marker restaurant
      const restoEl = document.createElement('div');
      restoEl.innerHTML = `<div style="background:#FF5A36;border:3px solid white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(255,90,54,0.4);font-size:18px">🍽️</div>`;
      this.markerResto = new AdvancedMarkerElement({
        map: this.map,
        position: { lat: this.restaurantLat(), lng: this.restaurantLng() },
        title: this.restaurantNom(),
        content: restoEl,
      });

      // Marker client
      const clientEl = document.createElement('div');
      clientEl.innerHTML = `<div style="background:#3B82F6;border:3px solid white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(59,130,246,0.4);font-size:18px">🏠</div>`;
      this.markerClient = new AdvancedMarkerElement({
        map: this.map,
        position: { lat: this.clientLat(), lng: this.clientLng() },
        title: 'Votre adresse',
        content: clientEl,
      });

      // Marker livreur
      const livreurEl = document.createElement('div');
      livreurEl.className = 'livreur-marker';
      livreurEl.innerHTML = `<div style="background:#22C55E;border:3px solid white;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(34,197,94,0.5);font-size:22px;animation:pulse 1.5s ease-in-out infinite">🛵</div>`;
      this.markerLivreur = new AdvancedMarkerElement({
        map: this.map,
        position: { lat: this.simLat, lng: this.simLng },
        title: 'Votre livreur',
        content: livreurEl,
      });

      // Directions
      this.directionsRenderer = new DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeColor: '#FF5A36', strokeWeight: 4, strokeOpacity: 0.7 },
      });
      this.directionsRenderer.setMap(this.map);

      this.chargement.set(false);
      this.calculerItineraire(DirectionsService);

    } catch (err) {
      this.erreurCarte.set('Impossible de charger la carte. Vérifie ta clé Google Maps.');
      this.chargement.set(false);
    }
  }

  private async calculerItineraire(DirectionsService: any): Promise<void> {
    try {
      const svc = new DirectionsService();
      const target = this.statutLivraison() === 'VERS_RESTAURANT'
        ? { lat: this.restaurantLat(), lng: this.restaurantLng() }
        : { lat: this.clientLat(),     lng: this.clientLng()     };

      const result = await svc.route({
        origin:      { lat: this.simLat, lng: this.simLng },
        destination: target,
        travelMode:  'DRIVING',
      });

      if (this.directionsRenderer) this.directionsRenderer.setDirections(result);

      const leg = result.routes[0]?.legs[0];
      if (leg) {
        this.distanceRestante.set(leg.distance?.text ?? '—');
        this.tempsRestant.set(leg.duration?.text ?? '—');
      }
    } catch { /* Google Maps non dispo */ }
  }

  // Simule le mouvement du livreur vers le restaurant puis le client
  private demarrerSimulation(): void {
    this.intervalSim = setInterval(() => {
      this.simStep++;

      const cible = this.statutLivraison() === 'VERS_RESTAURANT' || this.statutLivraison() === 'VERS_CLIENT'
        ? this.statutLivraison() === 'VERS_RESTAURANT'
          ? { lat: this.restaurantLat(), lng: this.restaurantLng() }
          : { lat: this.clientLat(),     lng: this.clientLng()     }
        : null;

      if (!cible) return;

      // Avance de 10% vers la cible à chaque tick
      this.simLat += (cible.lat - this.simLat) * 0.12;
      this.simLng += (cible.lng - this.simLng) * 0.12;

      // Met à jour le marker livreur
      if (this.markerLivreur) {
        this.markerLivreur.position = { lat: this.simLat, lng: this.simLng };
      }

      // Signal position
      this.tracking.positionLivreur.set({
        latitude: this.simLat,
        longitude: this.simLng,
        timestamp: Date.now(),
      });

      // Vérifie si arrivé au restaurant
      const distResto = this.calculerDist(this.simLat, this.simLng, this.restaurantLat(), this.restaurantLng());
      const distClient = this.calculerDist(this.simLat, this.simLng, this.clientLat(), this.clientLng());

      if (this.statutLivraison() === 'VERS_RESTAURANT' && distResto < 0.05) {
        this.statutLivraison.set('VERS_CLIENT');
        this.distanceRestante.set('Récupération...');
        setTimeout(() => this.distanceRestante.set(`${(distClient * 1000).toFixed(0)}m`), 1500);
      }

      if (this.statutLivraison() === 'VERS_CLIENT' && distClient < 0.03) {
        this.statutLivraison.set('ARRIVE');
        this.distanceRestante.set('Arrivé !');
        this.tempsRestant.set('0 min');
        clearInterval(this.intervalSim);
      }

    }, 2000);
  }

  private calculerDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  centrerSurLivreur(): void {
    if (this.map && this.simLat) {
      this.map.panTo({ lat: this.simLat, lng: this.simLng });
      this.map.setZoom(16);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalSim) clearInterval(this.intervalSim);
    this.tracking.positionLivreur.set(null);
  }
}