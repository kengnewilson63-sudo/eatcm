import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface PositionGPS {
  latitude: number;
  longitude: number;
  adresse: string;
  quartier: string;
  ville: string;
  indications?: string;
}

/** Chargeur du SDK Google Maps — une seule fois pour toute l'application. */
let googleMapsLoader: Promise<void> | null = null;

function chargerGoogleMaps(apiKey: string): Promise<void> {
  if (googleMapsLoader) return googleMapsLoader;
  googleMapsLoader = new Promise<void>((resolve, reject) => {
    // Deja charge (rechargement a chaud / 2e composant).
    if (typeof (window as any).google?.maps !== 'undefined') {
      resolve();
      return;
    }
    const callbackName = '__eatscmGoogleMapsReady';
    (window as any)[callbackName] = () => {
      resolve();
      delete (window as any)[callbackName];
    };
    const script = document.createElement('script');
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&libraries=places&language=fr&region=CM&loading=async&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => reject(new Error('google_maps_script_error'));
    document.head.appendChild(script);
  });
  return googleMapsLoader;
}

@Injectable({ providedIn: 'root' })
export class MapsService {
  private map: any = null;
  private marker: any = null;
  private geocoder: any = null;
  private autocompleteService: any = null;
  private iconeEatsCM: any = null;

  positionSelectionnee = signal<PositionGPS | null>(null);
  chargement = signal(false);
  erreur = signal('');
  carteChargee = signal(false);
  gpsAutorise = signal<boolean | null>(null);
  precisionGps = signal<number | null>(null);

  /** Construit l'icone orange EatsCM (SVG inline) apres chargement du SDK. */
  private creerIcone(g: any): any {
    if (this.iconeEatsCM) return this.iconeEatsCM;
    this.iconeEatsCM = {
      url:
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 44" width="36" height="44">' +
          '<path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#FF5A36"/>' +
          '<circle cx="18" cy="18" r="9" fill="white"/>' +
          '<circle cx="18" cy="18" r="5" fill="#FF5A36"/>' +
          '</svg>'
        ),
      scaledSize: new g.maps.Size(36, 44),
      anchor: new g.maps.Point(18, 44),
    };
    return this.iconeEatsCM;
  }

  // ══ INIT CARTE GOOGLE MAPS ════════════════════════════════
  async initMap(elementId: string, lat = 4.0483, lng = 9.7043): Promise<void> {
    this.erreur.set('');

    if (!environment.googleMapsApiKey) {
      this.erreur.set('carte_indisponible');
      return;
    }

    try {
      await chargerGoogleMaps(environment.googleMapsApiKey);
    } catch {
      this.erreur.set('carte_indisponible');
      return;
    }

    const g = (window as any).google;
    if (!g?.maps) {
      this.erreur.set('carte_indisponible');
      return;
    }

    // Attend que le DOM soit pret.
    await new Promise(resolve => setTimeout(resolve, 200));
    const el = document.getElementById(elementId);
    if (!el || !document.body.contains(el)) {
      this.erreur.set('element_introuvable');
      return;
    }

    try {
      const centre = { lat, lng };
      this.map = new g.maps.Map(el, {
        center: centre,
        zoom: 15,
        // On masque l'UI par defaut pour coller au design EatsCM.
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: 'greedy',
        // Style sobre : on masque les POI concurrents et le transit.
        styles: [
          { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      });

      if (!this.geocoder) this.geocoder = new g.maps.Geocoder();
      if (!this.autocompleteService) {
        this.autocompleteService = new g.maps.places.AutocompleteService();
      }

      this.marker = new g.maps.Marker({
        position: centre,
        map: this.map,
        draggable: true,
        icon: this.creerIcone(g),
        animation: g.maps.Animation.DROP,
      });

      // Glisser le marqueur → nouvelle adresse.
      this.marker.addListener('dragend', async () => {
        const pos = this.marker.getPosition();
        await this.geocoderGoogle(pos.lat(), pos.lng());
      });

      // Clic sur la carte → deplace le marqueur.
      this.map.addListener('click', async (e: any) => {
        const p = e.latLng;
        this.marker.setPosition(p);
        await this.geocoderGoogle(p.lat(), p.lng());
      });

      this.carteChargee.set(true);
      // Ne pas forcer une fausse adresse au demarrage :
      // l'utilisateur choisit via GPS ou en cliquant/glissant sur la carte.
    } catch (err) {
      console.error('Google Maps init error:', err);
      this.erreur.set('erreur_init_carte');
    }
  }

  // ══ GPS — Position actuelle ════════════════════════════════
  async maPosition(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set('');
    const fallbackDouala = { lat: 4.0483, lng: 9.7043 };

    const recentrer = (lat: number, lng: number, zoom = 15) => {
      if (this.map) { this.map.setCenter({ lat, lng }); this.map.setZoom(zoom); }
      if (this.marker) { this.marker.setPosition({ lat, lng }); }
    };

    if (!navigator.geolocation) {
      this.gpsAutorise.set(false);
      this.precisionGps.set(null);
      recentrer(fallbackDouala.lat, fallbackDouala.lng, 13);
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
          recentrer(fallbackDouala.lat, fallbackDouala.lng, 13);
          this.erreur.set('gps_refuse');
          this.chargement.set(false);
          return;
        }
      } catch { /* permissions non supportees : on tente quand meme */ }
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          this.gpsAutorise.set(true);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const precision = pos.coords.accuracy ?? 0;
          this.precisionGps.set(precision);
          this.erreur.set(precision > 1500 ? 'gps_approximatif' : '');

          recentrer(lat, lng, 17);

          try {
            await this.geocoderGoogle(lat, lng);
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
          recentrer(fallbackDouala.lat, fallbackDouala.lng, 13);
          switch (err.code) {
            case 1: this.erreur.set('gps_refuse'); break;
            case 2: this.erreur.set('gps_indisponible'); break;
            case 3: this.erreur.set('gps_timeout'); break;
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
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 }
      );
    });
  }

  // ══ GEOCODAGE INVERSÉ — Google Geocoding ══════════════════
  async geocoderGoogle(lat: number, lng: number): Promise<void> {
    if (!this.geocoder) {
      const g = (window as any).google;
      if (g?.maps) this.geocoder = new g.maps.Geocoder();
    }
    try {
      if (!this.geocoder) throw new Error('geocoder_indisponible');
      const reponse = await this.geocoder.geocode({ location: { lat, lng } });
      const resultats = reponse?.results ?? [];
      if (!resultats.length) throw new Error('aucun_resultat');

      const premier = resultats[0];
      const composants = premier.address_components ?? [];
      const chercher = (types: string[]): string =>
        composants.find((c: any) => types.some((t: string) => c.types?.includes(t)))
          ?.long_name ?? '';

      const quartier =
        chercher(['sublocality_level_1', 'sublocality', 'neighborhood']) ||
        chercher(['locality']);
      const ville =
        chercher(['locality', 'administrative_area_level_2']) || 'Douala';

      this.positionSelectionnee.set({
        latitude: lat,
        longitude: lng,
        adresse: premier.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        quartier,
        ville,
      });
    } catch {
      // Repli : coordonnees brutes, l'utilisateur garde le controle.
      this.positionSelectionnee.set({
        latitude: lat,
        longitude: lng,
        adresse: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        quartier: '',
        ville: 'Douala',
      });
    }
  }

  /** Alias — compatibilite avec l'ancien code (Nominatim). */
  async geocoderAdresse(lat: number, lng: number): Promise<void> {
    await this.geocoderGoogle(lat, lng);
  }

  async geocoderNominatim(lat: number, lng: number): Promise<void> {
    await this.geocoderGoogle(lat, lng);
  }

  // ══ AUTOCOMPLETION D'ADRESSE (Places) ═════════════════════
  /** Suggestions d'adresses pour un texte saisi (restreint au Cameroun). */
  async suggestionsAdresse(saisie: string): Promise<{ description: string; placeId: string }[]> {
    if (!saisie || saisie.trim().length < 3) return [];
    const g = (window as any).google;
    if (!g?.maps?.places) return [];
    if (!this.autocompleteService) {
      this.autocompleteService = new g.maps.places.AutocompleteService();
    }
    try {
      const reponse = await this.autocompleteService.getPlacePredictions({
        input: saisie,
        componentRestrictions: { country: 'cm' },
        language: 'fr',
      });
      return (reponse?.predictions ?? []).map((p: any) => ({
        description: p.description,
        placeId: p.place_id,
      }));
    } catch {
      return [];
    }
  }

  /** Resout un placeId (issu de l'autocompletion) en adresse + coordonnees. */
  async detailsAdresse(placeId: string): Promise<PositionGPS | null> {
    const g = (window as any).google;
    if (!g?.maps?.places) return null;
    try {
      const service = new g.maps.places.PlacesService(document.createElement('div'));
      const place: any = await new Promise((resolve, reject) => {
        service.getDetails(
          { placeId, fields: ['geometry', 'formatted_address', 'address_components'] },
          (res: any, status: any) => {
            if (status === 'OK' && res) resolve(res);
            else reject(new Error(String(status)));
          }
        );
      });

      const lat = place.geometry?.location?.lat?.();
      const lng = place.geometry?.location?.lng?.();
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const composants = place.address_components ?? [];
      const chercher = (types: string[]): string =>
        composants.find((c: any) => types.some((t: string) => c.types?.includes(t)))
          ?.long_name ?? '';
      const ville = chercher(['locality', 'administrative_area_level_2']) || 'Douala';
      const quartier =
        chercher(['sublocality_level_1', 'sublocality', 'neighborhood']) || '';

      const position: PositionGPS = {
        latitude: lat,
        longitude: lng,
        adresse: place.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        quartier,
        ville,
      };
      this.positionSelectionnee.set(position);
      if (this.map) { this.map.setCenter({ lat, lng }); this.map.setZoom(17); }
      if (this.marker) { this.marker.setPosition({ lat, lng }); }
      return position;
    } catch {
      return null;
    }
  }

  // ══ MESSAGE ERREUR LISIBLE ════════════════════════════════
  getMessageErreur(): string {
    const messages: Record<string, string> = {
      'gps_refuse': 'GPS refusé — active la localisation dans les paramètres',
      'gps_non_supporte': 'GPS non supporté sur cet appareil',
      'gps_indisponible': 'Signal GPS faible — essaie dehors ou saisis manuellement',
      'gps_timeout': 'GPS trop lent — réessaie ou saisis l\'adresse manuellement',
      'gps_erreur': 'Erreur GPS — utilise le mode Manuel',
      'gps_approximatif': 'Position approximative — déplace le marqueur pour ajuster précisément',
      'carte_indisponible': 'Carte indisponible — vérifie ta connexion ou utilise le mode Manuel',
      'element_introuvable': 'Erreur d\'affichage',
      'erreur_init_carte': 'Impossible de charger la carte',
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

  // ══ DETRUIRE LA CARTE ═════════════════════════════════════
  detruireMap(): void {
    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }
    this.map = null; // Google Maps n'expose pas de .remove() : le GC s'en charge
    this.carteChargee.set(false);
    this.positionSelectionnee.set(null);
    this.erreur.set('');
  }
}
