import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService, Restaurant } from '../../../core/services/restaurant.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-restaurant-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametres.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametresRestaurantComponent implements OnInit {
  private restoSvc = inject(RestaurantService);
  private notif = inject(NotificationService);

  loading = signal(false);
  sauvegardeEnCours = signal(false);
  restaurant = signal<Restaurant | null>(null);

  // Formulaire
  nom = signal('');
  description = signal('');
  categorie = signal('Cuisine camerounaise');
  adresse = signal('');
  quartier = signal('');
  ville = signal('Douala');
  telephone = signal('');
  numeroMoMo = signal('');
  logoUrl = signal('');
  banniereUrl = signal('');
  tempsLivraisonMin = signal<number>(20);
  tempsLivraisonMax = signal<number>(35);
  fraisLivraison = signal<number>(1000);
  modeLivraison = signal<'PLATEFORME' | 'INTERNE' | 'MIXTE'>('PLATEFORME');
  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);

  categoriesDisponibles = [
    'Cuisine camerounaise',
    'Brochettes • Grillades',
    'Pizza • Pâtes',
    'Burgers • Fast food',
    'Poisson • Fruits de mer',
    'Plats locaux • Rapide',
    'Desserts & Pâtisseries',
    'Boissons & Cocktails',
  ];

  villesDisponibles = ['Douala', 'Yaoundé'];

  ngOnInit(): void {
    this.chargerProfil();
  }

  chargerProfil(): void {
    this.loading.set(true);
    this.restoSvc.getMonRestaurant().subscribe({
      next: (resto) => {
        this.restaurant.set(resto);
        this.nom.set(resto.nom || '');
        this.description.set(resto.description || '');
        this.categorie.set(resto.categorie || 'Cuisine camerounaise');
        this.adresse.set(resto.adresse || '');
        this.quartier.set(resto.quartier || '');
        this.ville.set(resto.ville || 'Douala');
        this.telephone.set(resto.telephone || '');
        this.numeroMoMo.set(resto.numeroMoMo || '');
        this.logoUrl.set(resto.logoUrl || '');
        this.banniereUrl.set(resto.banniereUrl || '');
        this.tempsLivraisonMin.set(resto.tempsLivraisonMin || 20);
        this.tempsLivraisonMax.set(resto.tempsLivraisonMax || 35);
        this.fraisLivraison.set(resto.fraisLivraison || 1000);
        this.modeLivraison.set((resto.modeLivraison as any) || 'PLATEFORME');
        this.latitude.set(resto.latitude || null);
        this.longitude.set(resto.longitude || null);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notif.error('Impossible de charger les informations du restaurant.');
        console.error(err);
      }
    });
  }

  onLogoUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.logoUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onBanniereUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.banniereUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  detecterGPS(): void {
    if (!navigator.geolocation) {
      this.notif.warning('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.latitude.set(pos.coords.latitude);
        this.longitude.set(pos.coords.longitude);
        this.notif.success('Position GPS mise à jour !');
      },
      (err) => {
        this.notif.error('Impossible de récupérer votre position GPS.');
        console.error(err);
      }
    );
  }

  sauvegarder(): void {
    const nomResto = this.nom().trim();
    if (!nomResto) {
      this.notif.warning('Le nom du restaurant est obligatoire.');
      return;
    }

    this.sauvegardeEnCours.set(true);
    const updates: Partial<Restaurant> = {
      nom: nomResto,
      description: this.description().trim(),
      categorie: this.categorie(),
      adresse: this.adresse().trim(),
      quartier: this.quartier().trim(),
      ville: this.ville(),
      telephone: this.telephone().trim(),
      numeroMoMo: this.numeroMoMo().trim(),
      logoUrl: this.logoUrl(),
      banniereUrl: this.banniereUrl(),
      tempsLivraisonMin: Number(this.tempsLivraisonMin()),
      tempsLivraisonMax: Number(this.tempsLivraisonMax()),
      fraisLivraison: Number(this.fraisLivraison()),
      modeLivraison: this.modeLivraison() as any,
      latitude: this.latitude() ?? undefined,
      longitude: this.longitude() ?? undefined,
    };

    this.restoSvc.updateProfil(updates).subscribe({
      next: (restoMaj) => {
        this.restaurant.set(restoMaj);
        this.sauvegardeEnCours.set(false);
        this.notif.success('Profil du restaurant mis à jour avec succès !');
      },
      error: (err) => {
        this.sauvegardeEnCours.set(false);
        this.notif.error('Erreur lors de la mise à jour du profil.');
        console.error(err);
      }
    });
  }
}
