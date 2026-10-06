import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Commande, Litige } from '../models';

/** Livreur tel qu'affiché dans le dashboard admin. */
export interface AdminLivreur {
  id: number;
  nom: string;
  telephone: string;
  verifie: boolean;
  actif: boolean;
  cashDu: number;
  livraisons: number;
  type: string;
}

/** Ligne de commission par restaurant (GET /api/admin/finances). */
export interface AdminFinanceRestaurant {
  nom: string;
  commissionDue: number;
  tauxCommission: number;
  chiffreAffaires: number;
}

/** Statistiques financières globales de la plateforme. */
export interface AdminFinanceStats {
  totalCommissions: number;
  commissionsDues: number;
  commissionsPercues: number;
  restaurantsDebiteurs: number;
}

export interface AdminFinances {
  stats: AdminFinanceStats;
  restaurants: AdminFinanceRestaurant[];
}

/**
 * Regroupe les endpoints ADMIN du backend
 * (`cm.eatscm.backend.admin.AdminController`).
 *
 * Chaque méthode retombe silencieusement sur des données vides / locales
 * quand l'API est injoignable, pour que le dashboard reste consultable
 * en développement sans backend démarré.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // ===== COMMANDES =====

  /** GET /api/admin/commandes — toutes les commandes de la plateforme. */
  getToutesLesCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.api}/admin/commandes`).pipe(
      catchError(() => of([] as Commande[]))
    );
  }

  // ===== LIVREURS =====

  /** GET /api/admin/livreurs — tous les livreurs (pool + internes). */
  getLivreurs(): Observable<AdminLivreur[]> {
    return this.http.get<AdminLivreur[]>(`${this.api}/admin/livreurs`).pipe(
      catchError(() => of([] as AdminLivreur[]))
    );
  }

  /** PATCH /api/admin/livreurs/{id}/valider — valide la CNI du livreur. */
  validerLivreur(id: number): Observable<AdminLivreur> {
    return this.http.patch<AdminLivreur>(`${this.api}/admin/livreurs/${id}/valider`, {});
  }

  /** PATCH /api/admin/livreurs/{id}/suspendre — suspend/réactive un livreur. */
  suspendreLivreur(id: number): Observable<AdminLivreur> {
    return this.http.patch<AdminLivreur>(`${this.api}/admin/livreurs/${id}/suspendre`, {});
  }

  // ===== FINANCES =====

  /** GET /api/admin/finances — commissions globales + détail par restaurant. */
  getFinances(): Observable<AdminFinances> {
    return this.http.get<AdminFinances>(`${this.api}/admin/finances`).pipe(
      catchError(() => of({
        stats: { totalCommissions: 0, commissionsDues: 0, commissionsPercues: 0, restaurantsDebiteurs: 0 },
        restaurants: [],
      } as AdminFinances))
    );
  }

  // ===== LITIGES =====

  /** GET /api/admin/litiges — toutes les réclamations. */
  getLitiges(): Observable<Litige[]> {
    return this.http.get<Litige[]>(`${this.api}/admin/litiges`).pipe(
      catchError(() => of([] as Litige[]))
    );
  }

  /** PATCH /api/admin/litiges/{id}/statut — change le statut d'un litige. */
  changerStatutLitige(id: number, statut: Litige['statut']): Observable<Litige> {
    return this.http.patch<Litige>(`${this.api}/admin/litiges/${id}/statut`, { statut });
  }
}