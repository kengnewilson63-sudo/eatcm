import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email      = signal('');
  motDePasse = signal('');
  loading    = signal(false);
  erreur     = signal('');
  showPass   = signal(false);
  // Mot de passe oublié
  mdpMsg     = signal('');

  onSubmit(): void {
    if (!this.email() || !this.motDePasse()) { this.erreur.set('Veuillez remplir tous les champs.'); return; }
    if (this.motDePasse().length < 6)         { this.erreur.set('Mot de passe minimum 6 caractères.'); return; }
    this.erreur.set(''); this.loading.set(true);
    // Mock — remplacer par this.auth.login(...).subscribe() quand backend prêt
    setTimeout(() => {
      this.auth.loginMockEmail(this.email());
      this.loading.set(false);
      this.router.navigate(['/home']);
    }, 900);
  }

  connexionRapide(role: Role): void {
    this.auth.loginMock(role);
    const dest: Record<Role, string> = {
      CLIENT: '/home', RESTAURANT: '/dashboard/restaurant',
      LIVREUR: '/dashboard/livreur', ADMIN: '/dashboard/admin',
    };
    this.router.navigate([dest[role]]);
  }

  // CORRECTION — Mot de passe oublié fonctionnel
  motDePasseOublie(): void {
    if (!this.email()) {
      this.erreur.set("Entre d'abord ton email, puis clique sur 'Mot de passe oublie'.");
      return;
    }
    this.mdpMsg.set('Un email de reinitialisation sera envoye a ' + this.email() + ' des que le backend sera connecte.');
    setTimeout(() => this.mdpMsg.set(''), 5000);
  }

  togglePass(): void { this.showPass.update(v => !v); }
  onEmailChange(e: Event): void { this.email.set((e.target as HTMLInputElement).value); this.erreur.set(''); this.mdpMsg.set(''); }
  onPassChange(e: Event): void  { this.motDePasse.set((e.target as HTMLInputElement).value); this.erreur.set(''); }
}
