import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TrackingMapComponent } from '../../../shared/components/tracking-map/tracking-map.component';
import { AnnulationCommandeComponent } from '../../../shared/components/annulation-commande/annulation-commande.component';
import { StatutCommande, ModePaiement } from '../../../core/models';
import { NotationComponent } from '../../../shared/components/notation/ notation.component';


interface EtapeSuivi {
  statut: StatutCommande;
  label: string;
  description: string;
  done: boolean;
  active: boolean;
}

@Component({
  selector: 'app-suivi',
  imports: [
    CommonModule,
    RouterLink,
    TrackingMapComponent,
    AnnulationCommandeComponent,NotationComponent],
  templateUrl: './suivi.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuiviComponent implements OnInit {
  private route = inject(ActivatedRoute);

  commandeId = signal<number | null>(null);
  statutActuel = signal<StatutCommande>('EN_ATTENTE');
  modalAnnulation = signal(false);
  modalNotation = signal(false);
  modePaiement = signal<ModePaiement>('CASH');
  montantTotal = signal(7500);

  get commandeIdNum(): number {
    return Number(this.commandeId() ?? 0);
  }

  getCommandeId(): number {
    return Number(this.commandeId() ?? 0);
  }

  etapes = signal<EtapeSuivi[]>([
    { statut: 'EN_ATTENTE', label: 'Commande reçue', description: 'Le restaurant a reçu ta commande', done: false, active: false },
    { statut: 'ACCEPTEE', label: 'Commande acceptée', description: 'Le restaurant prépare ta commande', done: false, active: false },
    { statut: 'EN_PREPARATION', label: 'En préparation', description: 'Tes plats sont en cours de préparation 👨‍🍳', done: false, active: false },
    { statut: 'PRETE', label: 'Prête pour livraison', description: 'Un livreur va récupérer ta commande', done: false, active: false },
    { statut: 'EN_LIVRAISON', label: 'En livraison', description: 'Ton livreur est en route 🛵', done: false, active: false },
    { statut: 'LIVREE', label: 'Livrée ✓', description: 'Bon appétit !', done: false, active: false },
  ]);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.commandeId.set(idParam ? parseInt(idParam, 10) : null);
    this.simulerProgression();
  }

  private simulerProgression(): void {
    const statuts: StatutCommande[] = [
      'EN_ATTENTE', 'ACCEPTEE', 'EN_PREPARATION', 'PRETE', 'EN_LIVRAISON', 'LIVREE'
    ];
    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= statuts.length || this.statutActuel() === 'ANNULEE') {
        clearInterval(iv);
        return;
      }
      const current = statuts[idx];
      this.statutActuel.set(current);
      this.etapes.update((l: EtapeSuivi[]) =>
        l.map((e: EtapeSuivi) => ({
          ...e,
          done: statuts.indexOf(e.statut) < idx,
          active: e.statut === current,
        }))
      );
      if (current === 'LIVREE') {
        setTimeout(() => this.modalNotation.set(true), 2000);
      }
      idx++;
    }, 8000);
  }

  ouvrirAnnulation(): void {
    this.modalAnnulation.set(true);
  }

  onCommandeAnnulee(result: any): void {
    this.statutActuel.set('ANNULEE');
    this.modalAnnulation.set(false);
  }

  isLivree(): boolean {
    return this.statutActuel() === 'LIVREE';
  }

  peutAnnuler(): boolean {
    return ['EN_ATTENTE', 'EN_ATTENTE_CONFIRMATION', 'ACCEPTEE'].includes(this.statutActuel());
  }

  onAvisEnvoye(avis: any): void {
    console.log('Avis enregistré:', avis);
    this.modalNotation.set(false);
  }
}