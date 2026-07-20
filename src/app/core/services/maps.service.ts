import { Injectable, signal } from '@angular/core';
import { PositionGPS } from '../models';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class MapsService {
  private map: any     = null;
  private marker: any  = null;
  private geocoder: any = null;
  private mapsAvailable = true;
  private readonly fallbackPosition = { lat: 4.0483, lng: 9.7043 };

  positionSelectionnee = signal<PositionGPS | null>(null);
  chargement           = signal(false);
  erreur               = signal('');

  async initMap(elementId: string, lat = 4.0483, lng = 9.7043): Promise<void> {
    const el = document.getElementById(elementId);
    if (!el) { this.erreur.set('Élément carte introuvable.'); return; }
    try {
      const { Map }                   = await (google.maps as any).importLibrary('maps');
      const { AdvancedMarkerElement } = await (google.maps as any).importLibrary('marker');
      this.map = new Map(el, {
        center: { lat, lng }, zoom: 15, mapId: 'eatscm_map',
        zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: false,
      });
      this.geocoder = new google.maps.Geocoder();
      this.marker   = new AdvancedMarkerElement({ map: this.map, position: { lat, lng }, title: 'Votre position' });
      this.map.addListener('click', (e: any) => {
        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        this.marker.position = pos;
        this.geocoderAdresse(pos.lat, pos.lng);
      });
      this.geocoderAdresse(lat, lng);
    } catch (err) {
      // Si Google Maps ne charge pas (clé manquante / restreinte), on bascule en fallback
      this.mapsAvailable = false;
      this.erreur.set('Impossible de charger la carte. Vérifie ta clé Google Maps ou utilise la localisation GPS.');
      console.warn('Maps init failed:', err);
    }
  }

  async maPosition(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set('');

    if (!navigator.geolocation) {
      this.erreur.set('Géolocalisation non disponible sur cet appareil.');
      await this.appliquerPosition(this.fallbackPosition.lat, this.fallbackPosition.lng, true);
      this.chargement.set(false);
      return;
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      await this.appliquerPosition(pos.coords.latitude, pos.coords.longitude);
      this.chargement.set(false);
    } catch (err: any) {
      const fallbackMessage = 'Position introuvable. Utilisation d\'une position par défaut.';
      if (err?.code === 1) {
        this.erreur.set('Accès à la position refusé. Autorise la localisation pour ce site puis réessaie.');
      } else if (err?.code === 2) {
        this.erreur.set(fallbackMessage);
      } else {
        this.erreur.set('Délai GPS dépassé. Utilisation d\'une position par défaut.');
      }
      await this.appliquerPosition(this.fallbackPosition.lat, this.fallbackPosition.lng, true);
      this.chargement.set(false);
    }
  }

  private async appliquerPosition(lat: number, lng: number, fallback = false): Promise<void> {
    if (this.map) {
      this.map.setCenter({ lat, lng });
      this.map.setZoom(17);
      if (this.marker) this.marker.position = { lat, lng };
    }

    if (fallback) {
      this.positionSelectionnee.set({
        latitude: lat,
        longitude: lng,
        adresse: 'Position par défaut — Douala',
        quartier: '',
        ville: 'Douala',
      });
      return;
    }

    await this.geocoderAdresse(lat, lng);
  }

  private async geocoderAdresse(lat: number, lng: number): Promise<void> {
    if (this.geocoder && typeof google !== 'undefined' && google.maps?.Geocoder) {
      try {
        const result = await this.geocoder.geocode({ location: { lat, lng } });
        if (result.results[0]) {
          const comps = result.results[0].address_components;
          let quartier = '', ville = '';
          for (const c of comps) {
            if (c.types.includes('sublocality') || c.types.includes('neighborhood')) quartier = c.long_name;
            if (c.types.includes('locality')) ville = c.long_name;
          }
          this.positionSelectionnee.set({ latitude: lat, longitude: lng, adresse: result.results[0].formatted_address, quartier, ville });
          return;
        }
      } catch (e) {
        console.warn('Google geocoder failed, falling back to nominatim', e);
      }
    }

    await this.reverseGeocodeNominatim(lat, lng);
  }

  private async reverseGeocodeNominatim(lat: number, lng: number): Promise<void> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return;
      const data = await res.json();
      const adresse = data.display_name || '';
      const comps = data.address || {};
      const quartier = comps.suburb || comps.neighbourhood || comps.village || '';
      const ville = comps.city || comps.town || comps.village || comps.county || '';
      this.positionSelectionnee.set({ latitude: lat, longitude: lng, adresse, quartier, ville });
    } catch (e) {
      console.warn('Nominatim reverse geocode failed', e);
    }
  }

  detruireMap(): void {
    this.map = null; this.marker = null; this.geocoder = null;
    this.positionSelectionnee.set(null);
  }
}
