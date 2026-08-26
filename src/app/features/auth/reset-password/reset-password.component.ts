import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center px-4">
      <div class="max-w-md mx-auto w-full text-center">
        <h1 class="text-2xl font-extrabold text-secondary mb-1">Nouveau mot de passe</h1>
        <p class="text-muted text-sm mb-6">Choisis un mot de passe sécurisé</p>

        <div class="bg-white rounded-3xl p-6 shadow-card space-y-4">
          <div class="space-y-1.5 text-left">
            <label class="text-xs font-bold text-secondary uppercase">Nouveau mot de passe</label>
            <input type="password" placeholder="Min. 6 caractères" [value]="password()" (input)="onPass($event)" class="input-field"/>
          </div>

          @if (success()) {
            <div class="px-4 py-3 bg-green-50 rounded-xl">
              <p class="text-sm text-green-700 font-medium">{{ message() }}</p>
              <p class="text-xs text-green-600 mt-1">Redirection vers le login...</p>
            </div>
          }

          @if (erreur()) {
            <div class="px-4 py-3 bg-red-50 rounded-xl">
              <p class="text-sm text-red-600 font-medium">{{ erreur() }}</p>
            </div>
          }

          <button (click)="onSubmit()" [disabled]="loading() || !token()" class="w-full py-3.5 rounded-full text-white font-bold text-sm border-none cursor-pointer disabled:opacity-60" style="background:#FF5A36">
            @if (loading()) { Mise à jour... } @else { Réinitialiser }
          </button>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private auth   = inject(AuthService);

  token     = signal<string | null>(null);
  password  = signal('');
  loading   = signal(false);
  success   = signal(false);
  erreur    = signal('');
  message   = signal('');

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      this.token.set(p['token'] || null);
      if (!this.token()) this.erreur.set('Lien invalide.');
    });
  }

  onPass(e: Event): void {
    this.password.set((e.target as HTMLInputElement).value);
    this.erreur.set('');
  }

  onSubmit(): void {
    if (!this.token()) { this.erreur.set('Token manquant.'); return; }
    if (this.password().length < 6) { this.erreur.set('Min. 6 caractères.'); return; }

    this.loading.set(true);
    this.auth.resetPassword(this.token()!, this.password()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(true);
        this.message.set(res.message);
        setTimeout(() => this.router.navigate(['/auth/login']), 2500);
      },
      error: (err) => {
        this.loading.set(false);
        this.erreur.set(err.error?.message || 'Lien invalide ou expiré.');
      }
    });
  }
}