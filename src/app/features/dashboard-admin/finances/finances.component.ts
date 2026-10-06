import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { AdminFinanceRestaurant, AdminFinanceStats, AdminService } from '../../../core/services/admin.service';

const STATS_VIDE: AdminFinanceStats = {
  totalCommissions: 0, commissionsDues: 0, commissionsPercues: 0, restaurantsDebiteurs: 0,
};

@Component({ selector:'app-admin-finances', imports:[CommonModule, DecimalPipe], templateUrl:'./finances.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class FinancesComponent implements OnInit {
  private adminSvc = inject(AdminService);

  stats = signal<AdminFinanceStats>(STATS_VIDE);
  restaurants = signal<AdminFinanceRestaurant[]>([]);

  ngOnInit(): void {
    this.adminSvc.getFinances().subscribe({
      next: finances => {
        this.stats.set(finances.stats ?? STATS_VIDE);
        this.restaurants.set(finances.restaurants ?? []);
      },
      error: () => { /* données vides conservées */ },
    });
  }
}
