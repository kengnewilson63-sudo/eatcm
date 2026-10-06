import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RestaurantService, Restaurant, DossierRestaurant } from '../../../core/services/restaurant.service';
import { NotificationService } from '../../../core/services/notification.service';

interface AdminRestaurantItem {
  id: number;
  nom: string;
  ville: string;
  telephone?: string;
  note: number;
  actif: boolean;
  certifie: boolean;
  commissionDue: number;
}

const ADMIN_RESTAURANTS_FALLBACK: AdminRestaurantItem[] = [];

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

  /** Dossier ouvert dans le modal de vérification (null = fermé). */
  dossier = signal<DossierRestaurant | null>(null);
  chargementDossier = signal(false);
  erreurDossier = signal('');

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
            telephone: r.telephone,
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
      error: (err) => {
        console.error('Erreur toggle actif restaurant:', err);
        this.notif.error('Impossible de modifier ce restaurant. Vérifie que le backend est lancé.');
      }
    });
  }

  certifier(id: number): void {
    this.restoSvc.adminToggleCertifie(id).subscribe({
      next: (updated) => {
        this.restaurants.update(l => l.map(r => r.id === id ? { ...r, certifie: updated.certifie } : r));
        this.notif.success('Statut de certification mis à jour !');
      },
      error: (err) => {
        console.error('Erreur certification restaurant:', err);
        this.notif.error('Impossible de modifier la certification.');
      }
    });
  }

  // ===== DOSSIER DE VÉRIFICATION =====

  /** Ouvre le dossier complet (CNI, façade, coordonnées) avant de valider. */
  voirDossier(id: number): void {
    this.chargementDossier.set(true);
    this.erreurDossier.set('');
    this.dossier.set(null);
    this.restoSvc.adminDossierRestaurant(id).subscribe({
      next: (d) => {
        this.dossier.set(d);
        this.chargementDossier.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement dossier:', err);
        this.erreurDossier.set('Impossible de charger le dossier de ce restaurant.');
        this.chargementDossier.set(false);
      }
    });
  }

  fermerDossier(): void {
    this.dossier.set(null);
    this.erreurDossier.set('');
  }

  /** Valide le compte depuis le modal puis referme. */
  validerDepuisDossier(id: number): void {
    this.toggleActif(id);
    this.fermerDossier();
  }
}
