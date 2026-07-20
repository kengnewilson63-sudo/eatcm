import { Component, ChangeDetectionStrategy, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AvisLivraison {
  commandeId: number;
  noteRestaurant: number;
  noteLivreur: number;
  commentaire: string;
  tagsChoisis: string[];
}

@Component({
  selector: 'app-notation',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-3xl overflow-hidden"
         style="box-shadow:0 8px 32px rgba(0,0,0,0.15)">

      <!-- Header -->
      <div class="px-5 py-4 text-white text-center"
           style="background:linear-gradient(135deg,#FF5A36,#FF7A5C)">
        <div class="text-4xl mb-2">🎉</div>
        <h3 class="font-extrabold text-lg">Commande livrée !</h3>
        <p class="text-white/80 text-sm mt-1">Comment s'est passée ta commande ?</p>
      </div>

      <div class="p-5 space-y-6">

        @if (!avisEnvoye()) {

          <!-- Note restaurant -->
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <img [src]="restaurantLogo()"
                   class="w-10 h-10 rounded-xl object-cover flex-shrink-0"/>
              <div>
                <p class="font-bold text-secondary text-sm">{{ restaurantNom() }}</p>
                <p class="text-xs text-muted">Note le restaurant</p>
              </div>
            </div>
            <div class="flex items-center justify-center gap-3">
              @for (i of [1,2,3,4,5]; track i) {
                <button (click)="noteRestaurant.set(i)"
                        class="border-none bg-transparent cursor-pointer p-0
                               transition-transform active:scale-90"
                        style="font-size:2.5rem;line-height:1">
                  {{ i <= noteRestaurant() ? '⭐' : '☆' }}
                </button>
              }
            </div>
            <p class="text-center text-sm font-bold text-secondary">
              {{ labelNote(noteRestaurant()) }}
            </p>
          </div>

          <!-- Note livreur -->
          <div class="space-y-3 pt-4 border-t border-gray-100">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl flex-shrink-0">
                🛵
              </div>
              <div>
                <p class="font-bold text-secondary text-sm">{{ livreurNom() }}</p>
                <p class="text-xs text-muted">Note le livreur</p>
              </div>
            </div>
            <div class="flex items-center justify-center gap-3">
              @for (i of [1,2,3,4,5]; track i) {
                <button (click)="noteLivreur.set(i)"
                        class="border-none bg-transparent cursor-pointer p-0
                               transition-transform active:scale-90"
                        style="font-size:2.5rem;line-height:1">
                  {{ i <= noteLivreur() ? '⭐' : '☆' }}
                </button>
              }
            </div>
            <p class="text-center text-sm font-bold text-secondary">
              {{ labelNote(noteLivreur()) }}
            </p>
          </div>

          <!-- Tags rapides -->
          <div class="space-y-2">
            <p class="text-xs font-bold text-muted uppercase tracking-wider">
              Ce qui t'a plu (optionnel)
            </p>
            <div class="flex flex-wrap gap-2">
              @for (tag of tagsDisponibles; track tag.label) {
                <button (click)="toggleTag(tag.label)"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                               text-xs font-semibold border-2 cursor-pointer transition-all"
                        [class]="tagsChoisis().includes(tag.label)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-100 bg-white text-muted hover:border-gray-200'">
                  <span>{{ tag.emoji }}</span>
                  {{ tag.label }}
                </button>
              }
            </div>
          </div>

          <!-- Commentaire -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-secondary uppercase tracking-wider">
              Commentaire (optionnel)
            </label>
            <textarea
              placeholder="Dis-nous ce que tu as aimé ou ce qui pourrait être amélioré..."
              [value]="commentaire()"
              (input)="commentaire.set($any($event.target).value)"
              rows="3"
              class="input-field resize-none">
            </textarea>
          </div>

          <!-- Boutons -->
          <div class="flex gap-3">
            <button (click)="passer.emit()"
                    class="flex-1 py-3 rounded-2xl font-bold text-sm border-2
                           border-gray-200 text-secondary bg-white cursor-pointer
                           hover:bg-gray-50 transition-colors">
              Passer
            </button>
            <button (click)="envoyerAvis()"
                    [disabled]="noteRestaurant() === 0 || loading()"
                    class="flex-2 px-6 py-3 rounded-2xl font-bold text-sm text-white
                           border-none cursor-pointer active:scale-95 transition-all
                           disabled:opacity-50"
                    style="background:#FF5A36;box-shadow:0 4px 16px rgba(255,90,54,0.35)">
              @if (loading()) {
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Envoi...
                </span>
              } @else {
                Envoyer mon avis ⭐
              }
            </button>
          </div>
        }

        <!-- Confirmation -->
        @if (avisEnvoye()) {
          <div class="text-center py-4" style="animation:fadeIn 0.4s ease-out">
            <div class="text-6xl mb-4">🙏</div>
            <h3 class="text-xl font-extrabold text-secondary mb-2">
              Merci pour ton avis !
            </h3>
            <p class="text-sm text-muted mb-2 leading-relaxed">
              Ton retour aide les autres clients et améliore la qualité de nos restaurants.
            </p>
            <div class="flex items-center justify-center gap-1 mb-6">
              @for (i of [1,2,3,4,5]; track i) {
                <svg class="w-6 h-6"
                     [class]="i <= noteRestaurant() ? 'text-amber-400' : 'text-gray-200'"
                     viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              }
            </div>
            <!-- Points fidélité gagnés -->
            <div class="px-4 py-3 bg-amber-50 rounded-2xl border border-amber-100 mb-5">
              <p class="text-sm font-bold text-amber-700">
                🎯 +10 points fidélité gagnés !
              </p>
              <p class="text-xs text-amber-600 mt-0.5">
                Merci d'avoir partagé ton expérience
              </p>
            </div>
            <button (click)="termine.emit()"
                    class="w-full py-4 rounded-2xl text-white font-bold border-none
                           cursor-pointer active:scale-95"
                    style="background:#FF5A36">
              Retour à l'accueil
            </button>
          </div>
        }

      </div>
    </div>
  `,
})
export class NotationComponent {
  // Inputs
  commandeId    = input.required<number>();
  restaurantNom = input<string>('Restaurant');
  restaurantLogo = input<string>('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=80');
  livreurNom    = input<string>('Votre livreur');

  // Outputs
  avisEnvoye_ = output<AvisLivraison>();
  passer      = output<void>();
  termine     = output<void>();

  // State
  noteRestaurant = signal(0);
  noteLivreur    = signal(0);
  commentaire    = signal('');
  tagsChoisis    = signal<string[]>([]);
  loading        = signal(false);
  avisEnvoye     = signal(false);

  tagsDisponibles = [
    { emoji: '⚡', label: 'Livraison rapide' },
    { emoji: '🍽️', label: 'Plat délicieux' },
    { emoji: '🌡️', label: 'Bien chaud' },
    { emoji: '📦', label: 'Bien emballé' },
    { emoji: '😊', label: 'Livreur sympa' },
    { emoji: '✅', label: 'Conforme à la commande' },
    { emoji: '💰', label: 'Bon rapport qualité/prix' },
    { emoji: '🔄', label: 'Je recommande' },
  ];

  labelNote(note: number): string {
    const labels: Record<number, string> = {
      0: 'Appuie sur une étoile',
      1: '😞 Très décevant',
      2: '😕 Décevant',
      3: '😐 Correct',
      4: '😊 Bien',
      5: '🤩 Excellent !',
    };
    return labels[note] ?? '';
  }

  toggleTag(tag: string): void {
    this.tagsChoisis.update(t =>
      t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag]
    );
  }

  envoyerAvis(): void {
    if (this.noteRestaurant() === 0) return;
    this.loading.set(true);

    // En prod → POST /api/avis { commandeId, noteRestaurant, noteLivreur, commentaire, tags }
    setTimeout(() => {
      this.loading.set(false);
      this.avisEnvoye.set(true);

      this.avisEnvoye_.emit({
        commandeId:    this.commandeId(),
        noteRestaurant: this.noteRestaurant(),
        noteLivreur:   this.noteLivreur(),
        commentaire:   this.commentaire(),
        tagsChoisis:   this.tagsChoisis(),
      });
    }, 1000);
  }
}