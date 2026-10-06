import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CommandeService } from '../../../core/services/commande.service';
import { MapPickerComponent } from '../../../shared/components/map-picker/map-picker.component';
import { ModePaiement, PositionGPS } from '../../../core/models';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, RouterLink, DecimalPipe, MapPickerComponent],
  templateUrl: './checkout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private cmdSvc = inject(CommandeService);
  private router = inject(Router);

  readonly panier = this.cmdSvc.panier;
  readonly totalPrix = this.cmdSvc.totalPrix;

  modeAdresse = signal<'carte' | 'manuel'>('carte');
  positionGPS = signal<PositionGPS | null>(null);
  quartier = signal('');
  ville = signal('Douala');
  pointDeRepere = signal('');
  photoMaison = signal<string | null>(null);
  fraisLivraison = signal(1000);
  modePaiement = signal<ModePaiement>('CASH');
  loading = signal(false);
  preuvePaiement = signal<string | null>(null);

  readonly totalFinal = computed(() => this.totalPrix() + this.fraisLivraison());

  villes = ['Douala', 'Yaoundé'];
  quartiers: Record<string, string[]> = {
    'Douala': ['Akwa', 'Bonamoussadi', 'Bonapriso', 'Bali', 'Deido', 'Kotto', 'Logpom', 'Makepe', 'Ndokotti'],
    'Yaoundé': ['Bastos', 'Mvan', 'Nlongkak', 'Elig-Essono', 'Ekoudou']
  };

  modes = [
    { value: 'CASH' as ModePaiement, label: 'Cash à la livraison', desc: 'Tu paies au livreur' },
    { value: 'ORANGE_MONEY' as ModePaiement, label: 'Orange Money', desc: 'Envoie au +237 655 123 456' },
    { value: 'MTN_MOMO' as ModePaiement, label: 'MTN MoMo', desc: 'Envoie au +237 655 123 456' }
  ];

  onPreuvePaiement(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.preuvePaiement.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onPositionChoisie(pos: PositionGPS): void {
    this.positionGPS.set(pos);
    this.modeAdresse.set('carte');
    if (pos.ville) this.ville.set(pos.ville);
    if (pos.quartier) this.quartier.set(pos.quartier);
    const distSim = Math.random() * 9 + 1;
    this.fraisLivraison.set(this.cmdSvc.calculerFraisParDistance(distSim));
  }

  passerEnManuel(): void {
    this.modeAdresse.set('manuel');
    this.ville.set(this.ville() || 'Douala');
  }

  onVilleChange(e: Event): void {
    this.ville.set((e.target as HTMLSelectElement).value);
    this.quartier.set('');
  }

  onQuartierChange(e: Event): void {
    this.quartier.set((e.target as HTMLSelectElement).value);
  }

  onPointDeRepereChange(e: Event): void {
    this.pointDeRepere.set((e.target as HTMLTextAreaElement).value);
  }

  onPhotoMaison(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => this.photoMaison.set(r.result as string);
    r.readAsDataURL(f);
  }

  // ✅ Flux robuste : GPS ou manuel, jamais bloqué
  confirmer(): void {
    if (
      (this.modePaiement() === 'ORANGE_MONEY' || this.modePaiement() === 'MTN_MOMO')
      && !this.preuvePaiement()
    ) {
      alert('Uploade ta preuve de paiement MoMo avant de confirmer.');
      return;
    }

    const adresseGpsValide = this.modeAdresse() === 'carte' && !!this.positionGPS() && !!this.pointDeRepere().trim();
    const adresseManuelleValide = this.modeAdresse() === 'manuel'
      && !!this.ville().trim()
      && !!this.quartier().trim()
      && !!this.pointDeRepere().trim();

    if (!adresseGpsValide && !adresseManuelleValide) {
      if (this.modeAdresse() === 'manuel') {
        alert('Précise la ville, le quartier et le point de repère pour finaliser la commande.');
      } else {
        alert('Indique ton adresse manuellement ou utilise le GPS, puis précise un point de repère.');
      }
      return;
    }

    this.loading.set(true);
    setTimeout(() => {
      const id = Math.floor(Math.random() * 10000);
      this.cmdSvc.viderPanier();
      this.loading.set(false);
      this.router.navigate(['/suivi', id]);
    }, 1500);
  }
}