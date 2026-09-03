import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';

interface SearchRestaurantItem {
  id: number;
  nom: string;
  categorie: string;
  image: string;
  note: number;
  fraisLivraison: number;
  ouvert: boolean;
}

const SEARCH_FALLBACK: SearchRestaurantItem[] = [
  { id:1, nom:'Chez Maman Bibiane', categorie:'Cuisine camerounaise', image:'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80', note:4.8, fraisLivraison:1000, ouvert:true },
  { id:2, nom:'Le Grill Akwa',      categorie:'Brochettes • Grillades', image:'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80', note:4.7, fraisLivraison:1000, ouvert:true },
  { id:3, nom:'Pizza Roma Douala',  categorie:'Pizza • Pâtes', image:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', note:4.6, fraisLivraison:1500, ouvert:true },
  { id:4, nom:'Sweet Burger',       categorie:'Burgers • Fast food', image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', note:4.5, fraisLivraison:1200, ouvert:false },
  { id:5, nom:'Délices du Wouri',   categorie:'Poisson • Fruits de mer', image:'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80', note:4.9, fraisLivraison:2000, ouvert:true },
  { id:6, nom:'Snack du Marché',    categorie:'Plats locaux • Rapide', image:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', note:4.3, fraisLivraison:800,  ouvert:true },
];

@Component({
  selector: 'app-search',
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit {
  private restoSvc = inject(RestaurantService);
  private route = inject(ActivatedRoute);

  searchQuery = signal('');
  allRestaurants = signal<SearchRestaurantItem[]>(SEARCH_FALLBACK);

  ngOnInit(): void {
    this.chargerRestaurants();
    this.route.queryParams.subscribe(params => {
      if (params['q']) this.searchQuery.set(params['q']);
    });
  }

  chargerRestaurants(): void {
    this.restoSvc.getRestaurants().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const mapped: SearchRestaurantItem[] = data.map(r => ({
            id: r.id,
            nom: r.nom,
            categorie: r.categorie || 'Cuisine variée',
            image: r.logoUrl || r.banniereUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
            note: r.note || 4.8,
            fraisLivraison: r.fraisLivraison || 1000,
            ouvert: r.ouvert ?? true,
          }));
          this.allRestaurants.set(mapped);
        }
      },
      error: (err) => console.error('Erreur recherche restaurants:', err)
    });
  }

  onSearch(e: Event): void {
    this.searchQuery.set((e.target as HTMLInputElement).value);
  }

  get filtered() {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.allRestaurants();
    if (!q) return list;
    return list.filter(r =>
      r.nom.toLowerCase().includes(q) || r.categorie.toLowerCase().includes(q)
    );
  }

  get hasResults(): boolean {
    return this.filtered.length > 0;
  }
}
