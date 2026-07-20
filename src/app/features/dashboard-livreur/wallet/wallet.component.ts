import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-wallet',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './wallet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletComponent {
  gains = signal({
    gainsDuJour: 4000,
    gainsDuMois: 48500,
    cashDuAuxRestos: 12500,
    plafondCash: 20000,
    nombreLivraisonsMois: 23,
  });

  historique = signal([
    { id:1, date:'2025-01-15T14:30:00', restaurant:'Chez Maman Bibiane', montant:1500, type:'LIVRAISON' as const },
    { id:2, date:'2025-01-15T12:00:00', restaurant:'Le Grill Akwa',      montant:2500, type:'LIVRAISON' as const },
    { id:3, date:'2025-01-14T18:00:00', restaurant:'Pizza Roma Douala',  montant:1000, type:'LIVRAISON' as const },
    { id:4, date:'2025-01-14T15:00:00', restaurant:'Sweet Burger',       montant:2500, type:'LIVRAISON' as const },
  ]);

  heure(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  }
}
