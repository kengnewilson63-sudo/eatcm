import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type StatutLitige = 'OUVERT' | 'EN_TRAITEMENT' | 'RESOLU' | 'FERME';

interface Litige {
  id: number;
  commandeId: number;
  client: string;
  type: string;
  statut: StatutLitige;
  date: string;
  description: string;
}

@Component({
  selector: 'app-admin-litiges',
  imports: [CommonModule],
  templateUrl: './litiges.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LitigesComponent {
  litiges = signal<Litige[]>([
    { id: 1, commandeId: 1001, client: 'Paul Kamga',   type: 'PLAT_MANQUANT',       statut: 'OUVERT',        date: '2025-01-15T10:30:00', description: 'Il manque un plat dans ma commande' },
    { id: 2, commandeId: 1002, client: 'Marie Biya',   type: 'RETARD',              statut: 'EN_TRAITEMENT', date: '2025-01-15T11:00:00', description: 'Livraison en retard de 2h' },
    { id: 3, commandeId: 1003, client: 'Eric Tchoupo', type: 'PAIEMENT_FRAUDULEUX', statut: 'RESOLU',        date: '2025-01-14T09:00:00', description: 'Tentative de fraude au paiement MoMo' },
  ]);

  resoudre(id: number): void {
    this.litiges.update(l => l.map(x => x.id === id ? { ...x, statut: 'RESOLU' } : x));
  }

  fermer(id: number): void {
    this.litiges.update(l => l.map(x => x.id === id ? { ...x, statut: 'FERME' } : x));
  }

  badgeClass(s: string): string {
    const m: Record<string, string> = {
      'OUVERT': 'bg-red-100 text-red-700',
      'EN_TRAITEMENT': 'bg-amber-100 text-amber-700',
      'RESOLU': 'bg-green-100 text-green-700',
      'FERME': 'bg-gray-100 text-gray-500'
    };
    return m[s] ?? 'bg-gray-100 text-gray-500';
  }
}