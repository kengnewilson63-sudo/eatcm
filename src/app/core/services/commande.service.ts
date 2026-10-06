import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande, Panier, Plat, ZONES_LIVRAISON_DEFAULT } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private http = inject(HttpClient);
  private _panier = signal<Panier | null>(null);

  readonly panier     = this._panier.asReadonly();
  readonly totalItems = computed(() => this._panier()?.items.reduce((s, i) => s + i.quantite, 0) ?? 0);
  readonly totalPrix  = computed(() => this._panier()?.total ?? 0);

  // CORRECTION #3 — Frais de livraison calculés par distance réelle
  calculerFraisParDistance(distanceKm: number): number {
    const zone = ZONES_LIVRAISON_DEFAULT.find(
      z => distanceKm >= z.distanceMinKm && distanceKm < z.distanceMaxKm
    );
    return zone?.frais ?? 1500; // Au-delà de 10km = 2500 FCFA
  }

  // Calcule distance GPS entre deux points (formule Haversine)
  calculerDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  ajouterAuPanier(plat: Plat, restaurantNom: string): void {
    const p = this._panier();
    if (p && p.restaurantId !== plat.restaurantId) {
      if (!confirm('Vider le panier et commander depuis ce restaurant ?')) return;
      this._panier.set(null);
    }
    const current = this._panier();
    if (!current) {
      this._panier.set({ restaurantId: plat.restaurantId, restaurantNom, items: [{ plat, quantite: 1, sousTotal: plat.prix }], total: plat.prix });
      return;
    }
    const idx = current.items.findIndex(i => i.plat.id === plat.id);
    const items = idx >= 0
      ? current.items.map((it, n) => n === idx ? { ...it, quantite: it.quantite+1, sousTotal: (it.quantite+1)*it.plat.prix } : it)
      : [...current.items, { plat, quantite: 1, sousTotal: plat.prix }];
    this._panier.set({ ...current, items, total: items.reduce((s, i) => s + i.sousTotal, 0) });
  }

  retirerDuPanier(platId: number): void {
    const current = this._panier();
    if (!current) return;
    const items = current.items
      .map(i => i.plat.id === platId ? { ...i, quantite: i.quantite-1, sousTotal: (i.quantite-1)*i.plat.prix } : i)
      .filter(i => i.quantite > 0);
    this._panier.set(items.length ? { ...current, items, total: items.reduce((s, i) => s + i.sousTotal, 0) } : null);
  }

  viderPanier(): void { this._panier.set(null); }

  passerCommande(data: Partial<Commande>): Observable<Commande> {
    return this.http.post<Commande>(`${environment.apiUrl}/commandes`, data);
  }
  getMesCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${environment.apiUrl}/commandes/mes-commandes`);
  }
  getById(id: number): Observable<Commande> {
    return this.http.get<Commande>(`${environment.apiUrl}/commandes/${id}`);
  }
  changerStatut(id: number, statut: string): Observable<Commande> {
    return this.http.patch<Commande>(`${environment.apiUrl}/commandes/${id}/statut`, { statut });
  }

  // ===== RESTAURANT =====

  /** GET /api/commandes/restaurant — toutes les commandes reçues. */
  getCommandesRestaurant(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${environment.apiUrl}/commandes/restaurant`);
  }

  /** GET /api/commandes/restaurant/en-cours — commandes actives. */
  getCommandesRestaurantEnCours(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${environment.apiUrl}/commandes/restaurant/en-cours`);
  }

  /** GET /api/commandes/restaurant/historique — commandes terminées/annulées. */
  getCommandesRestaurantHistorique(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${environment.apiUrl}/commandes/restaurant/historique`);
  }
}
