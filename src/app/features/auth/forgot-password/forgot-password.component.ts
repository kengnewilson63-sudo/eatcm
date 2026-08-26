import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center px-4">
      <div class="max-w-md mx-auto w-full text-center">
        <h1 class="text-2xl font-extrabold text-secondary mb-1">Mot de passe oublié ?</h1>
        <p class="text-muted text-sm mb-6">On t'envoie un lien de réinitialisation</p>

        <div class="bg-white rounded-3xl p-6 shadow-card space-y-4">
          <div class="space-y-1.5 text-left">
            <label class="text-xs font-bold text-secondary uppercase">Email</label>
            <input type="email" placeholder="ton@email.com" [value]="email()" (input)="onEmail($event)" class="input-field"/>
          </div>

          @if (message()) {
            <div class="px-4 py-3 bg-green-50 rounded-xl border border-green-100">
              <p class="text-sm text-green-700 font-medium">{{ message() }}</p>
            </div>
          }

          @if (erreur()) {
            <div class="px-4 py-3 bg-red-50 rounded-xl border border-red-100">
              <p class="text-sm text-red-600 font-medium">{{ erreur() }}</p>
            </div>
          }

          <button (click)="onSubmit()" [disabled]="loading()" class="w-full py-3.5 rounded-full text-white font-bold text-sm border-none cursor-pointer disabled:opacity-60" style="background:#FF5A36">
            @if (loading()) { Envoi en cours... } @else { Envoyer le lien }
          </button>

          <p class="text-center text-sm text-muted">
            <a routerLink="/auth/login" class="text-primary font-bold no-underline">← Retour au login</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);

  email   = signal('');
  loading = signal(false);
  message = signal('');
  erreur  = signal('');

  onEmail(e: Event): void {
    this.email.set((e.target as HTMLInputElement).value);
    this.erreur.set('');
  }

  onSubmit(): void {
    if (!this.email().trim() || !this.email().includes('@')) {
      this.erreur.set('Entre un email valide.'); return;
    }
    this.loading.set(true);
    this.auth.forgotPassword(this.email().trim()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.message.set(res.message);
        this.email.set('');
      },
      error: () => {
        this.loading.set(false);
        this.message.set('Si cet email existe, un lien a été envoyé.');
      }
    });
  }
}