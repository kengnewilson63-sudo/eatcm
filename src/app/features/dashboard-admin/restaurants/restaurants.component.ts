import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({ selector:'app-admin-restaurants', imports:[CommonModule], templateUrl:'./restaurants.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class RestaurantsComponent {
  restaurants = signal([
    { id:1, nom:'Chez Maman Bibiane', ville:'Douala', note:4.8, actif:true,  certifie:true,  commissionDue:0     },
    { id:2, nom:'Le Grill Akwa',      ville:'Douala', note:4.7, actif:true,  certifie:false, commissionDue:15000 },
    { id:3, nom:'Pizza Roma Douala',  ville:'Douala', note:4.6, actif:true,  certifie:true,  commissionDue:8500  },
    { id:4, nom:'Sweet Burger',       ville:'Douala', note:4.5, actif:false, certifie:false, commissionDue:0     },
  ]);
  stats = { total:4, actifs:3, enAttente:1, totalCommissions:23500 };
  toggleActif(id: number): void { this.restaurants.update(l => l.map(r => r.id===id ? {...r, actif:!r.actif} : r)); }
  certifier(id: number): void   { this.restaurants.update(l => l.map(r => r.id===id ? {...r, certifie:true} : r)); }
}
