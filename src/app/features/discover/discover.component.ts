import {
  Component, ChangeDetectionStrategy, inject, signal,
  OnInit, OnDestroy, AfterViewInit,
  ViewChildren, QueryList, ElementRef, NgZone
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommandeService } from '../../core/services/commande.service';
import { VideoService, Commentaire, VideoFeed } from '../../core/services/video.service';
import { RestaurantService, Restaurant } from '../../core/services/restaurant.service';
import { PlatService } from '../../core/services/plat.service';
import { Plat } from '../../core/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverComponent implements OnInit, AfterViewInit, OnDestroy {
  private cmdSvc   = inject(CommandeService);
  private videoSvc = inject(VideoService);
  private zone     = inject(NgZone);
  private restaurantService = inject(RestaurantService);
  private platService = inject(PlatService);

  @ViewChildren('videoRef') videoRefs!: QueryList<ElementRef<HTMLVideoElement>>;

  readonly videos = this.videoSvc.videos;

  muted          = signal(true);
  commentOpen    = signal(false);
  activeComments = signal<Commentaire[]>([]);
  activeVideoId  = signal<number | null>(null);
  nouveauComment = signal('');
  addedToCart    = signal<number | null>(null);
  videoEnPause   = signal<number | null>(null);

  restaurants    = signal<Restaurant[]>([]);
  loading        = signal(false);
  erreur         = signal('');

  private observer!: IntersectionObserver;
  private videoSub!: Subscription;

  ngOnInit(): void {
    this.chargerDonneesReelles();
  }

  private chargerDonneesReelles(): void {
    this.loading.set(true);
    this.restaurantService.getRestaurants().subscribe({
      next: (restos: Restaurant[]) => {
        this.restaurants.set(restos);
        this.loading.set(false);

        restos.forEach(r => {
          this.platService.getPlats(r.id).subscribe({
            next: (plats: Plat[]) => {
              const feedItems = plats
                .filter((p: Plat) => p.disponible)
                .map((p: Plat) => this.mapPlatToFeed(p, r));

              this.videoSvc.videos.update(current => {
                const existingIds = new Set(current.map(v => v.id));
                const nouveaux = feedItems.filter((f: VideoFeed) => !existingIds.has(f.id));
                return [...current, ...nouveaux];
              });
            },
            error: (err: any) => console.error(`Erreur plats restaurant ${r.id}:`, err)
          });
        });
      },
      error: (err: any) => {
        this.loading.set(false);
        this.erreur.set('Impossible de charger les restaurants.');
        console.error('Erreur chargement restaurants:', err);
      }
    });
  }

  /**
   * Images de secours : la base ne contient pas encore de visuels, on évite
   * donc les balises <img>/<video> vides (images cassées) en attendant que
   * les restaurants uploadent leurs propres fichiers.
   */
  private static readonly LOGO_DEFAUT =
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&q=80';
  private static readonly VIDEO_DEFAUT =
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  private static readonly IMAGES_PLATS = [
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  ];

  private mapPlatToFeed(plat: Plat, restaurant: Restaurant): VideoFeed {
    return {
      id: plat.id,
      restaurantId: restaurant.id,
      restaurantNom: restaurant.nom,
      // Un restaurant nouvellement inscrit n'a ni logo ni bannière :
      // on retombe sur une image neutre plutôt qu'une balise vide.
      restaurantLogo: restaurant.logoUrl || restaurant.banniereUrl || DiscoverComponent.LOGO_DEFAUT,
      platNom: plat.nom,
      platDescription: plat.description || '',
      prix: plat.prix,
      tempsPreparation: plat.tempsPreparation || 15,
      likes: plat.likes || 0,
      commentaires: [],
      partages: 0,
      videoUrl: plat.videoUrl || DiscoverComponent.VIDEO_DEFAUT,
      videoType: 'upload',
      liked: false,
      imageUrl: plat.imageUrl
        || DiscoverComponent.IMAGES_PLATS[plat.id % DiscoverComponent.IMAGES_PLATS.length],
    };
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
    if (this.observer) this.observer.disconnect();

    this.observer = new IntersectionObserver(
      (entries) => {
        this.zone.run(() => {
          entries.forEach(entry => {
            const video = entry.target as HTMLVideoElement;
            const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
            video.dataset['active'] = isVisible ? 'true' : 'false';

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
      { threshold: 0.5 }
    );

    this.videoRefs.forEach(ref => {
      if (ref?.nativeElement) this.observer.observe(ref.nativeElement);
    });
  }

  toggleMute(): void {
    const newMuted = !this.muted();
    this.muted.set(newMuted);

    this.videoRefs.forEach(ref => {
      const v = ref.nativeElement;
      if (v.dataset['active'] === 'true') {
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

  toggleLike(videoId: number): void {
    this.videoSvc.toggleLike(videoId);
  }

  /**
   * Une URL d'image peut être morte (lien externe, fichier supprimé) :
   * on masque alors l'image plutôt que d'afficher l'icône "image cassée".
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.visibility = 'hidden';
  }

  ouvrirCommentaires(video: VideoFeed): void {
    this.activeComments.set([...video.commentaires]);
    this.activeVideoId.set(video.id);
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

    // Le service met aussi à jour le signal local (repli optimiste).
    this.videoSvc.ajouterCommentaire(videoId, newC).subscribe();
    this.activeComments.update(c => [...c, newC]);
    this.nouveauComment.set('');

    setTimeout(() => {
      const el = document.getElementById('comments-list');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  async partager(v: VideoFeed): Promise<void> {
    const url = `${window.location.origin}/restaurant/${v.restaurantId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: v.platNom, text: `${v.platNom} — EatsCM 🍽️`, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      alert('Lien copié ! 🔗');
    }
    this.videoSvc.videos.update(list => 
      list.map(x => x.id === v.id ? { ...x, partages: x.partages + 1 } : x)
    );
  }

  commander(v: VideoFeed): void {
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

  getPromo(video: VideoFeed) {
    return video.promotion;
  }

  getTempsRestant(dateFin: string): string {
    const diff = new Date(dateFin).getTime() - Date.now();
    if (diff <= 0) return 'Expirée';
    const jours = Math.floor(diff / (1000 * 60 * 60 * 24));
    const heures = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (jours > 0) return `${jours}j ${heures}h`;
    return `${heures}h`;
  }

  onCommentChange(e: Event): void {
    this.nouveauComment.set((e.target as HTMLInputElement).value);
  }

  ngOnDestroy(): void {
    if (this.observer) this.observer.disconnect();
    if (this.videoSub) this.videoSub.unsubscribe();
  }
}