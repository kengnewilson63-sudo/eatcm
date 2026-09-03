import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Plat } from '../models';

@Injectable({ providedIn: 'root' })
export class PlatService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/plats`;

  private static MOCK_PLATS: Plat[] = [
    {
      id: 1,
      restaurantId: 1,
      nom: 'Ndolé au poisson fumé',
      description: 'Notre fameux ndolé avec du poisson fumé, accompagné de plantain mûr et de miondo.',
      prix: 3500,
      categorie: 'Plats traditionnels',
      imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      tempsPreparation: 20,
      disponible: true,
      populaire: true,
      likes: 245,
    },
    {
      id: 2,
      restaurantId: 2,
      nom: 'Brochettes de bœuf grillées',
      description: 'Brochettes marinées 24h aux épices locales, grillées au feu de bois.',
      prix: 2500,
      categorie: 'Grillades',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      tempsPreparation: 15,
      disponible: true,
      populaire: true,
      likes: 512,
    },
  ];

  getPlats(restaurantId: number): Observable<Plat[]> {
    return this.http.get<Plat[]>(`${this.apiUrl}?restaurantId=${restaurantId}`).pipe(
      catchError(() => of(PlatService.MOCK_PLATS.filter(p => p.restaurantId === restaurantId)))
    );
  }

  getPlat(id: number): Observable<Plat> {
    return this.http.get<Plat>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(PlatService.MOCK_PLATS.find(p => p.id === id) as Plat))
    );
  }

  createPlat(data: Partial<Plat>): Observable<Plat> {
    return this.http.post<Plat>(this.apiUrl, data).pipe(
      catchError(() => {
        const nextId = PlatService.MOCK_PLATS.reduce((max, p) => Math.max(max, p.id), 0) + 1;
        const plat: Plat = {
          id: nextId,
          restaurantId: data.restaurantId ?? 1,
          nom: data.nom ?? 'Plat du jour',
          description: data.description ?? '',
          prix: data.prix ?? 0,
          categorie: data.categorie ?? 'Plats traditionnels',
          imageUrl: data.imageUrl ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
          videoUrl: data.videoUrl ?? '',
          tempsPreparation: data.tempsPreparation ?? 15,
          disponible: data.disponible ?? true,
          populaire: data.populaire ?? false,
          likes: data.likes ?? 0,
        };
        PlatService.MOCK_PLATS = [plat, ...PlatService.MOCK_PLATS];
        return of(plat);
      })
    );
  }

  updatePlat(id: number, data: Partial<Plat>): Observable<Plat> {
    return this.http.patch<Plat>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(() => {
        const index = PlatService.MOCK_PLATS.findIndex(p => p.id === id);
        if (index === -1) return of({ ...data, id } as Plat);
        const updated = { ...PlatService.MOCK_PLATS[index], ...data, id } as Plat;
        PlatService.MOCK_PLATS[index] = updated;
        return of(updated);
      })
    );
  }

  toggleDisponible(id: number, disponible: boolean): Observable<Plat> {
    return this.http.patch<Plat>(`${this.apiUrl}/${id}/disponible`, disponible).pipe(
      catchError(() => {
        const index = PlatService.MOCK_PLATS.findIndex(p => p.id === id);
        if (index === -1) return of({} as Plat);
        PlatService.MOCK_PLATS[index] = { ...PlatService.MOCK_PLATS[index], disponible };
        return of(PlatService.MOCK_PLATS[index]);
      })
    );
  }

  deletePlat(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        PlatService.MOCK_PLATS = PlatService.MOCK_PLATS.filter(p => p.id !== id);
        return of(void 0);
      })
    );
  }
}