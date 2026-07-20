import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-search',
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit {
  searchQuery = signal('');
  constructor(private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['q']) this.searchQuery.set(params['q']);
    });
  }
  onSearch(e: Event): void { this.searchQuery.set((e.target as HTMLInputElement).value); }

  allRestaurants = [
    {id:1,nom:'Chez Maman Bibiane',categorie:'Cuisine camerounaise',image:'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',note:4.8,fraisLivraison:1000,ouvert:true},
    {id:2,nom:'Le Grill Akwa',categorie:'Brochettes • Grillades',image:'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',note:4.7,fraisLivraison:1000,ouvert:true},
    {id:3,nom:'Pizza Roma Douala',categorie:'Pizza • Pâtes',image:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',note:4.6,fraisLivraison:1500,ouvert:true},
    {id:4,nom:'Sweet Burger',categorie:'Burgers • Fast food',image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',note:4.5,fraisLivraison:1200,ouvert:false},
    {id:5,nom:'Délices du Wouri',categorie:'Poisson • Fruits de mer',image:'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80',note:4.9,fraisLivraison:2000,ouvert:true},
    {id:6,nom:'Snack du Marché',categorie:'Plats locaux • Rapide',image:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',note:4.3,fraisLivraison:800,ouvert:true},
  ];

  get filtered() {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.allRestaurants;
    return this.allRestaurants.filter(r =>
      r.nom.toLowerCase().includes(q) || r.categorie.toLowerCase().includes(q)
    );
  }
}
