import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Restaurant {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  adresse: string;
  quartier: string;
  ville: string;
  logoUrl: string;
  banniereUrl: string;
  telephone: string;
  numeroMoMo: string;
  note: number;
  totalAvis: number;
  tempsLivraisonMin: number;
  tempsLivraisonMax: number;
  fraisLivraison: number;
  ouvert: boolean;
  abonnement: string;
  certifie: boolean;
  tauxCommission: number;
  commissionDueTotal: number;
  modeLivraison: 'PLATEFORME' | 'INTERNE' | 'MIXTE';
  actif: boolean;
  latitude?: number;
  longitude?: number;
}

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/restaurants`;

  // PUBLIC — Liste des restaurants (pour les clients)
  getRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(this.apiUrl);
  }

  // PUBLIC — Détail d'un restaurant
  getRestaurant(id: number): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.apiUrl}/${id}`);
  }

  // PROTÉGÉ — Créer son restaurant (juste après inscription RESTAURANT)
  createRestaurant(data: Partial<Restaurant>): Observable<Restaurant> {
    return this.http.post<Restaurant>(`${environment.apiUrl}/restaurant`, data);
  }

  // PROTÉGÉ — Modifier son profil restaurant
  updateProfil(data: Partial<Restaurant>): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${environment.apiUrl}/restaurant/profil`, data);
  }

  // PROTÉGÉ — Ouvrir/fermer le restaurant
  toggleStatut(ouvert: boolean): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${environment.apiUrl}/restaurant/statut`, ouvert);
  }

  // PROTÉGÉ — Récupérer MON restaurant (connecté)
  getMonRestaurant(): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${environment.apiUrl}/restaurant/profil`);
  }
}