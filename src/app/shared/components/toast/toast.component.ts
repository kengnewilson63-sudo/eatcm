import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none max-w-sm">
      @for (n of svc.list(); track n.id) {
        <div class="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold shadow-card-lg pointer-events-auto"
             style="animation:slideUp 0.3s cubic-bezier(0.16,1,0.3,1)"
             [class]="n.type==='success' ? 'bg-green-500 text-white'
                    : n.type==='error'   ? 'bg-red-500 text-white'
                    : n.type==='warning' ? 'bg-amber-500 text-white'
                    : 'bg-secondary text-white'">
          <span class="flex-shrink-0 text-base">
            {{ n.type==='success' ? '✓' : n.type==='error' ? '✕' : n.type==='warning' ? '⚠' : 'ℹ' }}
          </span>
          <span>{{ n.message }}</span>
        </div>
      }
    </div>
  `,
})
export class ToastComponent { svc = inject(NotificationService); }
