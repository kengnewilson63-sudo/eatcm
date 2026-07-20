import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { StatutCommande } from '../../../core/models';
import { NotificationPushService } from '../../../core/services/notificationpush.service';

interface Cmd {
  id: number;
  clientNom: string;
  clientTel: string;
  adresse: string;
  pointDeRepere: string;
  modePaiement: string;
  montantTotal: number;
  statut: StatutCommande;
  dateCommande: string;
}

@Component({
  selector: 'app-dr-commandes',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './commandes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandesComponent implements OnInit {
  private notifPush = inject(NotificationPushService);

  commandes = signal<Cmd[]>([]);
  filtre = signal<StatutCommande | 'TOUTES'>('TOUTES');
  detail = signal<Cmd | null>(null);

  readonly filtered = computed(() => {
    const f = this.filtre();
    return f === 'TOUTES' ? this.commandes() : this.commandes().filter(c => c.statut === f);
  });

  readonly stats = computed(() => ({
    total: this.commandes().length,
    attente: this.commandes().filter(c => ['EN_ATTENTE', 'EN_ATTENTE_CONFIRMATION'].includes(c.statut)).length,
    enCours: this.commandes().filter(c => ['ACCEPTEE', 'EN_PREPARATION', 'PRETE'].includes(c.statut)).length,
    revenus: this.commandes().filter(c => c.statut === 'LIVREE').reduce((s, c) => s + c.montantTotal, 0)
  }));

  filtres = [
    { label: 'Toutes', value: 'TOUTES' as const },
    { label: 'En attente', value: 'EN_ATTENTE' as const },
    { label: 'En prépa', value: 'EN_PREPARATION' as const },
    { label: 'Livrées', value: 'LIVREE' as const }
  ];

  // ✅ UN SEUL ngOnInit — tout fusionné ici
  ngOnInit(): void {
    this.commandes.set([
      { id: 1001, clientNom: 'Paul Kamga', clientTel: '+237655123456', adresse: 'Bonamoussadi, Douala', pointDeRepere: 'Derrière Carrefour Market', modePaiement: 'MTN_MOMO', montantTotal: 7800, statut: 'EN_ATTENTE_CONFIRMATION', dateCommande: '2025-01-15T10:30:00' },
      { id: 1002, clientNom: 'Marie Biya', clientTel: '+237677234567', adresse: 'Akwa, Douala', pointDeRepere: 'Face pharmacie centrale', modePaiement: 'CASH', montantTotal: 6000, statut: 'EN_PREPARATION', dateCommande: '2025-01-15T11:00:00' },
      { id: 1003, clientNom: 'Eric Tchoupo', clientTel: '+237699345678', adresse: 'Makepe, Douala', pointDeRepere: 'Immeuble bleu', modePaiement: 'ORANGE_MONEY', montantTotal: 5000, statut: 'LIVREE', dateCommande: '2025-01-15T09:00:00' },
    ]);

    // Simule l'arrivée d'une nouvelle commande après 5s
    setTimeout(() => {
      this.notifPush.notifierNouvelleCommande(1004, 'Sophie Nkolo', 8500);
    }, 5000);
  }

  prochainStatut(s: StatutCommande): { label: string; statut: StatutCommande } | null {
    const m: Partial<Record<StatutCommande, { label: string; statut: StatutCommande }>> = {
      'EN_ATTENTE': { label: 'Accepter', statut: 'ACCEPTEE' },
      'EN_ATTENTE_CONFIRMATION': { label: 'Confirmer paiement', statut: 'ACCEPTEE' },
      'ACCEPTEE': { label: 'Commencer prépa', statut: 'EN_PREPARATION' },
      'EN_PREPARATION': { label: 'Plat prêt ✓', statut: 'PRETE' },
      'PRETE': { label: 'En livraison', statut: 'EN_LIVRAISON' },
      'EN_LIVRAISON': { label: 'Marquer livrée', statut: 'LIVREE' }
    };
    return m[s] ?? null;
  }

  changerStatut(cmd: Cmd, s: StatutCommande): void {
    this.commandes.update(l => l.map(c => c.id === cmd.id ? { ...c, statut: s } : c));
    this.detail.update(d => d?.id === cmd.id ? { ...d, statut: s } : d);
  }

  badgeClass(s: StatutCommande): string {
    const m: Partial<Record<StatutCommande, string>> = {
      'EN_ATTENTE': 'bg-amber-100 text-amber-700',
      'EN_ATTENTE_CONFIRMATION': 'bg-amber-100 text-amber-700',
      'ACCEPTEE': 'bg-blue-100 text-blue-700',
      'EN_PREPARATION': 'bg-blue-100 text-blue-700',
      'PRETE': 'bg-purple-100 text-purple-700',
      'EN_LIVRAISON': 'bg-orange-100 text-orange-700',
      'LIVREE': 'bg-green-100 text-green-700'
    };
    return m[s] ?? 'bg-gray-100 text-gray-600';
  }

  statutLabel(s: StatutCommande): string {
    const m: Partial<Record<StatutCommande, string>> = {
      'EN_ATTENTE': 'En attente',
      'EN_ATTENTE_CONFIRMATION': 'Paiement à confirmer',
      'ACCEPTEE': 'Acceptée',
      'EN_PREPARATION': 'En préparation',
      'PRETE': 'Prête',
      'EN_LIVRAISON': 'En livraison',
      'LIVREE': 'Livrée ✓'
    };
    return m[s] ?? s;
  }

  heure(d: string): string {
    return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}

