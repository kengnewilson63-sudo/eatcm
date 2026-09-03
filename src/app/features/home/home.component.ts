import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FavorisService } from '../../core/services/favoris.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Restaurant } from '../../core/models';

interface RestaurantCardItem {
  id: number;
  nom: string;
  categorie: string;
  image: string;
  note: number;
  totalAvis: number;
  tempsLivraison: string;
  fraisLivraison: number;
  ouvert: boolean;
  certifie: boolean;
  promo?: string | null;
}

const RESTAURANTS_FALLBACK: RestaurantCardItem[] = [
  { id:1, nom:'Chez Maman Bibiane', categorie:'Cuisine camerounaise', image:'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80', note:4.8, totalAvis:312, tempsLivraison:'20-30', fraisLivraison:1000, ouvert:true,  certifie:true,  promo:'-20%' },
  { id:2, nom:'Le Grill Akwa',      categorie:'Brochettes • Grillades', image:'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80', note:4.7, totalAvis:198, tempsLivraison:'15-25', fraisLivraison:1000, ouvert:true,  certifie:false, promo:null },
  { id:3, nom:'Pizza Roma Douala',  categorie:'Pizza • Pâtes', image:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80', note:4.6, totalAvis:145, tempsLivraison:'25-35', fraisLivraison:1500, ouvert:true,  certifie:true,  promo:null },
  { id:4, nom:'Sweet Burger',       categorie:'Burgers • Fast food', image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', note:4.5, totalAvis:87,  tempsLivraison:'20-30', fraisLivraison:1200, ouvert:false, certifie:false, promo:'Nouveau' },
  { id:5, nom:'Délices du Wouri',   categorie:'Poisson • Fruits de mer', image:'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80', note:4.9, totalAvis:421, tempsLivraison:'30-45', fraisLivraison:2000, ouvert:true,  certifie:true,  promo:null },
  { id:6, nom:'Snack du Marché',    categorie:'Plats locaux • Rapide', image:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', note:4.3, totalAvis:56,  tempsLivraison:'10-20', fraisLivraison:800,  ouvert:true,  certifie:false, promo:null },
];

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private restoSvc = inject(RestaurantService);
  favoris = inject(FavorisService);

  selectedCategorie = signal<string|null>(null);
  restaurants = signal<RestaurantCardItem[]>(RESTAURANTS_FALLBACK);
  loading = signal(false);
  readonly hasResults = computed(() => this.restaurantsFiltres().length > 0);

  categories = [
    {nom:'Ndolé',      img:'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=80&q=80'},
    {nom:'Brochettes', img:'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=80&q=80'},
    {nom:'Poulet',     img:'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=80&q=80'},
    {nom:'Burgers',    img:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=80&q=80'},
    {nom:'Pizza',      img:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80&q=80'},
    {nom:'Poisson',    img:'https://images.unsplash.com/photo-1559847844-5315695dadae?w=80&q=80'},
    {nom:'Boissons',   img:'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=80&q=80'},
    {nom:'Desserts',   img:'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=80&q=80'},
  ];

  ngOnInit(): void {
    this.chargerRestaurants();
  }

  chargerRestaurants(): void {
    this.loading.set(true);
    this.restoSvc.getRestaurants().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const mapped: RestaurantCardItem[] = data.map(r => ({
            id: r.id,
            nom: r.nom,
            categorie: r.categorie || 'Cuisine variée',
            image: r.logoUrl || r.banniereUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
            note: r.note || 4.8,
            totalAvis: r.totalAvis || 0,
            tempsLivraison: `${r.tempsLivraisonMin || 20}-${r.tempsLivraisonMax || 35}`,
            fraisLivraison: r.fraisLivraison || 1000,
            ouvert: r.ouvert ?? true,
            certifie: r.certifie ?? false,
            promo: null,
          }));
          this.restaurants.set(mapped);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement restaurants:', err);
        this.loading.set(false);
      }
    });
  }

  // Filtre les restaurants selon la catégorie sélectionnée
  restaurantsFiltres = computed(() => {
    const selected = this.selectedCategorie();
    const list = this.restaurants();
    if (!selected) return list;
    return list.filter(r => r.categorie.toLowerCase().includes(selected.toLowerCase()));
  });

  selectCategorie(nom: string): void {
    this.selectedCategorie.update(v => v === nom ? null : nom);
  }

  toggleFavori(id: number, e: Event): void {
    e.preventDefault(); e.stopPropagation();
    this.favoris.toggle(id);
  }
}

