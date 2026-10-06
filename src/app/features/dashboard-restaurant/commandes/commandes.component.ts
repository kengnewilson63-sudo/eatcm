import { Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Commande, StatutCommande } from '../../../core/models';
import { CommandeService } from '../../../core/services/commande.service';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RestaurantRealtimeService } from '../../../core/realtime/restaurant-realtime.service';

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
  lignes: { platNom: string; quantite: number; sousTotal: number }[];
}

@Component({
  selector: 'app-dr-commandes',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './commandes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommandesComponent implements OnInit, OnDestroy {
  private commandeApi = inject(CommandeService);
  private restoSvc    = inject(RestaurantService);
  private realtime    = inject(RestaurantRealtimeService);
  private notif       = inject(NotificationService);

  commandes = signal<Cmd[]>([]);
  loading   = signal(false);
  filtre    = signal<StatutCommande | 'TOUTES'>('TOUTES');
  detail    = signal<Cmd | null>(null);
  /** Vrai quand le flux temps réel STOMP est actif (sinon repli polling). */
  tempsReelActif = this.realtime.connecte;

  /** Désabonnements à libérer dans ngOnDestroy. */
  private arrets: (() => void)[] = [];
  private restaurantId: number | null = null;

  readonly filtered = computed(() => {
    const f = this.filtre();
    return f === 'TOUTES' ? this.commandes() : this.commandes().filter(c => c.statut === f);
  });

  readonly stats = computed(() => ({
    total: this.commandes().length,
    attente: this.commandes().filter(c => ['EN_ATTENTE', 'EN_ATTENTE_CONFIRMATION'].includes(c.statut)).length,
    enCours: this.commandes().filter(c => ['ACCEPTEE', 'EN_PREPARATION', 'PRETE', 'PRISE_PAR_LIVREUR', 'EN_LIVRAISON'].includes(c.statut)).length,
    revenus: this.commandes().filter(c => c.statut === 'LIVREE').reduce((s, c) => s + c.montantTotal, 0)
  }));

  filtres = [
    { label: 'Toutes', value: 'TOUTES' as const },
    { label: 'En attente', value: 'EN_ATTENTE' as const },
    { label: 'En prépa', value: 'EN_PREPARATION' as const },
    { label: 'Livrées', value: 'LIVREE' as const }
  ];

  ngOnInit(): void {
    this.chargerCommandes();
    this.demarrerTempsReel();
  }

  ngOnDestroy(): void {
    this.arrets.forEach(off => off());
    this.arrets = [];
    this.realtime.toutArreter();
  }

  /**
   * Branche le flux temps réel (nouvelles commandes + changements de statut)
   * et met en place un repli REST si le WebSocket STOMP n'est pas disponible.
   */
  private demarrerTempsReel(): void {
    this.restoSvc.getMonRestaurant().subscribe({
      next: resto => {
        this.restaurantId = resto?.id ?? null;

        if (this.restaurantId != null) {
          // Nouvelles commandes poussées par le backend
          this.arrets.push(
            this.realtime.surNouvelleCommande(this.restaurantId, commande => {
              const cmd = this.versCmd(commande);
              this.commandes.update(l => l.some(c => c.id === cmd.id) ? l : [cmd, ...l]);
              this.notif.success(`Nouvelle commande #${cmd.id} 🛎️`);
            })
          );
        }

        // Changements de statut des commandes déjà affichées
        for (const cmd of this.commandes()) {
          this.ecouterStatut(cmd.id);
        }

        // Repli REST tant que le WebSocket n'est pas connecté
        this.arrets.push(
          this.realtime.repliPolling(
            () => this.commandeApi.getCommandesRestaurant(),
            commandes => this.commandes.set(commandes.map(c => this.versCmd(c))),
          )
        );
      },
      error: err => console.error(err),
    });
  }

  /** S'abonne au changement de statut d'une commande précise. */
  private ecouterStatut(commandeId: number): void {
    this.arrets.push(
      this.realtime.surStatutCommande(commandeId, statut => {
        this.commandes.update(l =>
          l.map(c => c.id === commandeId ? { ...c, statut: statut as StatutCommande } : c)
        );
        this.detail.update(d => d?.id === commandeId ? { ...d, statut: statut as StatutCommande } : d);
      })
    );
  }

  /** Charge les commandes réelles du restaurant connecté depuis le backend. */
  chargerCommandes(): void {
    this.loading.set(true);
    this.commandeApi.getCommandesRestaurant().subscribe({
      next: commandes => {
        this.commandes.set(commandes.map(c => this.versCmd(c)));
        this.loading.set(false);
        // Écoute le statut de chaque commande active (idempotent côté service).
        for (const c of this.commandes()) this.ecouterStatut(c.id);
      },
      error: err => {
        this.loading.set(false);
        this.notif.error('Impossible de charger les commandes du restaurant');
        console.error(err);
      }
    });
  }

  /** Mappe une Commande backend vers le modèle d'affichage local. */
  private versCmd(c: Commande): Cmd {
    const adr = c.adresseLivraison ?? ({} as any);
    const quartiers = [adr.quartier, adr.ville].filter(Boolean).join(', ');
    const client = (c as any).client;
    const nomClient = client ? `${client.prenom ?? ''} ${client.nom ?? ''}`.trim() : 'Client';
    return {
      id: c.id,
      clientNom: nomClient || 'Client',
      clientTel: client?.telephone ?? '',
      adresse: adr.pointDeRepere || quartiers || 'Adresse à confirmer',
      pointDeRepere: adr.indications ?? '',
      modePaiement: c.modePaiement ?? 'CASH',
      montantTotal: c.montantTotal ?? 0,
      statut: c.statut,
      dateCommande: c.dateCreation,
      lignes: (c.lignes ?? []).map(l => ({
        platNom: l.platNom,
        quantite: l.quantite,
        sousTotal: l.sousTotal,
      })),
    };
  }

  prochainStatut(s: StatutCommande): { label: string; statut: StatutCommande } | null {
    const m: Partial<Record<StatutCommande, { label: string; statut: StatutCommande }>> = {
      'EN_ATTENTE': { label: 'Accepter', statut: 'ACCEPTEE' },
      'EN_ATTENTE_CONFIRMATION': { label: 'Confirmer', statut: 'ACCEPTEE' },
      'ACCEPTEE': { label: 'Commencer prépa', statut: 'EN_PREPARATION' },
      'EN_PREPARATION': { label: 'Plat prêt ✓', statut: 'PRETE' },
      'PRETE': { label: 'En livraison', statut: 'EN_LIVRAISON' },
      'PRISE_PAR_LIVREUR': { label: 'En livraison', statut: 'EN_LIVRAISON' },
      'EN_LIVRAISON': { label: 'Marquer livrée', statut: 'LIVREE' }
    };
    return m[s] ?? null;
  }

  /** Persiste le changement de statut côté backend puis met à jour l'UI. */
  changerStatut(cmd: Cmd, s: StatutCommande): void {
    this.commandeApi.changerStatut(cmd.id, s).subscribe({
      next: maj => {
        this.commandes.update(l => l.map(c => c.id === cmd.id ? this.versCmd(maj) : c));
        this.detail.update(d => d?.id === cmd.id ? this.versCmd(maj) : d);
        this.notif.success(`Commande #${cmd.id} → ${this.statutLabel(s)}`);
      },
      error: err => {
        this.notif.error(err?.error?.message || 'Impossible de changer le statut de la commande');
        console.error(err);
      }
    });
  }

  badgeClass(s: StatutCommande): string {
    const m: Partial<Record<StatutCommande, string>> = {
      'EN_ATTENTE': 'bg-amber-100 text-amber-700',
      'EN_ATTENTE_CONFIRMATION': 'bg-amber-100 text-amber-700',
      'ACCEPTEE': 'bg-blue-100 text-blue-700',
      'EN_PREPARATION': 'bg-blue-100 text-blue-700',
      'PRETE': 'bg-purple-100 text-purple-700',
      'PRISE_PAR_LIVREUR': 'bg-orange-100 text-orange-700',
      'EN_LIVRAISON': 'bg-orange-100 text-orange-700',
      'LIVREE': 'bg-green-100 text-green-700',
      'ANNULEE': 'bg-red-100 text-red-600'
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
      'PRISE_PAR_LIVREUR': 'Livreur en route',
      'EN_LIVRAISON': 'En livraison',
      'LIVREE': 'Livrée ✓',
      'ANNULEE': 'Annulée'
    };
    return m[s] ?? s;
  }

  heure(d: string): string {
    return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}

