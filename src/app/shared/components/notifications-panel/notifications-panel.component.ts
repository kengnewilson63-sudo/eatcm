import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationPushService } from '../../../core/services/notificationpush.service';

export type NotificationType = 'NOUVELLE_COMMANDE' | 'STATUT_COMMANDE' | 'COURSE_DISPONIBLE' | 'GENERAL';

export interface Notification {
  id: number;
  type: NotificationType;
  titre: string;
  message: string;
  date: Date;
  lu: boolean;
}

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <!-- Bouton cloche -->
      <button (click)="toggle()"
              class="relative w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer transition-all active:scale-90"
              [class]="ouvert() ? 'bg-primary/10 text-primary' : 'bg-transparent text-secondary hover:bg-gray-50'">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        @if (svc.totalNonLues > 0) {
          <span class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white leading-none">
            {{ svc.totalNonLues > 9 ? '9+' : svc.totalNonLues }}
          </span>
        }
      </button>

      @if (ouvert()) {
        <div class="fixed inset-0 z-40" (click)="ouvert.set(false)"></div>
        <div class="absolute top-[calc(100%+8px)] right-0 w-80 md:w-96 bg-white rounded-2xl z-50 overflow-hidden" style="box-shadow:0 12px 40px rgba(0,0,0,0.15)">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-secondary text-sm">Notifications</h3>
              @if (svc.totalNonLues > 0) {
                <span class="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">{{ svc.totalNonLues }} nouvelles</span>
              }
            </div>
            @if (svc.notifications().length > 0) {
              <button (click)="svc.marquerToutesLues()" class="text-xs font-semibold text-primary border-none bg-transparent cursor-pointer hover:underline">Tout marquer comme lu</button>
            }
          </div>
          <div class="max-h-96 overflow-y-auto">
            @if (svc.notifications().length === 0) {
              <div class="text-center py-12 px-4">
                <p class="text-3xl mb-3">🔔</p>
                <p class="font-bold text-secondary text-sm mb-1">Aucune notification</p>
                <p class="text-xs text-muted">Tes notifications apparaîtront ici</p>
              </div>
            }
            @for (n of svc.notifications(); track n.id) {
              <div class="flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors group" [class]="n.lu ? 'bg-white hover:bg-gray-50' : 'bg-primary/5 hover:bg-primary/8'" (click)="svc.marquerLue(n.id)">
                <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base" [class]="n.type === 'NOUVELLE_COMMANDE' ? 'bg-orange-100' : n.type === 'STATUT_COMMANDE' ? 'bg-blue-100' : n.type === 'COURSE_DISPONIBLE' ? 'bg-green-100' : 'bg-gray-100'">
                  {{ n.type === 'NOUVELLE_COMMANDE' ? '🍽️' : n.type === 'STATUT_COMMANDE' ? '📦' : n.type === 'COURSE_DISPONIBLE' ? '🛵' : '✅' }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <p class="font-bold text-secondary text-sm leading-tight">{{ n.titre }}</p>
                    @if (!n.lu) { <div class="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1"></div> }
                  </div>
                  <p class="text-xs text-muted mt-0.5 leading-relaxed">{{ n.message }}</p>
                  <p class="text-[10px] text-muted mt-1 font-medium">{{ svc.formaterDate(n.date) }}</p>
                </div>
                <button (click)="$event.stopPropagation(); svc.supprimerNotification(n.id)" class="w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center border-none bg-transparent cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg class="w-3 h-3 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class NotificationsPanelComponent {
  svc = inject(NotificationPushService);
  ouvert = signal(false);

  toggle(): void {
    this.ouvert.update(v => !v);
  }
}