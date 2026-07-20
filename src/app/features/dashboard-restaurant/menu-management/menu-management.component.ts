import {
  Component, ChangeDetectionStrategy,
  signal, computed
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Plat } from '../../../core/models';

interface PlatForm {
  nom: string;
  description: string;
  prix: number | null;
  categorie: string;
  tempsPreparation: number | null;
  imageUrl: string;
  videoUrl: string;
  disponible: boolean;
  populaire: boolean;
}

@Component({
  selector: 'app-menu-management',
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './menu-management.component.html',
 
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuManagementComponent {

  plats         = signal<Plat[]>([]);
  modalOuvert   = signal(false);
  modeEdition   = signal(false);
  platEdite     = signal<Plat | null>(null);
  loading       = signal(false);
  searchQuery   = signal('');
  filtreCategorie = signal<string>('Tous');
  imagePreview  = signal<string | null>(null);
  videoPreview  = signal<string | null>(null);

  categories = ['Plats traditionnels', 'Grillades', 'Boissons', 'Entrées', 'Desserts'];

  form = signal<PlatForm>({
    nom: '',
    description: '',
    prix: null,
    categorie: 'Plats traditionnels',
    tempsPreparation: null,
    imageUrl: '',
    videoUrl: '',
    disponible: true,
    populaire: false,
  });

  readonly categoriesDisponibles = computed(() => {
    const cats = [...new Set(this.plats().map(p => p.categorie))];
    return ['Tous', ...cats];
  });

  readonly platsFiltres = computed(() => {
    let list = this.plats();
    const q = this.searchQuery().toLowerCase();
    if (q) list = list.filter(p => p.nom.toLowerCase().includes(q));
    const cat = this.filtreCategorie();
    if (cat !== 'Tous') list = list.filter(p => p.categorie === cat);
    return list;
  });

  constructor() {
    // Mock data
    this.plats.set([
      { id: 1, restaurantId: 1, nom: 'Ndolé au poisson fumé', description: 'Notre fameux ndolé avec du poisson fumé.', prix: 3500, categorie: 'Plats traditionnels', imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80', videoUrl: 'https://videos.pexels.com/video-files/3296490/3296490-uhd_1440_2560_25fps.mp4', tempsPreparation: 20, disponible: true, populaire: true, likes: 245 },
      { id: 2, restaurantId: 1, nom: 'Eru et water fufu', description: 'Eru préparé selon la tradition du Sud-Ouest.', prix: 3000, categorie: 'Plats traditionnels', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80', videoUrl: '', tempsPreparation: 25, disponible: true, populaire: false, likes: 178 },
      { id: 3, restaurantId: 1, nom: 'Brochettes de bœuf', description: 'Brochettes marinées 24h.', prix: 2500, categorie: 'Grillades', imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80', videoUrl: 'https://videos.pexels.com/video-files/4253991/4253991-uhd_1440_2560_25fps.mp4', tempsPreparation: 15, disponible: true, populaire: true, likes: 312 },
      { id: 4, restaurantId: 1, nom: 'Jus de gingembre', description: 'Gingembre frais pressé.', prix: 800, categorie: 'Boissons', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', videoUrl: '', tempsPreparation: 5, disponible: true, populaire: false, likes: 89 },
    ]);
  }

  ouvrirAjout(): void {
    this.modeEdition.set(false);
    this.platEdite.set(null);
    this.imagePreview.set(null);
    this.videoPreview.set(null);
    this.form.set({ nom: '', description: '', prix: null, categorie: 'Plats traditionnels', tempsPreparation: null, imageUrl: '', videoUrl: '', disponible: true, populaire: false });
    this.modalOuvert.set(true);
  }

  ouvrirEdition(plat: Plat): void {
    this.modeEdition.set(true);
    this.platEdite.set(plat);
    this.imagePreview.set(plat.imageUrl);
    this.videoPreview.set(plat.videoUrl || null);
    this.form.set({
      nom: plat.nom,
      description: plat.description,
      prix: plat.prix,
      categorie: plat.categorie,
      tempsPreparation: plat.tempsPreparation,
      imageUrl: plat.imageUrl,
      videoUrl: plat.videoUrl ?? '',
      disponible: plat.disponible,
      populaire: plat.populaire,
    });
    this.modalOuvert.set(true);
  }

  fermerModal(): void {
    this.modalOuvert.set(false);
  }

  onImageChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.imagePreview.set(result);
      this.form.update(f => ({ ...f, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  }

  onVideoChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.videoPreview.set(url);
    this.form.update(f => ({ ...f, videoUrl: url }));
  }

  updateForm(field: keyof PlatForm, value: any): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  sauvegarder(): void {
    const f = this.form();
    if (!f.nom || !f.prix || !f.categorie) {
      alert('Veuillez remplir les champs obligatoires (nom, prix, catégorie).');
      return;
    }

    this.loading.set(true);

    setTimeout(() => {
      if (this.modeEdition() && this.platEdite()) {
        // Modifier plat existant
        this.plats.update(list =>
          list.map(p => p.id === this.platEdite()!.id
            ? { ...p, ...f, prix: f.prix!, tempsPreparation: f.tempsPreparation! }
            : p
          )
        );
      } else {
        // Ajouter nouveau plat
        const newPlat: Plat = {
          id: Date.now(),
          restaurantId: 1,
          nom: f.nom,
          description: f.description,
          prix: f.prix!,
          categorie: f.categorie,
          imageUrl: f.imageUrl,
          videoUrl: f.videoUrl,
          tempsPreparation: f.tempsPreparation ?? 15,
          disponible: f.disponible,
          populaire: f.populaire,
          likes: 0,
        };
        this.plats.update(list => [...list, newPlat]);
      }
      this.loading.set(false);
      this.fermerModal();
    }, 800);
  }

  toggleDisponibilite(plat: Plat): void {
    this.plats.update(list =>
      list.map(p => p.id === plat.id ? { ...p, disponible: !p.disponible } : p)
    );
  }

  supprimerPlat(platId: number): void {
    if (!confirm('Supprimer ce plat ?')) return;
    this.plats.update(list => list.filter(p => p.id !== platId));
  }

  onSearchChange(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
  }
}