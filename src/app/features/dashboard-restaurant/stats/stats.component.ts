import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
@Component({ selector:'app-dr-stats', imports:[CommonModule, DecimalPipe], templateUrl:'./stats.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class StatsComponent {
  stats = signal({ revenuTotal:125500, commandesTotal:48, noteMoyenne:4.8, tauxAcceptation:96, commissionDue:0 });
  ventes = signal([
    {jour:'Lun',revenus:18500,commandes:7},{jour:'Mar',revenus:22000,commandes:9},{jour:'Mer',revenus:15000,commandes:6},
    {jour:'Jeu',revenus:28000,commandes:11},{jour:'Ven',revenus:32000,commandes:13},{jour:'Sam',revenus:45000,commandes:18},{jour:'Dim',revenus:38000,commandes:15},
  ]);
  platsTop = signal([
    {nom:'Ndolé au poisson fumé',commandes:34,revenus:119000},{nom:'Brochettes de bœuf',commandes:28,revenus:70000},{nom:'Poulet DG',commandes:19,revenus:95000},
  ]);
  get maxRevenu(): number { return Math.max(...this.ventes().map(v => v.revenus), 1); }
  barHeight(r: number): number { return Math.round((r / this.maxRevenu) * 100); }
}
