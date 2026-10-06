import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { Commande } from '../../../core/models';

@Component({ selector:'app-admin-commandes', imports:[CommonModule, DecimalPipe], changeDetection:ChangeDetectionStrategy.OnPush,
template:`<div class="page-enter space-y-5"><h2 class="text-xl font-extrabold text-secondary">Toutes les commandes</h2><div class="grid grid-cols-2 md:grid-cols-4 gap-4"><div class="dashboard-card"><p class="text-xs font-bold text-muted uppercase mb-1">Aujourd'hui</p><p class="text-2xl font-extrabold text-secondary">{{ stats().aujourdhui }}</p></div><div class="dashboard-card border-l-4 border-success"><p class="text-xs font-bold text-muted uppercase mb-1">Livrées</p><p class="text-2xl font-extrabold text-success">{{ stats().livrees }}</p></div><div class="dashboard-card border-l-4 border-amber-400"><p class="text-xs font-bold text-muted uppercase mb-1">En cours</p><p class="text-2xl font-extrabold text-amber-500">{{ stats().enCours }}</p></div><div class="dashboard-card border-l-4 border-primary"><p class="text-xs font-bold text-muted uppercase mb-1">Revenus</p><p class="text-xl font-extrabold text-primary">{{ stats().revenus | number }} FCFA</p></div></div>@if (commandes().length === 0) {<div class="dashboard-card text-center py-12"><p class="text-4xl mb-3">📦</p><p class="font-bold text-secondary mb-2">Aucune commande</p><p class="text-sm text-muted">Les commandes apparaîtront ici dès qu'elles seront passées.</p></div>}@else {<div class="space-y-3">@for (c of commandes(); track c.id) {<div class="dashboard-card"><div class="flex items-center justify-between gap-3"><div><p class="font-bold text-secondary">#{{ c.id }} • Restaurant #{{ c.restaurantId }}</p><p class="text-xs text-muted">{{ c.lignes.length }} article(s) • {{ c.modePaiement }}</p></div><div class="text-right"><p class="font-extrabold text-primary">{{ c.montantTotal | number }} FCFA</p><span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{{ c.statut }}</span></div></div></div>}</div>}</div>` })
export class CommandesComponent implements OnInit {
  private adminSvc = inject(AdminService);

  commandes = signal<Commande[]>([]);

  readonly stats = computed(() => {
    const list = this.commandes();
    const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);
    return {
      aujourdhui: list.filter(c => new Date(c.dateCreation) >= debutJour).length,
      livrees: list.filter(c => c.statut === 'LIVREE').length,
      enCours: list.filter(c => c.statut !== 'LIVREE' && c.statut !== 'ANNULEE').length,
      revenus: list
        .filter(c => c.statut === 'LIVREE')
        .reduce((s, c) => s + (c.montantTotal || 0), 0),
    };
  });

  ngOnInit(): void {
    this.adminSvc.getToutesLesCommandes().subscribe({
      next: data => this.commandes.set(data ?? []),
      error: () => { /* liste vide conservée */ },
    });
  }
}
