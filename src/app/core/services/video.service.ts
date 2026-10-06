import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Commentaire {
  id: number;
  auteur: string;
  avatar: string;
  texte: string;
  date: string;
}

export interface VideoFeed {
  id: number;
  platNom: string;
  platDescription: string;
  prix: number;
  prixOriginal?: number;        // ✅ PRIX AVANT PROMO
  promotion?: {                 // ✅ INFO PROMO
    valeurRemise: number;
    dateFin: string;
  };
  tempsPreparation: number;
  restaurantId: number;
  restaurantNom: string;
  restaurantLogo: string;
  videoUrl: string;
  videoType: 'upload' | 'youtube' | 'vimeo';
  /** Photo du plat (utilisée en secours si aucune vidéo n'est disponible). */
  imageUrl?: string;
  likes: number;
  commentaires: Commentaire[];
  partages: number;
  liked: boolean;
}

@Injectable({ providedIn: 'root' })
export class VideoService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/videos`;

  videos = signal<VideoFeed[]>([
    {
      id: 1,
      platNom: 'Ndolé au poisson fumé',
      platDescription: 'Notre fameux ndolé avec du poisson fumé, accompagné de plantain mûr et de miondo fait maison.',
      prix: 2800,                // ✅ PRIX PROMO (3500 - 20%)
      prixOriginal: 3500,        // ✅ PRIX AVANT
      promotion: {               // ✅ INFO PROMO
        valeurRemise: 20,
        dateFin: '2026-08-10',
      },
      tempsPreparation: 20,
      restaurantId: 1,
      restaurantNom: 'Chez Maman Bibiane',
      restaurantLogo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      videoType: 'upload',
      likes: 245,
      partages: 38,
      liked: false,
      commentaires: [
        { id: 1, auteur: 'Paul K.',  avatar: 'https://i.pravatar.cc/40?img=1', texte: 'Trop bon ce ndolé ', date: 'il y a 2h' },
        { id: 2, auteur: 'Marie B.', avatar: 'https://i.pravatar.cc/40?img=2', texte: "J'ai commandé hier, livraison rapide !", date: 'il y a 5h' },
      ],
    },
    {
      id: 2,
      platNom: 'Brochettes de bœuf grillées',
      platDescription: 'Brochettes marinées 24h aux épices locales, grillées au feu de bois.',
      prix: 2500,
      tempsPreparation: 15,
      restaurantId: 2,
      restaurantNom: 'Le Grill Akwa',
      restaurantLogo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      videoType: 'upload',
      likes: 512,
      partages: 92,
      liked: true,
      commentaires: [
        { id: 1, auteur: 'Sophie M.', avatar: 'https://i.pravatar.cc/40?img=4', texte: 'Ces brochettes ', date: 'il y a 1h' },
      ],
    },
    {
      id: 3,
      platNom: 'Poulet DG',
      platDescription: 'Poulet entier mijoté avec plantains dorés, poivrons et épices du chef.',
      prix: 5000,
      tempsPreparation: 35,
      restaurantId: 1,
      restaurantNom: 'Chez Maman Bibiane',
      restaurantLogo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      videoType: 'youtube',
      likes: 198,
      partages: 24,
      liked: false,
      commentaires: [
        { id: 1, auteur: 'Alice N.', avatar: 'https://i.pravatar.cc/40?img=6', texte: "Le poulet DG c'est la vie ", date: 'il y a 4h' },
      ],
    },
    {
      id: 4,
      platNom: 'Pizza 4 fromages',
      platDescription: 'Pâte fine maison, mozzarella, gorgonzola, parmesan et emmental fondus.',
      prix: 6000,
      tempsPreparation: 25,
      restaurantId: 3,
      restaurantNom: 'Pizza Roma Douala',
      restaurantLogo: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=80&q=80',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      videoType: 'vimeo',
      likes: 321,
      partages: 57,
      liked: false,
      commentaires: [],
    },
  ]);

  /**
   * Bascule le like côté serveur et met à jour le signal local.
   * Repli optimiste : le like est appliqué localement si l'API échoue.
   */
  toggleLike(videoId: number): void {
    // Optimiste — l'UI réagit immédiatement.
    this.videos.update(list => list.map(v => this.basculerLike(v, videoId)));

    this.http.post<void>(`${this.api}/${videoId}/like`, {}).subscribe({
      error: () => { /* le like local reste appliqué */ },
    });
  }

  private basculerLike(v: VideoFeed, videoId: number): VideoFeed {
    if (v.id !== videoId) return v;
    return { ...v, liked: !v.liked, likes: v.liked ? v.likes - 1 : v.likes + 1 };
  }

  /**
   * Ajoute un commentaire côté serveur et localement.
   * Le backend renvoie le commentaire persisté (avec son id définitif).
   */
  ajouterCommentaire(videoId: number, commentaire: Commentaire): Observable<Commentaire> {
    return this.http.post<Commentaire>(`${this.api}/${videoId}/commentaires`, commentaire).pipe(
      tap(created => this.insererCommentaire(videoId, created)),
      catchError(() => {
        // Repli local : le commentaire reste visible côté client.
        this.insererCommentaire(videoId, commentaire);
        return of(commentaire);
      })
    );
  }

  private insererCommentaire(videoId: number, commentaire: Commentaire): void {
    this.videos.update(list => list.map(v =>
      v.id === videoId
        ? { ...v, commentaires: [...v.commentaires, commentaire] }
        : v
    ));
  }

  ajouterVideo(video: VideoFeed): void {
    this.videos.update(list => {
      const exists = list.some(v => v.id === video.id);
      if (exists) {
        return list.map(v => v.id === video.id ? { ...v, ...video } : v);
      }
      return [video, ...list];
    });
  }

  supprimerVideo(videoId: number): void {
    this.videos.update(list => list.filter(v => v.id !== videoId));
  }
}