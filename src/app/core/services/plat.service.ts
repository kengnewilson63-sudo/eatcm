import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Plat } from '../models'; // 🔥 Utilise le type du modèle central

@Injectable({ providedIn: 'root' })
export class PlatService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/plats`;

  // PUBLIC — Plats d'un restaurant (pour les clients)
  getPlats(restaurantId: number): Observable<Plat[]> {
    return this.http.get<Plat[]>(`${this.apiUrl}?restaurantId=${restaurantId}`);
  }

  // PROTÉGÉ — Ajouter un plat
  createPlat(data: Partial<Plat>): Observable<Plat> {
    return this.http.post<Plat>(this.apiUrl, data);
  }

  // PROTÉGÉ — Modifier un plat
  updatePlat(id: number, data: Partial<Plat>): Observable<Plat> {
    return this.http.patch<Plat>(`${this.apiUrl}/${id}`, data);
  }

  // PROTÉGÉ — Toggle disponible / épuisé
  toggleDisponible(id: number, disponible: boolean): Observable<Plat> {
    return this.http.patch<Plat>(`${this.apiUrl}/${id}/disponible`, disponible);
  }

  // PROTÉGÉ — Supprimer un plat
  deletePlat(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}