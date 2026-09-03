import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Restaurant } from '../models';

export { Restaurant };

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/restaurants`;

  private static MOCK_RESTAURANTS: Restaurant[] = [
    {
      id: 1,
      nom: 'Chez Maman Bibiane',
      description: 'Cuisine camerounaise traditionnelle faite maison.',
      categorie: 'Traditionnel',
      adresse: 'Bonanjo',
      quartier: 'Bonanjo',
      ville: 'Douala',
      logoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&q=80',
      banniereUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80',
      telephone: '+237655000001',
      numeroMoMo: '655000001',
      note: 4.8,
      totalAvis: 128,
      tempsLivraisonMin: 20,
      tempsLivraisonMax: 35,
      fraisLivraison: 1000,
      ouvert: true,
      abonnement: 'STANDARD',
      certifie: true,
      tauxCommission: 0.1,
      commissionDueTotal: 0,
      soldeWallet: 0,
      modeLivraison: 'MIXTE',
      actif: true,
      proprietaireId: 2,
    },
    {
      id: 2,
      nom: 'Le Grill Akwa',
      description: 'Grillades et plats chauds à la carte.',
      categorie: 'Grillades',
      adresse: 'Akwa',
      quartier: 'Akwa',
      ville: 'Douala',
      logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&q=80',
      banniereUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80',
      telephone: '+237655000002',
      numeroMoMo: '655000002',
      note: 4.6,
      totalAvis: 98,
      tempsLivraisonMin: 18,
      tempsLivraisonMax: 30,
      fraisLivraison: 1200,
      ouvert: true,
      abonnement: 'STANDARD',
      certifie: false,
      tauxCommission: 0.1,
      commissionDueTotal: 0,
      soldeWallet: 0,
      modeLivraison: 'MIXTE',
      actif: true,
      proprietaireId: 3,
    },
  ];

  getRestaurants(filtres?: { search?: string; categorie?: string; ville?: string; all?: boolean }): Observable<Restaurant[]> {
    let params = new HttpParams();
    if (filtres?.search) params = params.set('search', filtres.search);
    if (filtres?.categorie && filtres.categorie !== 'Tous') params = params.set('categorie', filtres.categorie);
    if (filtres?.ville) params = params.set('ville', filtres.ville);
    if (filtres?.all) params = params.set('all', 'true');

    return this.http.get<Restaurant[]>(this.apiUrl, { params }).pipe(
      catchError(() => of(RestaurantService.MOCK_RESTAURANTS))
    );
  }

  getRestaurant(id: number): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(RestaurantService.MOCK_RESTAURANTS.find(r => r.id === id) as Restaurant))
    );
  }

  // PROTÉGÉ — Créer son restaurant (juste après inscription RESTAURANT)
  createRestaurant(data: Partial<Restaurant>): Observable<Restaurant> {
    return this.http.post<Restaurant>(`${environment.apiUrl}/restaurant`, data);
  }

  // PROTÉGÉ — Modifier son profil restaurant
  updateProfil(data: Partial<Restaurant>): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${environment.apiUrl}/restaurant/profil`, data);
  }

  // PROTÉGÉ — Mettre à jour les horaires
  updateHoraires(horairesJson: string): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${environment.apiUrl}/restaurant/horaires`, horairesJson, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // PROTÉGÉ — Ouvrir/fermer le restaurant
  toggleStatut(ouvert: boolean): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${environment.apiUrl}/restaurant/statut`, ouvert, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  getMonRestaurant(): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${environment.apiUrl}/restaurant/profil`).pipe(
      catchError(() => of(RestaurantService.MOCK_RESTAURANTS[0]))
    );
  }

  // ADMIN — Liste de tous les restaurants
  adminListRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${environment.apiUrl}/admin/restaurants`);
  }

  // ADMIN — Toggle activation d'un restaurant
  adminToggleActif(id: number): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${environment.apiUrl}/admin/restaurants/${id}/toggle-actif`, {});
  }

  // ADMIN — Certifier un restaurant
  adminToggleCertifie(id: number): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${environment.apiUrl}/admin/restaurants/${id}/certifier`, {});
  }
}