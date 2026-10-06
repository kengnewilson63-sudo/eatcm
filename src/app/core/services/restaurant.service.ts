import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Restaurant } from '../models';

export { Restaurant };

/** GET /api/restaurant/stats — miroir de RestaurantStatsResponse. */
export interface RestaurantStats {
  revenuTotal: number;
  commandesTotal: number;
  commandesEnCours: number;
  noteMoyenne: number;
  tauxAcceptation: number;
  commissionDue: number;
  panierMoyen: number;
  ventes: { jour: string; revenus: number; commandes: number }[];
  platsTop: { nom: string; commandes: number; revenus: number }[];
}

/** GET /api/restaurant/invitations — invitation d'un livreur interne. */
export interface InvitationLivreur {
  id: number;
  restaurantId: number;
  livreurNom: string;
  telephone: string | null;
  email: string | null;
  token: string;
  statut: 'EN_ATTENTE' | 'ACCEPTEE' | 'EXPIREE';
  dateCreation: string;
  dateExpiration: string;
}

/** Réponse de POST /api/restaurant/inviter-livreur. */
export interface InvitationResult {
  id: number;
  token: string;
  lien: string;
  mode: string;
  envoye: boolean;
  dateExpiration: string;
  message: string;
}

/** Réponse de GET /api/admin/restaurants/{id}/dossier. */
export interface DossierRestaurant {
  id: number;
  nom: string;
  description: string | null;
  categorie: string | null;
  adresse: string | null;
  quartier: string | null;
  ville: string | null;
  telephone: string | null;
  numeroMoMo: string | null;
  photoFacade: string | null;
  actif: boolean;
  certifie: boolean;
  proprietaireId?: number;
  proprietaireNom?: string;
  proprietaireEmail?: string;
  proprietaireTelephone?: string;
  proprietaireStatut?: string;
  cniRecto: string | null;
  cniVerso: string | null;
}

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/restaurants`;

  // Aucune donnée de démo ici : le service ne renvoie que ce que dit l'API.
  // (Avant, un catchError réinjectait de faux restaurants — ce qui faisait
  // réapparaître des enseignes inexistantes après une suspension.)

  getRestaurants(filtres?: { search?: string; categorie?: string; ville?: string; all?: boolean }): Observable<Restaurant[]> {
    let params = new HttpParams();
    if (filtres?.search) params = params.set('search', filtres.search);
    if (filtres?.categorie && filtres.categorie !== 'Tous') params = params.set('categorie', filtres.categorie);
    if (filtres?.ville) params = params.set('ville', filtres.ville);
    if (filtres?.all) params = params.set('all', 'true');

    // Aucune donnée de démo : si l'API échoue on renvoie une liste vide,
    // sinon de faux restaurants s'afficheraient à la place des vrais.
    return this.http.get<Restaurant[]>(this.apiUrl, { params }).pipe(
      catchError(() => of([] as Restaurant[]))
    );
  }

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
    return this.http.get<Restaurant>(`${environment.apiUrl}/restaurant/profil`);
  }

  // ADMIN — Liste de tous les restaurants
  adminListRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${environment.apiUrl}/admin/restaurants`);
  }

  /**
   * ADMIN — Dossier complet d'un restaurant (coordonnées + CNI + façade),
   * à consulter avant de valider le compte.
   */
  adminDossierRestaurant(id: number): Observable<DossierRestaurant> {
    return this.http.get<DossierRestaurant>(`${environment.apiUrl}/admin/restaurants/${id}/dossier`);
  }

  // ADMIN — Toggle activation d'un restaurant
  adminToggleActif(id: number): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${environment.apiUrl}/admin/restaurants/${id}/toggle-actif`, {});
  }

  // ADMIN — Certifier un restaurant
  adminToggleCertifie(id: number): Observable<Restaurant> {
    return this.http.patch<Restaurant>(`${environment.apiUrl}/admin/restaurants/${id}/certifier`, {});
  }

  // PROTÉGÉ — Statistiques réelles du restaurant connecté
  getStats(): Observable<RestaurantStats> {
    return this.http.get<RestaurantStats>(`${environment.apiUrl}/restaurant/stats`);
  }

  // PROTÉGÉ — Inviter un livreur interne (SMS ou email)
  inviterLivreur(data: { nom: string; telephone?: string; email?: string; mode: 'SMS' | 'EMAIL' }): Observable<InvitationResult> {
    return this.http.post<InvitationResult>(`${environment.apiUrl}/restaurant/inviter-livreur`, data);
  }

  // PROTÉGÉ — Liste de mes invitations envoyées
  getMesInvitations(): Observable<InvitationLivreur[]> {
    return this.http.get<InvitationLivreur[]>(`${environment.apiUrl}/restaurant/invitations`);
  }
}