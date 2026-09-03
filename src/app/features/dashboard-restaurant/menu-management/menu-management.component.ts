import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Plat } from '../../../core/models';
import { VideoService, VideoFeed } from '../../../core/services/video.service';
import { PlatService } from '../../../core/services/plat.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './menu-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuManagementComponent implements OnInit {
  private videoSvc = inject(VideoService);
  private platService = inject(PlatService);
  private restaurantService = inject(RestaurantService);
  private notif = inject(NotificationService);
  private router = inject(Router);

  readonly restaurantId   = signal<number>(0);
  readonly restaurantNom  = signal('Mon Restaurant');
  readonly restaurantLogo = signal('');

  plats         = signal<Plat[]>([]);
  loading       = signal(false);
  erreur        = signal('');
  
  modalAjout    = signal(false);
  modalEdition  = signal(false);
  platEnEdition = signal<Plat | null>(null);

  // Formulaire ajout / édition
  nouveauNom          = signal('');
  nouvelleDescription = signal('');
  nouveauPrix         = signal<number | null>(null);
  nouveauTemps        = signal<number | null>(null);
  nouvelleCategorie   = signal('Plats traditionnels');
  imageSelectionnee   = signal<string | null>(null);
  videoPreview        = signal<string | null>(null);
  videoSelectionnee   = signal<string | null>(null);
  uploadLoading       = signal(false);
  uploadProgress      = signal(0);
  estPopulaire        = signal(false);

  enPromo           = signal(false);
  valeurRemisePromo = signal<number | null>(null);
  dateFinPromo      = signal('');

  categories = ['Plats traditionnels', 'Grillades', 'Boissons', 'Entrées', 'Desserts', 'Pizzas', 'Burgers', 'Poissons'];

  readonly mesVideos = computed(() =>
    this.videoSvc.videos().filter(v => v.restaurantId === this.restaurantId())
  );

  ngOnInit(): void {
    this.chargerMonRestaurant();
  }

  private chargerMonRestaurant(): void {
    this.loading.set(true);
    this.restaurantService.getMonRestaurant().subscribe({
      next: (resto) => {
        this.restaurantId.set(resto.id);
        this.restaurantNom.set(resto.nom);
        this.restaurantLogo.set(resto.logoUrl || '');
        this.chargerPlats(resto.id);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.erreur.set('Impossible de charger ton restaurant.');
        console.error(err);
      }
    });
  }

  private chargerPlats(restaurantId: number): void {
    this.platService.getPlats(restaurantId).subscribe({
      next: (plats: Plat[]) => {
        this.plats.set(plats);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.erreur.set('Erreur chargement du menu.');
        console.error(err);
      }
    });
  }

  ouvrirAjout(): void {
    this.resetModal();
    this.modalAjout.set(true);
  }

  ouvrirEdition(plat: Plat): void {
    this.platEnEdition.set(plat);
    this.nouveauNom.set(plat.nom);
    this.nouvelleDescription.set(plat.description || '');
    this.nouveauPrix.set(plat.prix);
    this.nouveauTemps.set(plat.tempsPreparation || 15);
    this.nouvelleCategorie.set(plat.categorie || 'Plats traditionnels');
    this.imageSelectionnee.set(plat.imageUrl || null);
    this.videoPreview.set(plat.videoUrl || null);
    this.estPopulaire.set(plat.populaire || false);
    this.modalEdition.set(true);
  }

  onField(field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const val = target.value;
    const checked = (target as HTMLInputElement).checked;

    switch (field) {
      case 'nom':         this.nouveauNom.set(val); break;
      case 'description': this.nouvelleDescription.set(val); break;
      case 'prix':        this.nouveauPrix.set(val ? Number(val) : null); break;
      case 'temps':       this.nouveauTemps.set(val ? Number(val) : null); break;
      case 'categorie':   this.nouvelleCategorie.set(val); break;
      case 'populaire':   this.estPopulaire.set(checked); break;
      case 'enPromo':     this.enPromo.set(checked); break;
      case 'valeurRemise': this.valeurRemisePromo.set(val ? Number(val) : null); break;
      case 'dateFinPromo': this.dateFinPromo.set(val); break;
    }
    this.erreur.set('');
  }

  onImage(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.imageSelectionnee.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onVideo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.videoSelectionnee.set(file.name);
    this.videoPreview.set(URL.createObjectURL(file));
    this.uploadLoading.set(true);
    this.uploadProgress.set(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      this.uploadProgress.set(progress);
      if (progress >= 100) {
        clearInterval(interval);
        this.uploadLoading.set(false);
      }
    }, 150);
  }

  ajouterPlat(): void {
    const nom = this.nouveauNom().trim();
    const prix = this.nouveauPrix();
    if (!nom || !prix) {
      this.notif.warning('Veuillez renseigner le nom et le prix du plat.');
      return;
    }

    const platData: Partial<Plat> = {
      restaurantId: this.restaurantId() || 1,
      nom,
      description: this.nouvelleDescription(),
      prix,
      categorie: this.nouvelleCategorie(),
      tempsPreparation: this.nouveauTemps() ?? 15,
      imageUrl: this.imageSelectionnee() ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
      videoUrl: this.videoPreview() ?? '',
      disponible: true,
      populaire: this.estPopulaire(),
      likes: 0,
    };

    this.platService.createPlat(platData).subscribe({
      next: (platCree: Plat) => {
        this.plats.update(list => [...list, platCree]);
        this.notif.success(`Plat "${platCree.nom}" ajouté avec succès !`);

        if (this.videoPreview()) {
          this.publierSurDiscover(platCree);
        }

        this.resetModal();
      },
      error: (err: any) => {
        this.notif.error("Erreur lors de l'ajout du plat.");
        console.error(err);
      }
    });
  }

  sauvegarderEdition(): void {
    const p = this.platEnEdition();
    if (!p) return;

    const nom = this.nouveauNom().trim();
    const prix = this.nouveauPrix();
    if (!nom || !prix) {
      this.notif.warning('Veuillez renseigner le nom et le prix.');
      return;
    }

    const updates: Partial<Plat> = {
      nom,
      description: this.nouvelleDescription(),
      prix,
      categorie: this.nouvelleCategorie(),
      tempsPreparation: this.nouveauTemps() ?? 15,
      imageUrl: this.imageSelectionnee() ?? p.imageUrl,
      videoUrl: this.videoPreview() ?? p.videoUrl,
      populaire: this.estPopulaire(),
    };

    this.platService.updatePlat(p.id, updates).subscribe({
      next: (platModifie: Plat) => {
        this.plats.update(list => list.map(item => item.id === p.id ? platModifie : item));
        this.notif.success(`Plat "${platModifie.nom}" mis à jour !`);
        this.modalEdition.set(false);
        this.platEnEdition.set(null);
      },
      error: (err: any) => {
        this.notif.error('Erreur lors de la modification du plat.');
        console.error(err);
      }
    });
  }

  private publierSurDiscover(plat: Plat): void {
    const prix = plat.prix;
    const videoFeed: VideoFeed = {
      id: plat.id,
      platNom: plat.nom,
      platDescription: plat.description || plat.nom,
      prix: prix,
      tempsPreparation: plat.tempsPreparation || 15,
      restaurantId: this.restaurantId(),
      restaurantNom: this.restaurantNom(),
      restaurantLogo: this.restaurantLogo() || this.imageSelectionnee() || '',
      videoUrl: this.videoPreview()!,
      videoType: 'upload',
      likes: 0,
      commentaires: [],
      partages: 0,
      liked: false,
    };

    if (this.enPromo() && this.valeurRemisePromo() && this.dateFinPromo()) {
      const prixPromo = Math.round(prix * (1 - this.valeurRemisePromo()! / 100));
      this.videoSvc.ajouterVideo({
        ...videoFeed,
        prix: prixPromo,
        prixOriginal: prix,
        promotion: {
          valeurRemise: this.valeurRemisePromo()!,
          dateFin: this.dateFinPromo(),
        },
      });
    } else {
      this.videoSvc.ajouterVideo(videoFeed);
    }
  }

  resetModal(): void {
    this.modalAjout.set(false);
    this.modalEdition.set(false);
    this.platEnEdition.set(null);
    this.nouveauNom.set('');
    this.nouvelleDescription.set('');
    this.nouveauPrix.set(null);
    this.nouveauTemps.set(null);
    this.nouvelleCategorie.set('Plats traditionnels');
    this.imageSelectionnee.set(null);
    this.videoPreview.set(null);
    this.videoSelectionnee.set(null);
    this.uploadProgress.set(0);
    this.uploadLoading.set(false);
    this.estPopulaire.set(false);
    this.enPromo.set(false);
    this.valeurRemisePromo.set(null);
    this.dateFinPromo.set('');
  }

  supprimerVideo(videoId: number): void {
    if (!confirm('Supprimer cette vidéo du feed Discover ?')) return;
    this.videoSvc.supprimerVideo(videoId);
    this.notif.info('Vidéo retirée du feed Discover.');
  }

  toggleDisponible(platId: number): void {
    const plat = this.plats().find(p => p.id === platId);
    if (!plat) return;
    const nouveauStatut = !plat.disponible;

    this.platService.toggleDisponible(platId, nouveauStatut).subscribe({
      next: () => {
        this.plats.update(list =>
          list.map(p => p.id === platId ? { ...p, disponible: nouveauStatut } : p)
        );
        this.notif.info(nouveauStatut ? `"${plat.nom}" est disponible.` : `"${plat.nom}" est marqué épuisé.`);
      },
      error: (err: any) => {
        this.notif.error('Erreur lors du changement de disponibilité.');
        console.error(err);
      }
    });
  }

  supprimerPlat(platId: number): void {
    if (!confirm('Supprimer ce plat ?')) return;

    this.platService.deletePlat(platId).subscribe({
      next: () => {
        this.plats.update(list => list.filter(p => p.id !== platId));
        this.videoSvc.supprimerVideo(platId);
        this.notif.success('Plat supprimé du menu.');
      },
      error: (err: any) => {
        this.notif.error('Erreur lors de la suppression du plat.');
        console.error(err);
      }
    });
  }
}