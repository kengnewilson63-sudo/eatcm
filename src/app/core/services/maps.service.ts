import { Injectable, signal } from '@angular/core';

export interface PositionGPS {
  latitude:     number;
  longitude:    number;
  adresse:      string;
  quartier:     string;
  ville:        string;
  indications?: string;
}

declare const L: any; // Leaflet global

@Injectable({ providedIn: 'root' })
export class MapsService {

  private map:    any = null;
  private marker: any = null;

  positionSelectionnee = signal<PositionGPS | null>(null);
  chargement           = signal(false);
  erreur               = signal('');
  carteChargee         = signal(false);
  gpsAutorise          = signal<boolean | null>(null);
  precisionGps         = signal<number | null>(null);

  // ══ INIT CARTE LEAFLET ════════════════════════════════════
  async initMap(elementId: string, lat = 4.0483, lng = 9.7043): Promise<void> {
    this.erreur.set('');

    // Vérifie que Leaflet est chargé
    if (typeof L === 'undefined') {
      this.erreur.set('carte_indisponible');
      return;
    }

    // Attend que le DOM soit prêt
    await new Promise(resolve => setTimeout(resolve, 200));

    const el = document.getElementById(elementId);
    if (!el || !document.body.contains(el)) {
      this.erreur.set('element_introuvable');
      return;
    }

    // Détruit la carte existante si elle existe
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }

    try {
      // Crée la carte Leaflet avec OpenStreetMap
      this.map = L.map(elementId, {
        center:           [lat, lng],
        zoom:             15,
        zoomControl:      true,
        attributionControl: false,
      });

      // Tuiles OpenStreetMap — gratuites
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom:     19,
        attribution: '© OpenStreetMap',
      }).addTo(this.map);

      // Marker custom orange EatsCM
      const iconeCustom = L.divIcon({
        html: `
          <div style="
            width:36px;
            height:44px;
            filter:drop-shadow(0 4px 8px rgba(255,90,54,0.5));
          ">
            <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z"
                    fill="#FF5A36"/>
              <circle cx="18" cy="18" r="9" fill="white"/>
              <circle cx="18" cy="18" r="5" fill="#FF5A36"/>
            </svg>
          </div>
        `,
        className:  '',
        iconSize:   [36, 44],
        iconAnchor: [18, 44],
      });

      // Crée le marker draggable
      this.marker = L.marker([lat, lng], {
        icon:      iconeCustom,
        draggable: true,
      }).addTo(this.map);

      // Drag marker → update adresse
      this.marker.on('dragend', async () => {
        const pos = this.marker.getLatLng();
        await this.geocoderNominatim(pos.lat, pos.lng);
      });

      // Click sur carte → déplace marker
      this.map.on('click', async (e: any) => {
        this.marker.setLatLng(e.latlng);
        await this.geocoderNominatim(e.latlng.lat, e.latlng.lng);
      });

      this.carteChargee.set(true);

      // Ne pas forcer une fausse adresse globale au démarrage.
      // L'utilisateur doit soit utiliser le GPS, soit cliquer/glisser sur la carte.

    } catch (err) {
      console.error('Leaflet init error:', err);
      this.erreur.set('erreur_init_carte');
    }
  }

  // ══ GPS — Position actuelle ════════════════════════════════
  async maPosition(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set('');

    const fallbackDouala = { lat: 4.0483, lng: 9.7043 };

    if (!navigator.geolocation) {
      this.gpsAutorise.set(false);
      this.precisionGps.set(null);
      if (this.map) this.map.setView([fallbackDouala.lat, fallbackDouala.lng], 13);
      if (this.marker) this.marker.setLatLng([fallbackDouala.lat, fallbackDouala.lng]);
      this.erreur.set('gps_non_supporte');
      this.chargement.set(false);
      return;
    }

    if (navigator.permissions) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'denied') {
          this.gpsAutorise.set(false);
          this.precisionGps.set(null);
          if (this.map) this.map.setView([fallbackDouala.lat, fallbackDouala.lng], 13);
          if (this.marker) this.marker.setLatLng([fallbackDouala.lat, fallbackDouala.lng]);
          this.erreur.set('gps_refuse');
          this.chargement.set(false);
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
          const precision = pos.coords.accuracy ?? 0;
          this.precisionGps.set(precision);

          if (precision > 1500) {
            this.erreur.set('gps_approximatif');
          } else {
            this.erreur.set('');
          }

          if (this.map) {
            this.map.setView([lat, lng], 17);
          }

          if (this.marker) {
            this.marker.setLatLng([lat, lng]);
          }

          try {
            await this.geocoderNominatim(lat, lng);
          } catch {
            this.positionSelectionnee.set({
              latitude: lat,
              longitude: lng,
              adresse: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              quartier: 'Position actuelle',
              ville: 'Douala',
            });
          }

          this.chargement.set(false);
          resolve();
        },
        (err) => {
          this.gpsAutorise.set(false);
          this.precisionGps.set(null);
          if (this.map) this.map.setView([fallbackDouala.lat, fallbackDouala.lng], 13);
          if (this.marker) this.marker.setLatLng([fallbackDouala.lat, fallbackDouala.lng]);

          switch (err.code) {
            case 1: this.erreur.set('gps_refuse');       break;
            case 2: this.erreur.set('gps_indisponible'); break;
            case 3: this.erreur.set('gps_timeout');      break;
            default: this.erreur.set('gps_erreur');
          }

          this.positionSelectionnee.set({
            latitude: fallbackDouala.lat,
            longitude: fallbackDouala.lng,
            adresse: 'Douala - position de secours',
            quartier: 'Centre-ville',
            ville: 'Douala',
          });

          this.chargement.set(false);
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout:            20000,
          maximumAge:         60000,
        }
      );
    });
  }

  // ══ GÉOCODAGE NOMINATIM — gratuit, pas de clé ════════════
  async geocoderNominatim(lat: number, lng: number): Promise<void> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
        {
          headers: {
            'User-Agent': 'EatsCM-App/1.0 (livraison@eatscm.cm)',
          },
        }
      );
      const data = await res.json();

      const quartier = data.address?.suburb
        ?? data.address?.neighbourhood
        ?? data.address?.quarter
        ?? data.address?.residential
        ?? data.address?.road
        ?? '';

      const ville = data.address?.city
        ?? data.address?.town
        ?? data.address?.county
        ?? 'Douala';

      const adresse = data.display_name
        ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      this.positionSelectionnee.set({
        latitude:  lat,
        longitude: lng,
        adresse,
        quartier,
        ville,
      });

    } catch {
      // Fallback — juste les coordonnées
      this.positionSelectionnee.set({
        latitude:  lat,
        longitude: lng,
        adresse:   `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        quartier:  '',
        ville:     'Douala',
      });
    }
  }

  // ══ ALIAS pour compatibilité avec le code existant ════════
  async geocoderAdresse(lat: number, lng: number): Promise<void> {
    await this.geocoderNominatim(lat, lng);
  }

  // ══ MESSAGE ERREUR LISIBLE ════════════════════════════════
  getMessageErreur(): string {
    const messages: Record<string, string> = {
      'gps_refuse':        '🔒 GPS refusé — active la localisation dans les paramètres',
      'gps_non_supporte':  '📵 GPS non supporté sur cet appareil',
      'gps_indisponible':  '📡 Signal GPS faible — essaie dehors ou saisis manuellement',
      'gps_timeout':       '⏱️ GPS trop lent — réessaie ou saisis l\'adresse manuellement',
      'gps_erreur':        '❌ Erreur GPS — utilise le mode Manuel',
      'gps_approximatif':  '📍 Position approximative — déplace le marqueur pour ajuster précisément',
      'carte_indisponible':'🗺️ Carte indisponible — utilise le mode Manuel',
      'element_introuvable':'❌ Erreur d\'affichage',
      'erreur_init_carte': '❌ Impossible de charger la carte',
    };
    return messages[this.erreur()] ?? this.erreur();
  }

  // ══ INSTRUCTIONS GPS selon appareil ══════════════════════
  getInstructionsGPS(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad')) {
      return 'iPhone : Réglages → Confidentialité → Service de localisation → Active pour Safari/Chrome → "Lors de l\'utilisation"';
    } else if (ua.includes('android')) {
      return 'Android : Paramètres → Applications → Chrome → Autorisations → Localisation → Autoriser';
    }
    return 'Chrome desktop : Clique sur 🔒 dans la barre d\'adresse → Paramètres du site → Localisation → Autoriser';
  }

  // ══ DÉTRUIRE LA CARTE ═════════════════════════════════════
  detruireMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.marker       = null;
    this.carteChargee.set(false);
    this.positionSelectionnee.set(null);
    this.erreur.set('');
  }
}