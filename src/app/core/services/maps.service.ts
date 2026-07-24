import { Injectable, signal } from '@angular/core';

export interface PositionGPS {
  latitude:      number;
  longitude:     number;
  adresse:       string;
  quartier:      string;
  ville:         string;
  indications?:  string;
}

declare const google: any;

@Injectable({ providedIn: 'root' })
export class MapsService {

  private map:      any = null;
  private marker:   any = null;
  private geocoder: any = null;

  positionSelectionnee = signal<PositionGPS | null>(null);
  chargement           = signal(false);
  erreur               = signal('');
  carteChargee         = signal(false);
  gpsAutorise          = signal<boolean | null>(null); // null=inconnu, true=ok, false=refusé

  // ══ INIT CARTE ════════════════════════════════════════════
  async initMap(elementId: string, lat = 4.0483, lng = 9.7043): Promise<void> {
    this.erreur.set('');

    // Vérifie si Google Maps est chargé
    if (!this.googleMapsDisponible()) {
      this.erreur.set('google_maps_indisponible');
      return;
    }

    const el = document.getElementById(elementId);
    if (!el) { this.erreur.set('element_introuvable'); return; }

    try {
      this.map = new google.maps.Map(el, {
        center:             { lat, lng },
        zoom:               15,
        mapTypeControl:     false,
        streetViewControl:  false,
        fullscreenControl:  false,
        zoomControl:        true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });

      this.geocoder = new google.maps.Geocoder();

      // Marker draggable
      this.marker = new google.maps.Marker({
        position:  { lat, lng },
        map:       this.map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title:     'Votre position',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
              <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="#FF5A36"/>
              <circle cx="16" cy="16" r="8" fill="white"/>
              <circle cx="16" cy="16" r="4" fill="#FF5A36"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 40),
          anchor:     new google.maps.Point(16, 40),
        },
      });

      // Drag marker
      this.marker.addListener('dragend', () => {
        const pos = this.marker.getPosition();
        this.geocoderAdresse(pos.lat(), pos.lng());
      });

      // Click sur la carte
      this.map.addListener('click', (e: any) => {
        this.marker.setPosition(e.latLng);
        this.geocoderAdresse(e.latLng.lat(), e.latLng.lng());
      });

      this.carteChargee.set(true);
      await this.geocoderAdresse(lat, lng);

    } catch (err) {
      console.error('Maps init error:', err);
      this.erreur.set('erreur_init_carte');
    }
  }

  // ══ GPS — Position actuelle ════════════════════════════════
  async maPosition(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set('');

    // Vérifie si géolocalisation disponible
    if (!navigator.geolocation) {
      this.erreur.set('gps_non_supporte');
      this.chargement.set(false);
      this.gpsAutorise.set(false);
      return;
    }

    // Vérifie la permission GPS avant de demander
    if (navigator.permissions) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'denied') {
          this.erreur.set('gps_refuse');
          this.chargement.set(false);
          this.gpsAutorise.set(false);
          return;
        }
      } catch {}
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          this.gpsAutorise.set(true);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          // Centre la carte sur la position
          if (this.map) {
            this.map.setCenter({ lat, lng });
            this.map.setZoom(17);
            this.marker?.setPosition({ lat, lng });
          }

          await this.geocoderAdresse(lat, lng);
          this.chargement.set(false);
          resolve();
        },
        (err) => {
          this.gpsAutorise.set(false);
          this.chargement.set(false);

          // Messages clairs selon le code d'erreur
          switch (err.code) {
            case 1: // PERMISSION_DENIED
              this.erreur.set('gps_refuse');
              break;
            case 2: // POSITION_UNAVAILABLE
              this.erreur.set('gps_indisponible');
              break;
            case 3: // TIMEOUT
              this.erreur.set('gps_timeout');
              break;
            default:
              this.erreur.set('gps_erreur');
          }
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout:            15000,
          maximumAge:         0,
        }
      );
    });
  }

  // ══ GEOCODER — Adresse depuis coordonnées ═════════════════
  async geocoderAdresse(lat: number, lng: number): Promise<void> {
    if (!this.geocoder) {
      // Fallback sans Google Maps — utilise Nominatim (OpenStreetMap gratuit)
      await this.geocoderNominatim(lat, lng);
      return;
    }

    try {
      const result = await this.geocoder.geocode({ location: { lat, lng } });
      if (result.results[0]) {
        const comps    = result.results[0].address_components;
        let quartier   = '';
        let ville      = '';

        for (const c of comps) {
          if (c.types.includes('sublocality') || c.types.includes('neighborhood')) {
            quartier = c.long_name;
          }
          if (c.types.includes('locality')) {
            ville = c.long_name;
          }
        }

        this.positionSelectionnee.set({
          latitude:  lat,
          longitude: lng,
          adresse:   result.results[0].formatted_address,
          quartier:  quartier || 'Douala',
          ville:     ville    || 'Douala',
        });
      }
    } catch {
      await this.geocoderNominatim(lat, lng);
    }
  }

  // ══ FALLBACK — Nominatim si pas de Google Maps ════════════
  private async geocoderNominatim(lat: number, lng: number): Promise<void> {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`
      );
      const data = await res.json();

      const quartier = data.address?.suburb
        ?? data.address?.neighbourhood
        ?? data.address?.quarter
        ?? '';
      const ville    = data.address?.city
        ?? data.address?.town
        ?? 'Douala';
      const adresse  = data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      this.positionSelectionnee.set({
        latitude:  lat,
        longitude: lng,
        adresse,
        quartier,
        ville,
      });
    } catch {
      // Dernier fallback — position sans adresse
      this.positionSelectionnee.set({
        latitude:  lat,
        longitude: lng,
        adresse:   `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        quartier:  '',
        ville:     'Douala',
      });
    }
  }

  // ══ UTILS ══════════════════════════════════════════════════
  private googleMapsDisponible(): boolean {
    return typeof google !== 'undefined' && !!google.maps;
  }

  detruireMap(): void {
    this.map    = null;
    this.marker = null;
    this.geocoder = null;
    this.carteChargee.set(false);
    this.positionSelectionnee.set(null);
    this.erreur.set('');
  }

  // Message d'erreur lisible
  getMessageErreur(): string {
    const e = this.erreur();
    const messages: Record<string, string> = {
      'gps_refuse':               '🔒 GPS refusé — active la localisation dans les paramètres de ton téléphone',
      'gps_non_supporte':         '📵 GPS non supporté sur cet appareil',
      'gps_indisponible':         '📡 Signal GPS indisponible — vérifie ta connexion',
      'gps_timeout':              '⏱️ GPS trop lent — réessaie ou saisis l\'adresse manuellement',
      'gps_erreur':               '❌ Erreur GPS — utilise le mode Manuel',
      'google_maps_indisponible': '🗺️ Carte indisponible — utilise le mode Manuel',
      'element_introuvable':      '❌ Erreur d\'affichage de la carte',
      'erreur_init_carte':        '❌ Impossible de charger la carte',
    };
    return messages[e] ?? e;
  }

  // Instructions pour activer le GPS selon l'appareil
  getInstructionsGPS(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad')) {
      return 'Sur iPhone : Réglages → Confidentialité → Service de localisation → Active pour Safari/Chrome';
    } else if (ua.includes('android')) {
      return 'Sur Android : Paramètres → Applications → Chrome/Navigateur → Autorisations → Localisation → Autoriser';
    } else {
      return 'Sur Chrome : Clique sur le 🔒 cadenas dans la barre d\'adresse → Paramètres du site → Localisation → Autoriser';
    }
  }
}