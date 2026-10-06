import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { LivreurService } from '../../../core/services/livreur.service';
import { NotificationService } from '../../../core/services/notification.service';

interface LigneHistorique {
  id: number;
  date: string;
  restaurant: string;
  montant: number;
  type: 'LIVRAISON';
}

@Component({
  selector: 'app-wallet',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './wallet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletComponent implements OnInit {
  private livreurApi = inject(LivreurService);
  private notif      = inject(NotificationService);

  /** Gains affichés — alimentés par GET /api/livreur/wallet. */
  gains = signal({
    gainsDuJour: 0,
    gainsDuMois: 0,
    gainsTotal: 0,
    cashDuAuxRestos: 0,
    plafondCash: 0,
    nombreLivraisonsMois: 0,
    noteMoyenne: 0,
  });

  historique = signal<LigneHistorique[]>([]);

  /** Ratio cash collecté / plafond autorisé (0 → 1). Utilisé par la jauge du template. */
  readonly cashRatio = computed(() => {
    const g = this.gains();
    if (!g.plafondCash || g.plafondCash <= 0) return 0;
    return Math.min(g.cashDuAuxRestos / g.plafondCash, 1);
  });

  ngOnInit(): void {
    this.livreurApi.getWallet().subscribe({
      next: w => this.gains.set({
        gainsDuJour: w.gainsDuJour,
        gainsDuMois: w.gainsDuMois,
        gainsTotal: w.gainsTotal,
        cashDuAuxRestos: w.cashDu,
        plafondCash: w.plafondCash,
        nombreLivraisonsMois: w.coursesDuMois,
        noteMoyenne: w.noteMoyenne,
      }),
      error: () => this.notif.error('Impossible de charger ton portefeuille'),
    });

    this.livreurApi.getHistorique().subscribe({
      next: commandes => this.historique.set(
        commandes
          .filter(c => c.statut === 'LIVREE')
          .map(c => ({
            id: c.id,
            date: c.dateCreation,
            restaurant: (c as any).restaurant?.nom ?? `Commande #${c.id}`,
            montant: c.fraisLivraison ?? 0,
            type: 'LIVRAISON' as const,
          }))
      ),
      error: () => { /* historique non critique */ },
    });
  }

  heure(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  }
}
