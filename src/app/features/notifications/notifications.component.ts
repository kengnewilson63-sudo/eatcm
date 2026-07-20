import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-enter max-w-lg mx-auto px-4 py-6">
      <h1 class="text-xl font-extrabold text-secondary mb-4">🔔 Notifications</h1>
      <div class="text-center py-16">
        <p class="text-5xl mb-3">🔔</p>
        <p class="font-bold text-secondary mb-2">Aucune notification</p>
        <p class="text-sm text-muted">Tes notifications apparaîtront ici</p>
      </div>
    </div>
  `,
})
export class NotificationsComponent {}
