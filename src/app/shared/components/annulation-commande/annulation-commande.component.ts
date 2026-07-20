import { Component, ChangeDetectionStrategy, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatutCommande, ModePaiement } from '../../../core/models';

export interface ResultatAnnulation {
  commandeId: number;
  raison: string;
  remboursement: boolean;
}

@Component({
  selector: 'app-annulation-commande',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Overlay backdrop -->
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         style="animation:fadeIn 0.2s ease-out">
      
      <!-- Backdrop click to close -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="fermer.emit()"></div>

      <!-- Modal container -->
      <div class="relative w-full sm:max-w-lg bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
           style="max-height:85vh;box-shadow:0 25px 80px rgba(0,0,0,0.25);animation:slideUp 0.35s cubic-bezier(0.16,1,0.3,1)">

        <!-- Drag handle (mobile) -->
        <div class="sm:hidden w-full flex justify-center pt-3 pb-1">
          <div class="w-10 h-1 rounded-full bg-gray-300"></div>
        </div>

        <!-- Header -->
        <div class="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div>
              <p class="font-bold text-secondary text-sm sm:text-base">Annuler la commande</p>
              <p class="text-xs text-muted">Commande #{{ commandeId() }}</p>
            </div>
          </div>
          <button (click)="fermer.emit()" 
                  class="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors">
            <svg class="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable content - CORRIGÉ avec pb-32 pour la navbar -->
        <div class="p-5 sm:p-6 pb-32 sm:pb-6 space-y-4 overflow-y-auto flex-1">

          <!--  Annulation impossible -->
          @if (!peutAnnuler()) {
            <div class="space-y-4">
              <div class="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <p class="font-bold text-red-800 text-sm mb-1">Annulation impossible</p>
                  <p class="text-xs text-red-700 leading-relaxed">
                    Ta commande est déjà <strong>en préparation ou plus avancée</strong>. 
                    Le restaurant a commencé à cuisiner ton plat.
                  </p>
                </div>
              </div>
              
              <div class="p-4 bg-gray-50 rounded-xl">
                <p class="text-xs text-muted mb-2">Tu peux contacter le restaurant :</p>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <span class="text-sm font-semibold text-secondary">+237 655 123 456</span>
                </div>
              </div>

              <button (click)="fermer.emit()"
                      class="w-full py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 text-secondary bg-white cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition-all">
                Fermer
              </button>
            </div>
          }

          <!--  Annulation possible -->
          @if (peutAnnuler() && !annulationConfirmee()) {
            <div class="space-y-4">

              <!-- Badge gratuit -->
              <div class="flex items-center gap-3 p-3.5 bg-green-50 rounded-xl border border-green-100">
                <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-bold text-green-800">Annulation gratuite</p>
                  <p class="text-xs text-green-700">Aucun frais — remboursement immédiat</p>
                </div>
              </div>

              <!-- Info remboursement -->
              @if (modePaiement() !== 'CASH') {
                <div class="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <p class="text-xs font-bold text-blue-800">Remboursement automatique</p>
                  </div>
                  <p class="text-xs text-blue-700 leading-relaxed">
                    <span class="font-extrabold text-secondary">{{ montantTotal() | number }} FCFA</span> 
                    seront remboursés sur ton 
                    <span class="font-bold">{{ modePaiement() === 'ORANGE_MONEY' ? 'Orange Money' : 'MTN MoMo' }}</span> 
                    sous <strong>24-48h</strong>.
                  </p>
                </div>
              } @else {
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                    </svg>
                    <p class="text-xs font-bold text-gray-700">Paiement en espèces</p>
                  </div>
                  <p class="text-xs text-gray-600 leading-relaxed">
                    Aucun montant n'a été prélevé. La commande sera simplement annulée.
                  </p>
                </div>
              }

              <!-- Raison -->
              <div class="space-y-2.5">
                <p class="text-xs font-bold text-secondary uppercase tracking-wider">
                  Pourquoi annules-tu ? *
                </p>
                @for (r of raisons; track r.value) {
                  <button (click)="raisonSelectionnee.set(r.value)"
                          class="w-full flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border-2 cursor-pointer text-left transition-all active:scale-[0.98]"
                          [class]="raisonSelectionnee() === r.value
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-100 hover:border-gray-200 bg-white'">
                    <span class="text-2xl flex-shrink-0">{{ r.emoji }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-secondary">{{ r.label }}</p>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                         [class]="raisonSelectionnee() === r.value ? 'border-primary bg-primary' : 'border-gray-300'">
                      @if (raisonSelectionnee() === r.value) {
                        <div class="w-2 h-2 rounded-full bg-white"></div>
                      }
                    </div>
                  </button>
                }
              </div>

              <!-- Boutons -->
              <div class="flex gap-3 pt-2">
                <button (click)="fermer.emit()"
                        class="flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 text-secondary bg-white cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition-all">
                  Garder
                </button>
                <button (click)="confirmerAnnulation()"
                        [disabled]="!raisonSelectionnee() || loading()"
                        class="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white border-none cursor-pointer disabled:opacity-40 active:scale-[0.98] transition-all"
                        style="background:linear-gradient(135deg,#EF4444,#DC2626);box-shadow:0 4px 16px rgba(239,68,68,0.35)">
                  @if (loading()) {
                    <span class="flex items-center justify-center gap-2">
                      <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Annulation...
                    </span>
                  } @else {
                    Confirmer
                  }
                </button>
              </div>
            </div>
          }

          <!-- ✅ Confirmation réussie -->
          @if (annulationConfirmee()) {
            <div class="text-center py-6 sm:py-8" style="animation:fadeIn 0.5s ease-out">
              <!-- Success animation -->
              <div class="relative w-24 h-24 mx-auto mb-5">
                <div class="absolute inset-0 rounded-full bg-red-100" style="animation:pulse 2s infinite"></div>
                <div class="relative w-full h-full rounded-full bg-red-50 flex items-center justify-center">
                  <svg class="w-12 h-12 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
              </div>

              <h3 class="text-xl sm:text-2xl font-extrabold text-secondary mb-2">Commande annulée</h3>
              <p class="text-sm text-muted mb-1">Commande #{{ commandeId() }}</p>

              @if (modePaiement() !== 'CASH') {
                <div class="mt-4 p-4 bg-green-50 rounded-2xl border border-green-100 inline-block w-full">
                  <p class="text-sm text-green-800 mb-1">💰 Remboursement en cours</p>
                  <p class="text-xs text-green-700">
                    <span class="font-extrabold text-secondary text-lg">{{ montantTotal() | number }} FCFA</span>
                  </p>
                  <p class="text-xs text-green-600 mt-1">
                    Sur ton {{ modePaiement() === 'ORANGE_MONEY' ? 'Orange Money' : 'MTN MoMo' }} 
                    dans <strong>24-48h</strong>
                  </p>
                </div>
              } @else {
                <p class="text-sm text-muted mt-2">Ta commande a bien été annulée.</p>
              }

              <div class="mt-4 p-3 bg-gray-50 rounded-xl inline-flex items-center gap-2">
                <span class="text-xs text-muted">Référence :</span>
                <span class="text-xs font-mono font-bold text-secondary">#ANN-{{ commandeId() }}</span>
              </div>

              <button (click)="onTermine()"
                      class="w-full mt-6 py-4 rounded-2xl text-white font-bold text-sm border-none cursor-pointer active:scale-[0.98] transition-all"
                      style="background:linear-gradient(135deg,#FF5A36,#FF7A5C);box-shadow:0 8px 28px rgba(255,90,54,0.4)">
                Retour à mes commandes →
              </button>
            </div>
          }

          <!-- Espace pour la navbar fixe (mobile uniquement) -->
          <div class="h-20 sm:hidden"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50%      { transform: scale(1.1); opacity: 0; }
    }
  `]
})
export class AnnulationCommandeComponent {
  commandeId   = input.required<number>();
  statut       = input.required<StatutCommande>();
  modePaiement = input.required<ModePaiement>();
  montantTotal = input<number>(0);

  fermer    = output<void>();
  annulee   = output<ResultatAnnulation>();

  raisonSelectionnee  = signal('');
  loading             = signal(false);
  annulationConfirmee = signal(false);

  raisons = [
    { value: 'COMMANDE_ERRONEE',    emoji: '✏️', label: 'J\'ai fait une erreur dans ma commande' },
    { value: 'ATTENTE_TROP_LONGUE', emoji: '⏰', label: 'Le temps d\'attente est trop long' },
    { value: 'CHANGEMENT_AVIS',     emoji: '🤔', label: 'J\'ai changé d\'avis' },
    { value: 'PROBLEME_PAIEMENT',   emoji: '💳', label: 'Problème de paiement' },
    { value: 'AUTRE',               emoji: '📝', label: 'Autre raison' },
  ];

  peutAnnuler(): boolean {
    return ['EN_ATTENTE', 'EN_ATTENTE_CONFIRMATION', 'ACCEPTEE'].includes(this.statut());
  }

  confirmerAnnulation(): void {
    if (!this.raisonSelectionnee()) return;
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.annulationConfirmee.set(true);
    }, 1200);
  }

  onTermine(): void {
    this.annulee.emit({
      commandeId: this.commandeId(),
      raison: this.raisonSelectionnee(),
      remboursement: this.modePaiement() !== 'CASH',
    });
    this.fermer.emit();
  }
}