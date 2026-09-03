import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RestaurantService, Restaurant } from '../../../core/services/restaurant.service';
import { NotificationService } from '../../../core/services/notification.service';

interface AdminRestaurantItem {
  id: number;
  nom: string;
  ville: string;
  note: number;
  actif: boolean;
  certifie: boolean;
  commissionDue: number;
}

const ADMIN_RESTAURANTS_FALLBACK: AdminRestaurantItem[] = [
  { id:1, nom:'Chez Maman Bibiane', ville:'Douala', note:4.8, actif:true,  certifie:true,  commissionDue:0     },
  { id:2, nom:'Le Grill Akwa',      ville:'Douala', note:4.7, actif:true,  certifie:false, commissionDue:15000 },
  { id:3, nom:'Pizza Roma Douala',  ville:'Douala', note:4.6, actif:true,  certifie:true,  commissionDue:8500  },
  { id:4, nom:'Sweet Burger',       ville:'Douala', note:4.5, actif:false, certifie:false, commissionDue:0     },
];

@Component({
  selector: 'app-admin-restaurants',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './restaurants.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantsComponent implements OnInit {
  private restoSvc = inject(RestaurantService);
  private notif = inject(NotificationService);

  restaurants = signal<AdminRestaurantItem[]>(ADMIN_RESTAURANTS_FALLBACK);

  readonly stats = computed(() => {
    const list = this.restaurants();
    return {
      total: list.length,
      actifs: list.filter(r => r.actif).length,
      enAttente: list.filter(r => !r.actif).length,
      totalCommissions: list.reduce((s, r) => s + (r.commissionDue || 0), 0),
    };
  });

  ngOnInit(): void {
    this.chargerRestaurants();
  }

  chargerRestaurants(): void {
    this.restoSvc.adminListRestaurants().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          const mapped: AdminRestaurantItem[] = data.map(r => ({
            id: r.id,
            nom: r.nom,
            ville: r.ville || 'Douala',
            note: r.note || 0,
            actif: r.actif ?? true,
            certifie: r.certifie ?? false,
            commissionDue: r.commissionDueTotal || 0,
          }));
          this.restaurants.set(mapped);
        }
      },
      error: (err) => console.error('Erreur chargement admin restaurants:', err)
    });
  }

  toggleActif(id: number): void {
    this.restoSvc.adminToggleActif(id).subscribe({
      next: (updated) => {
        this.restaurants.update(l => l.map(r => r.id === id ? { ...r, actif: updated.actif } : r));
        this.notif.info(updated.actif ? 'Restaurant activé !' : 'Restaurant suspendu.');
      },
      error: () => {
        // Fallback local
        this.restaurants.update(l => l.map(r => r.id === id ? { ...r, actif: !r.actif } : r));
      }
    });
  }

  certifier(id: number): void {
    this.restoSvc.adminToggleCertifie(id).subscribe({
      next: (updated) => {
        this.restaurants.update(l => l.map(r => r.id === id ? { ...r, certifie: updated.certifie } : r));
        this.notif.success('Statut de certification mis à jour !');
      },
      error: () => {
        // Fallback local
        this.restaurants.update(l => l.map(r => r.id === id ? { ...r, certifie: true } : r));
      }
    });
  }
}
