import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Promotion } from '../models/promotion.model';

@Injectable({ providedIn: 'root' })
export class PromotionService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/promotions`;

  /**
   * Liste locale (source de vérité pour l'UI).
   * Elle est alimentée par le backend via `chargerByRestaurant` ; les données
   * de démo ci-dessous ne servent que de repli quand l'API est injoignable.
   */
  promotions = signal<Promotion[]>([
    {
      id: 1,
      restaurantId: 1,
      titre: '-20% sur tous les plats',
      description: 'Profitez de 20% de réduction sur l\'ensemble du menu cette semaine.',
      type: 'remise',
      valeurRemise: 20,
      codePromo: 'MAMAN20',
      dateDebut: '2026-07-28',
      dateFin: '2026-08-04',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
      actif: true,
      utilisationsMax: 100,
      utilisationsCount: 12,
      minimumCommande: 5000,
    },
    {
      id: 2,
      restaurantId: 1,
      titre: 'Livraison gratuite',
      description: 'Livraison offerte pour toute commande supérieure à 3000 FCFA.',
      type: 'livraison_gratuite',
      codePromo: 'LIVFREE',
      dateDebut: '2026-07-28',
      dateFin: '2026-08-15',
      actif: true,
      utilisationsCount: 45,
      minimumCommande: 3000,
    },
  ]);

  readonly promotionsActives = () =>
    this.promotions().filter(p => p.actif && new Date(p.dateFin) >= new Date());

  // ===== BACKEND =====

  /**
   * Charge les promotions d'un restaurant depuis l'API et met à jour le signal.
   * Repli silencieux sur les données déjà en mémoire si l'API est indisponible.
   */
  chargerByRestaurant(restaurantId: number): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.api}?restaurantId=${restaurantId}`).pipe(
      tap(liste => this.fusionner(restaurantId, liste)),
      catchError(() => of(this.getByRestaurant(restaurantId)))
    );
  }

  /** Remplace les promotions du restaurant par celles renvoyées par l'API. */
  private fusionner(restaurantId: number, liste: Promotion[]): void {
    this.promotions.update(courantes => [
      ...courantes.filter(p => p.restaurantId !== restaurantId),
      ...liste,
    ]);
  }

  /** POST /api/promotions — crée une promotion côté serveur. */
  ajouterPromotion(promo: Promotion): Observable<Promotion> {
    return this.http.post<Promotion>(this.api, promo).pipe(
      tap(created => this.promotions.update(list => [...list, created])),
      catchError(() => {
        // Repli local : l'UI reste utilisable même sans backend.
        const local = { ...promo, id: promo.id || Date.now() };
        this.promotions.update(list => [...list, local]);
        return of(local);
      })
    );
  }

  /** PATCH /api/promotions/{id} — met à jour une promotion. */
  modifierPromotion(id: number, changes: Partial<Promotion>): Observable<Promotion> {
    return this.http.patch<Promotion>(`${this.api}/${id}`, changes).pipe(
      tap(updated => this.promotions.update(list =>
        list.map(p => p.id === id ? { ...p, ...updated } : p)
      )),
      catchError(() => {
        this.promotions.update(list =>
          list.map(p => p.id === id ? { ...p, ...changes } : p)
        );
        return of({ ...changes, id } as Promotion);
      })
    );
  }

  /** DELETE /api/promotions/{id}. */
  supprimerPromotion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`).pipe(
      tap(() => this.promotions.update(list => list.filter(p => p.id !== id))),
      catchError(() => {
        this.promotions.update(list => list.filter(p => p.id !== id));
        return of(void 0);
      })
    );
  }

  /** PATCH /api/promotions/{id}/toggle — active/désactive une promotion. */
  toggleActif(id: number): Observable<Promotion> {
    return this.http.patch<Promotion>(`${this.api}/${id}/toggle`, {}).pipe(
      tap(updated => this.promotions.update(list =>
        list.map(p => p.id === id ? { ...p, ...updated } : p)
      )),
      catchError(() => {
        this.promotions.update(list =>
          list.map(p => p.id === id ? { ...p, actif: !p.actif } : p)
        );
        const courant = this.promotions().find(p => p.id === id);
        return of(courant ?? ({} as Promotion));
      })
    );
  }

  /** Récupère les promotions d'un restaurant depuis la mémoire (non bloquant). */
  getByRestaurant(restaurantId: number): Promotion[] {
    return this.promotions().filter(p => p.restaurantId === restaurantId);
  }

  /** Rafraîchit la liste locale via l'API. À appeler dans ngOnInit(). */
  recharger(restaurantId: number): void {
    this.chargerByRestaurant(restaurantId).subscribe();
  }
}