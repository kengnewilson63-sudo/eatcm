import { Injectable, signal } from '@angular/core';

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
  likes: number;
  commentaires: Commentaire[];
  partages: number;
  liked: boolean;
}

@Injectable({ providedIn: 'root' })
export class VideoService {
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
        { id: 1, auteur: 'Paul K.',  avatar: 'https://i.pravatar.cc/40?img=1', texte: 'Trop bon ce ndolé 😍🔥', date: 'il y a 2h' },
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
        { id: 1, auteur: 'Sophie M.', avatar: 'https://i.pravatar.cc/40?img=4', texte: 'Ces brochettes 🔥🔥🔥', date: 'il y a 1h' },
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
        { id: 1, auteur: 'Alice N.', avatar: 'https://i.pravatar.cc/40?img=6', texte: "Le poulet DG c'est la vie 😭❤️", date: 'il y a 4h' },
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

  toggleLike(videoId: number): void {
    this.videos.update(list => list.map(v =>
      v.id === videoId
        ? { ...v, liked: !v.liked, likes: v.liked ? v.likes - 1 : v.likes + 1 }
        : v
    ));
  }

  ajouterCommentaire(videoId: number, commentaire: Commentaire): void {
    this.videos.update(list => list.map(v =>
      v.id === videoId
        ? { ...v, commentaires: [...v.commentaires, commentaire] }
        : v
    ));
  }

  ajouterVideo(video: VideoFeed): void {
    this.videos.update(list => [video, ...list]);
  }

  supprimerVideo(videoId: number): void {
    this.videos.update(list => list.filter(v => v.id !== videoId));
  }
}