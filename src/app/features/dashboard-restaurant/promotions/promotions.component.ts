import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromotionService } from '../../../core/services/promotion.service';
import { Promotion } from '../../../core/models/promotion.model';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './promotions.component.html',
  styleUrl: './promotions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromotionsComponent {
  private promoSvc = inject(PromotionService);

  readonly restaurantId = 1; // Récupère ça depuis ton auth plus tard

  modalOuvert = signal(false);
  modeEdition = signal(false);
  promoEditee = signal<Promotion | null>(null);

  // Formulaire
  titre = signal('');
  description = signal('');
  type = signal<Promotion['type']>('remise');
  valeurRemise = signal<number | null>(null);
  codePromo = signal('');
  dateDebut = signal('');
  dateFin = signal('');
  minimumCommande = signal<number | null>(null);
  utilisationsMax = signal<number | null>(null);
  imageUrl = signal('');

  readonly mesPromotions = () =>
    this.promoSvc.promotions().filter(p => p.restaurantId === this.restaurantId);

  readonly typesPromo = [
    { value: 'remise' as const, label: 'Remise %' },
    { value: 'livraison_gratuite' as const, label: 'Livraison gratuite' },
    { value: '1achete1offert' as const, label: '1 acheté = 1 offert' },
    { value: 'menu_special' as const, label: 'Menu spécial' },
  ];

  ouvrirAjout(): void {
    this.modeEdition.set(false);
    this.promoEditee.set(null);
    this.resetForm();
    this.modalOuvert.set(true);
  }

  ouvrirEdition(promo: Promotion): void {
    this.modeEdition.set(true);
    this.promoEditee.set(promo);
    this.titre.set(promo.titre);
    this.description.set(promo.description);
    this.type.set(promo.type);
    this.valeurRemise.set(promo.valeurRemise ?? null);
    this.codePromo.set(promo.codePromo);
    this.dateDebut.set(promo.dateDebut);
    this.dateFin.set(promo.dateFin);
    this.minimumCommande.set(promo.minimumCommande ?? null);
    this.utilisationsMax.set(promo.utilisationsMax ?? null);
    this.imageUrl.set(promo.imageUrl ?? '');
    this.modalOuvert.set(true);
  }

  sauvegarder(): void {
    const promo: Promotion = {
      id: this.promoEditee()?.id ?? Date.now(),
      restaurantId: this.restaurantId,
      titre: this.titre().trim(),
      description: this.description().trim(),
      type: this.type(),
      valeurRemise: this.valeurRemise() ?? undefined,
      codePromo: this.codePromo().trim().toUpperCase(),
      dateDebut: this.dateDebut(),
      dateFin: this.dateFin(),
      imageUrl: this.imageUrl() || undefined,
      actif: this.promoEditee()?.actif ?? true,
      utilisationsMax: this.utilisationsMax() ?? undefined,
      utilisationsCount: this.promoEditee()?.utilisationsCount ?? 0,
      minimumCommande: this.minimumCommande() ?? undefined,
    };

    if (!promo.titre || !promo.codePromo || !promo.dateFin) {
      alert('Remplis au moins le titre, le code promo et la date de fin.');
      return;
    }

    if (this.modeEdition() && this.promoEditee()) {
      this.promoSvc.modifierPromotion(promo.id, promo);
    } else {
      this.promoSvc.ajouterPromotion(promo);
    }

    this.modalOuvert.set(false);
    this.resetForm();
  }

  supprimer(id: number): void {
    if (!confirm('Supprimer cette promotion ?')) return;
    this.promoSvc.supprimerPromotion(id);
  }

  toggleActif(id: number): void {
    this.promoSvc.toggleActif(id);
  }

  resetForm(): void {
    this.titre.set('');
    this.description.set('');
    this.type.set('remise');
    this.valeurRemise.set(null);
    this.codePromo.set('');
    this.dateDebut.set('');
    this.dateFin.set('');
    this.minimumCommande.set(null);
    this.utilisationsMax.set(null);
    this.imageUrl.set('');
  }

  onField(field: string, e: Event): void {
    const val = (e.target as HTMLInputElement | HTMLSelectElement).value;
    switch (field) {
      case 'titre': this.titre.set(val); break;
      case 'description': this.description.set(val); break;
      case 'type': this.type.set(val as Promotion['type']); break;
      case 'code': this.codePromo.set(val); break;
      case 'debut': this.dateDebut.set(val); break;
      case 'fin': this.dateFin.set(val); break;
      case 'image': this.imageUrl.set(val); break;
    }
  }

  onNumberField(field: string, e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    const num = val ? Number(val) : null;
    switch (field) {
      case 'remise': this.valeurRemise.set(num); break;
      case 'min': this.minimumCommande.set(num); break;
      case 'max': this.utilisationsMax.set(num); break;
    }
  }

  getTypeLabel(type: string): string {
    return this.typesPromo.find(t => t.value === type)?.label ?? type;
  }

  getStatus(promo: Promotion): { text: string; color: string } {
    if (!promo.actif) return { text: 'Désactivée', color: '#ef4444' };
    const fin = new Date(promo.dateFin);
    if (fin < new Date()) return { text: 'Expirée', color: '#f97316' };
    return { text: 'Active', color: '#22c55e' };
  }
}