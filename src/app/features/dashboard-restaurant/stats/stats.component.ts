import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RestaurantService, RestaurantStats } from '../../../core/services/restaurant.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({ selector:'app-dr-stats', imports:[CommonModule, DecimalPipe], templateUrl:'./stats.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class StatsComponent implements OnInit {
  private restoSvc = inject(RestaurantService);
  private notif = inject(NotificationService);

  loading = signal(true);

  stats = signal<RestaurantStats>({
    revenuTotal: 0, commandesTotal: 0, commandesEnCours: 0, noteMoyenne: 0,
    tauxAcceptation: 0, commissionDue: 0, panierMoyen: 0, ventes: [], platsTop: [],
  });

  ventes = signal<{ jour: string; revenus: number; commandes: number }[]>([]);
  platsTop = signal<{ nom: string; commandes: number; revenus: number }[]>([]);

  ngOnInit(): void {
    this.restoSvc.getStats().subscribe({
      next: s => {
        this.stats.set(s);
        this.ventes.set(s.ventes ?? []);
        this.platsTop.set(s.platsTop ?? []);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.notif.error('Impossible de charger les statistiques');
        console.error(err);
      }
    });
  }

  get maxRevenu(): number { return Math.max(...this.ventes().map(v => v.revenus), 1); }
  get maxPlat(): number { return Math.max(...this.platsTop().map(p => p.commandes), 1); }
  barHeight(r: number): number { return Math.round((r / this.maxRevenu) * 100); }
}
