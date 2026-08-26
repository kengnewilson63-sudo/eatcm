import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-en-attente-validation',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center px-4">
      <div class="max-w-md mx-auto w-full text-center">
        
        <div class="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        <h1 class="text-2xl font-extrabold text-secondary mb-2">Validation en cours ⏳</h1>
        
        <p class="text-muted text-sm mb-6 leading-relaxed">
          Ton compte est en attente de validation par notre équipe.<br>
          Cela prend généralement <strong>24 à 48 heures</strong>.
        </p>

        <div class="bg-white rounded-2xl p-6 shadow-card text-left space-y-3">
          <p class="text-sm text-secondary font-semibold">Pour accélérer la validation :</p>
          <ul class="text-sm text-muted space-y-2 list-disc list-inside">
            <li>Vérifie que ta CNI est bien uploadée</li>
            <li>Ajoute une photo claire de la façade de ton restaurant</li>
            <li>Ton numéro de téléphone doit être joignable</li>
          </ul>
        </div>

        <div class="mt-6 space-y-3">
          <button (click)="logout()" class="w-full py-3.5 rounded-full text-white font-bold text-sm border-none cursor-pointer" style="background:#FF5A36">
            Se déconnecter
          </button>
        </div>

      </div>
    </div>
  `
})
export class EnAttenteValidationComponent {
  private auth = inject(AuthService);
  logout(): void { this.auth.logout(); }
}