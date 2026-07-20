import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
@Component({ selector:'app-admin-finances', imports:[CommonModule, DecimalPipe], templateUrl:'./finances.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class FinancesComponent {
  stats = signal({ totalCommissions:142500, commissionsDues:23500, commissionsPercues:119000, restaurantsDebiteurs:2 });
  restaurants = signal([
    { nom:'Le Grill Akwa',     commissionDue:15000, tauxCommission:5, chiffreAffaires:300000 },
    { nom:'Pizza Roma Douala', commissionDue:8500,  tauxCommission:5, chiffreAffaires:170000 },
  ]);
}
