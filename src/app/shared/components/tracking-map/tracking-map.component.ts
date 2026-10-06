import { Component, ChangeDetectionStrategy, signal, input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingService } from '../../../core/services/tracking.service';
import { TrackingGateway } from '../../../core/realtime/tracking.gateway';
import { environment } from '../../../../environments/environment';

/** Chargeur partage du SDK Google Maps (une seule injection de script). */
let googleMapsLoader: Promise<void> | null = null;
function chargerGoogleMaps(apiKey: string): Promise<void> {
  if (googleMapsLoader) return googleMapsLoader;
  googleMapsLoader = new Promise<void>((resolve, reject) => {
    if (typeof (window as any).google?.maps !== 'undefined') { resolve(); return; }
    const cb = '__eatscmTrackingMapsReady';
    (window as any)[cb] = () => { resolve(); delete (window as any)[cb]; };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=fr&region=CM&loading=async&callback=${cb}`;
    s.async = true;
    s.onerror = () => reject(new Error('google_maps_script_error'));
    document.head.appendChild(s);
  });
  return googleMapsLoader;
}

@Component({
  selector: 'app-tracking-map',
  imports: [CommonModule],
  templateUrl: './tracking-map.component.html',
  styleUrl: './tracking-map.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingMapComponent implements OnInit, OnDestroy {
  private tracking = inject(TrackingService);
  private gateway = inject(TrackingGateway);

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
  /** Désabonnement du topic WebSocket de position. */
  private desabonnerPosition: (() => void) | null = null;
  /** Passe à true dès qu'une vraie position arrive : on arrête alors la simulation. */
  private positionReelleRecue = false;

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
    // On s'abonne d'abord au flux temps réel : si une vraie position arrive,
    // la simulation s'arrête d'elle-même (voir appliquerPosition).
    this.ecouterPositionReelle();
    // Repli : animation locale tant qu'aucune position réelle n'est reçue.
    this.demarrerSimulation();
  }

  /**
   * Abonnement au topic `/topic/commande/{id}/position` publié par le backend
   * (RealtimeService) à chaque `POST /api/livreur/position` du livreur.
   */
  private ecouterPositionReelle(): void {
    const topic = `/topic/commande/${this.commandeId()}/position`;
    this.desabonnerPosition = this.gateway.souscrire(topic, (message) => {
      const body = message.body ?? {};
      const lat = Number(body.latitude ?? body.lat);
      const lng = Number(body.longitude ?? body.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      this.appliquerPosition(lat, lng, Number(body.timestamp) || Date.now());
    });
  }

  /**
   * Applique une position reçue du livreur : marqueur, carte, ETA.
   * La première position réelle reçue coupe la simulation.
   */
  private appliquerPosition(lat: number, lng: number, timestamp: number): void {
    if (!this.positionReelleRecue) {
      this.positionReelleRecue = true;
      if (this.intervalSim) { clearInterval(this.intervalSim); this.intervalSim = null; }
    }

    this.simLat = lat;
    this.simLng = lng;

    if (this.markerLivreur) this.markerLivreur.setPosition({ lat, lng });
    if (this.map) this.map.panTo({ lat, lng });

    this.tracking.positionLivreur.set({ latitude: lat, longitude: lng, timestamp });
    this.calculerItineraire();
  }

  private async initMap(): Promise<void> {
    const el = document.getElementById('tracking-map');
    if (!el) {
      this.erreurCarte.set('Élément carte introuvable.');
      this.chargement.set(false);
      return;
    }

    if (!environment.googleMapsApiKey) {
      this.erreurCarte.set('Carte Google Maps non configurée.');
      this.chargement.set(false);
      return;
    }

    try {
      await chargerGoogleMaps(environment.googleMapsApiKey);
    } catch {
      this.erreurCarte.set('Impossible de charger Google Maps.');
      this.chargement.set(false);
      return;
    }

    const g = (window as any).google;
    if (!g?.maps) {
      this.erreurCarte.set('Google Maps est indisponible dans ce navigateur.');
      this.chargement.set(false);
      return;
    }

    try {
      const resto = { lat: this.restaurantLat(), lng: this.restaurantLng() };
      this.map = new g.maps.Map(el, {
        center: resto,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: 'greedy',
        styles: [
          { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit',      stylers: [{ visibility: 'off' }] },
        ],
      });

      this.markerResto = new g.maps.Marker({
        position: resto,
        map: this.map,
        icon: this.creerIcone(g, '#FF5A36', '🍽️'),
      });

      this.markerClient = new g.maps.Marker({
        position: { lat: this.clientLat(), lng: this.clientLng() },
        map: this.map,
        icon: this.creerIcone(g, '#3B82F6', '🏠'),
      });

      this.markerLivreur = new g.maps.Marker({
        position: { lat: this.simLat, lng: this.simLng },
        map: this.map,
        icon: this.creerIcone(g, '#22C55E', '🛵', true),
      });

      this.routeLine = new g.maps.Polyline({
        path: [
          { lat: this.simLat, lng: this.simLng },
          resto,
        ],
        strokeColor: '#FF5A36',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        map: this.map,
      });

      this.chargement.set(false);
      this.calculerItineraire();
    } catch (err) {
      console.error('Google Maps tracking init error:', err);
      this.erreurCarte.set('Impossible de charger la carte Google Maps.');
      this.chargement.set(false);
    }
  }

  private creerIcone(g: any, couleur: string, emoji: string, pulse = false): any {
    const pulseClass = pulse ? 'livreur-marker' : '';
    // Google Maps n'accepte pas de HTML dans un marqueur : on rend le badge
    // en SVG (data URL) pour garder le rendu rond + emoji.
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="18" fill="${couleur}" stroke="white" stroke-width="3"/>
        <text x="21" y="27" font-size="20" text-anchor="middle">${emoji}</text>
      </svg>`;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new g.maps.Size(42, 42),
      anchor: new g.maps.Point(21, 41),
      className: pulseClass,
    };
  }

  private calculerItineraire(): void {
    if (!this.map || !this.routeLine) {
      return;
    }

    const target = this.statutLivraison() === 'VERS_RESTAURANT'
      ? [this.restaurantLat(), this.restaurantLng()]
      : [this.clientLat(), this.clientLng()];

    this.routeLine.setPath([
      { lat: this.simLat, lng: this.simLng },
      { lat: target[0], lng: target[1] },
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
        this.markerLivreur.setPosition({ lat: this.simLat, lng: this.simLng });
      }

      if (this.map) {
        this.map.panTo({ lat: this.simLat, lng: this.simLng });
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
      this.map.panTo({ lat: this.simLat, lng: this.simLng });
      this.map.setZoom(15);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalSim) clearInterval(this.intervalSim);
    // Coupe l'abonnement WebSocket pour ne pas laisser fuir l'écouteur.
    this.desabonnerPosition?.();
    this.desabonnerPosition = null;
    // Google Maps n'expose pas de .remove() : on detache les references.
    if (this.markerLivreur) this.markerLivreur.setMap(null);
    if (this.markerResto)   this.markerResto.setMap(null);
    if (this.markerClient)  this.markerClient.setMap(null);
    if (this.routeLine)     this.routeLine.setMap(null);
    this.markerLivreur = null;
    this.markerResto = null;
    this.markerClient = null;
    this.routeLine = null;
    this.map = null;
    this.tracking.positionLivreur.set(null);
  }
}