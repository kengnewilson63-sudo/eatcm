import {
  Component, ChangeDetectionStrategy, inject, signal,
  OnInit, OnDestroy, AfterViewInit,
  ViewChildren, QueryList, ElementRef, NgZone
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommandeService } from '../../core/services/commande.service';
import { Subscription } from 'rxjs';

export interface Commentaire {
  id: number;
  auteur: string;
  avatar: string;
  texte: string;
  date: string;
}

export interface VideoPlat {
  id: number;
  platNom: string;
  platDescription: string;
  prix: number;
  tempsPreparation: number;
  restaurantId: number;
  restaurantNom: string;
  restaurantLogo: string;
  videoUrl: string;
  likes: number;
  commentaires: Commentaire[];
  partages: number;
  liked: boolean;
}

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverComponent implements OnInit, AfterViewInit, OnDestroy {
  private cmdSvc = inject(CommandeService);
  private zone   = inject(NgZone);

  @ViewChildren('videoRef') videoRefs!: QueryList<ElementRef<HTMLVideoElement>>;

  videos         = signal<VideoPlat[]>([]);
  muted          = signal(true);
  commentOpen    = signal(false);
  activeComments = signal<Commentaire[]>([]);
  activeVideoId  = signal<number | null>(null);
  nouveauComment = signal('');
  addedToCart    = signal<number | null>(null);
  videoEnPause   = signal<number | null>(null);

  private observer!: IntersectionObserver;
  private videoSub!: Subscription;

  ngOnInit(): void {
    this.videos.set([
      {
        id: 1,
        platNom: 'Ndolé au poisson fumé',
        platDescription: 'Notre fameux ndolé avec du poisson fumé, accompagné de plantain mûr et de miondo fait maison.',
        prix: 3500, tempsPreparation: 20,
        restaurantId: 1,
        restaurantNom: 'Chez Maman Bibiane',
        restaurantLogo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        likes: 245, partages: 38, liked: false,
        commentaires: [
          { id: 1, auteur: 'Paul K.',  avatar: 'https://i.pravatar.cc/40?img=1', texte: 'Trop bon ce ndolé 😍🔥', date: 'il y a 2h' },
          { id: 2, auteur: 'Marie B.', avatar: 'https://i.pravatar.cc/40?img=2', texte: "J'ai commandé hier, livraison rapide !", date: 'il y a 5h' },
        ],
      },
      {
        id: 2,
        platNom: 'Brochettes de bœuf grillées',
        platDescription: 'Brochettes marinées 24h aux épices locales, grillées au feu de bois.',
        prix: 2500, tempsPreparation: 15,
        restaurantId: 2,
        restaurantNom: 'Le Grill Akwa',
        restaurantLogo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        likes: 512, partages: 92, liked: true,
        commentaires: [
          { id: 1, auteur: 'Sophie M.', avatar: 'https://i.pravatar.cc/40?img=4', texte: 'Ces brochettes 🔥🔥🔥', date: 'il y a 1h' },
        ],
      },
      {
        id: 3,
        platNom: 'Poulet DG',
        platDescription: 'Poulet entier mijoté avec plantains dorés, poivrons et épices du chef.',
        prix: 5000, tempsPreparation: 35,
        restaurantId: 1,
        restaurantNom: 'Chez Maman Bibiane',
        restaurantLogo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        likes: 198, partages: 24, liked: false,
        commentaires: [
          { id: 1, auteur: 'Alice N.', avatar: 'https://i.pravatar.cc/40?img=6', texte: "Le poulet DG c'est la vie 😭❤️", date: 'il y a 4h' },
        ],
      },
      {
        id: 4,
        platNom: 'Pizza 4 fromages',
        platDescription: 'Pâte fine maison, mozzarella, gorgonzola, parmesan et emmental fondus.',
        prix: 6000, tempsPreparation: 25,
        restaurantId: 3,
        restaurantNom: 'Pizza Roma Douala',
        restaurantLogo: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=80&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
        likes: 321, partages: 57, liked: false,
        commentaires: [],
      },
    ]);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.setupObserver();
      this.videoSub = this.videoRefs.changes.subscribe(() => {
        this.setupObserver();
      });
    }, 300);
  }

  private setupObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        this.zone.run(() => {
          entries.forEach(entry => {
            const video = entry.target as HTMLVideoElement;
            const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.6;

            video.dataset['visible'] = isVisible ? 'true' : 'false';

            if (isVisible) {
              video.muted = this.muted();
              video.play().catch(() => {});
            } else {
              video.pause();
              if (this.videoEnPause() === Number(video.dataset['id'])) {
                this.videoEnPause.set(null);
              }
            }
          });
        });
      },
      { threshold: 0.6 }
    );

    this.videoRefs.forEach(ref => {
      if (ref?.nativeElement) this.observer.observe(ref.nativeElement);
    });
  }

  toggleMute(): void {
    const newMuted = !this.muted();
    this.muted.set(newMuted);

    // Applique uniquement sur la vidéo visible (active)
    this.videoRefs.forEach(ref => {
      const v = ref.nativeElement;
      if (v.dataset['visible'] === 'true') {
        v.muted = newMuted;
        if (!newMuted && v.paused) {
          v.play().catch(() => {
            v.muted = true;
            this.muted.set(true);
          });
        }
      } else {
        v.muted = true;
      }
    });
  }

  togglePlay(videoId: number): void {
    this.videoRefs.forEach(ref => {
      const v = ref.nativeElement;
      if (v.dataset['id'] === String(videoId)) {
        if (v.paused) {
          v.play().catch(() => {});
          this.videoEnPause.set(null);
        } else {
          v.pause();
          this.videoEnPause.set(videoId);
        }
      }
    });
  }

  toggleLike(v: VideoPlat): void {
    this.videos.update(list => list.map(x =>
      x.id === v.id
        ? { ...x, liked: !x.liked, likes: x.liked ? x.likes - 1 : x.likes + 1 }
        : x
    ));
  }

  ouvrirCommentaires(v: VideoPlat): void {
    const video = this.videos().find(x => x.id === v.id);
    this.activeComments.set(video ? [...video.commentaires] : []);
    this.activeVideoId.set(v.id);
    this.commentOpen.set(true);

    setTimeout(() => {
      const el = document.getElementById('comments-list');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  fermerCommentaires(): void {
    this.commentOpen.set(false);
    this.nouveauComment.set('');
    this.activeVideoId.set(null);
  }

  ajouterCommentaire(): void {
    const texte = this.nouveauComment().trim();
    const videoId = this.activeVideoId();

    if (!texte || !videoId) return;

    const newC: Commentaire = {
      id: Date.now(),
      auteur: 'Moi',
      avatar: 'https://i.pravatar.cc/40?img=10',
      texte,
      date: "à l'instant",
    };

    // Met à jour la source videos()
    this.videos.update(list => list.map(v =>
      v.id === videoId
        ? { ...v, commentaires: [...v.commentaires, newC] }
        : v
    ));

    // Met à jour le panel en direct
    this.activeComments.update(c => [...c, newC]);
    this.nouveauComment.set('');

    setTimeout(() => {
      const el = document.getElementById('comments-list');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  async partager(v: VideoPlat): Promise<void> {
    const url = `${window.location.origin}/restaurant/${v.restaurantId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: v.platNom, text: `${v.platNom} — EatsCM 🍽️`, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      alert('Lien copié ! 🔗');
    }
    this.videos.update(l => l.map(x => x.id === v.id ? { ...x, partages: x.partages + 1 } : x));
  }

  commander(v: VideoPlat): void {
    this.cmdSvc.ajouterAuPanier({
      id: v.id,
      restaurantId: v.restaurantId,
      nom: v.platNom,
      description: v.platDescription,
      prix: v.prix,
      categorie: 'Plats',
      imageUrl: '',
      tempsPreparation: v.tempsPreparation,
      disponible: true,
      populaire: true,
      likes: v.likes,
    }, v.restaurantNom);

    this.addedToCart.set(v.id);
    setTimeout(() => this.addedToCart.set(null), 2500);
  }

  formatCount(n: number): string {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  }

  onCommentChange(e: Event): void {
    this.nouveauComment.set((e.target as HTMLInputElement).value);
  }

  ngOnDestroy(): void {
    if (this.observer) this.observer.disconnect();
    if (this.videoSub) this.videoSub.unsubscribe();
  }
}