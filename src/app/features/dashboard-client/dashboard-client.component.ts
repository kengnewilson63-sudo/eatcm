import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotationComponent } from '../../shared/components/notation/ notation.component';

interface CommandeEnCours {
  id: number;
  restaurantNom: string;
  restaurantLogo: string;
  statut: string;
  statutLabel: string;
  montantTotal: number;
  tempsRestant: string;
  plats: string[];
}

interface CommandePassee {
  id: number;
  restaurantNom: string;
  restaurantLogo: string;
  plats: string[];
  montantTotal: number;
  date: string;
  note?: number;
  statut: 'LIVREE' | 'ANNULEE';
}

@Component({
  selector: 'app-dashboard-client',
  imports: [CommonModule, RouterLink, DecimalPipe, NotationComponent],
  templateUrl: './dashboard-client.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardClientComponent {
  auth = inject(AuthService);
  commandeANoter = signal<number | null>(null);

onAvisEnvoye(avis: any): void {
  // Met à jour la note dans l'historique
  this.historique.update(l =>
    l.map(c => c.id === avis.commandeId
      ? { ...c, note: avis.noteRestaurant }
      : c
    )
  );
  this.commandeANoter.set(null);
}

  readonly user = this.auth.currentUser;

  onglet = signal<'cours' | 'historique' | 'stats'>('cours');

  // Commandes en cours (simulées)
  commandesEnCours = signal<CommandeEnCours[]>([
    {
      id: 1001,
      restaurantNom: 'Chez Maman Bibiane',
      restaurantLogo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&q=80',
      statut: 'EN_PREPARATION',
      statutLabel: '👨‍🍳 En préparation',
      montantTotal: 8800,
      tempsRestant: '~15 min',
      plats: ['Ndolé au poisson fumé × 2', 'Jus de gingembre × 1'],
    },
  ]);

  // Historique commandes
  historique = signal<CommandePassee[]>([
    {
      id: 1001,
      restaurantNom: 'Chez Maman Bibiane',
      restaurantLogo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80&q=80',
      plats: ['Ndolé au poisson fumé × 2', 'Jus de gingembre × 1'],
      montantTotal: 8800,
      date: '2025-01-10T14:30:00',
      note: 5,
      statut: 'LIVREE',
    },
    {
      id: 1002,
      restaurantNom: 'Le Grill Akwa',
      restaurantLogo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=80&q=80',
      plats: ['Brochettes de bœuf × 3'],
      montantTotal: 7500,
      date: '2025-01-08T19:00:00',
      note: 4,
      statut: 'LIVREE',
    },
    {
      id: 1003,
      restaurantNom: 'Pizza Roma Douala',
      restaurantLogo: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=80&q=80',
      plats: ['Pizza 4 fromages × 1'],
      montantTotal: 7500,
      date: '2025-01-05T20:00:00',
      statut: 'ANNULEE',
    },
  ]);

  // Stats calculées
  readonly stats = computed(() => ({
    totalCommandes:  this.historique().filter(c => c.statut === 'LIVREE').length,
    totalDepense:    this.historique().filter(c => c.statut === 'LIVREE').reduce((s, c) => s + c.montantTotal, 0),
    commandesMois:   2,
    restaurantFavori: 'Chez Maman Bibiane',
    noteMoyenne:     this.calculerNoteMoyenne(),
    pointsFidelite:  245,
  }));

  private calculerNoteMoyenne(): number {
    const notees = this.historique().filter(c => c.note);
    if (!notees.length) return 0;
    return notees.reduce((s, c) => s + (c.note ?? 0), 0) / notees.length;
  }

  getInitials(): string {
    const u = this.user();
    if (!u) return 'U';
    return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase();
  }

  statutColor(statut: string): string {
    const m: Record<string, string> = {
      'EN_ATTENTE':     'bg-amber-100 text-amber-700',
      'ACCEPTEE':       'bg-blue-100 text-blue-700',
      'EN_PREPARATION': 'bg-blue-100 text-blue-700',
      'PRETE':          'bg-purple-100 text-purple-700',
      'EN_LIVRAISON':   'bg-orange-100 text-orange-700',
      'LIVREE':         'bg-green-100 text-green-700',
      'ANNULEE':        'bg-red-100 text-red-700',
    };
    return m[statut] ?? 'bg-gray-100 text-gray-600';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}