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
  mdpMsg     = signal('');

  togglePass(): void { this.showPass.update(v => !v); }

  onEmailChange(e: Event): void { 
    this.email.set((e.target as HTMLInputElement).value); 
    this.erreur.set(''); 
    this.mdpMsg.set(''); 
  }
  
  onPassChange(e: Event): void { 
    this.motDePasse.set((e.target as HTMLInputElement).value); 
    this.erreur.set(''); 
  }

  onSubmit(): void {
    const email = this.email().trim();
    const pass = this.motDePasse();

    if (!email || !pass) {
      this.erreur.set('Veuillez remplir tous les champs.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      this.erreur.set('Entre un email valide.');
      return;
    }
    if (pass.length < 6) {
      this.erreur.set('Mot de passe minimum 6 caractères.');
      return;
    }

    this.erreur.set('');
    this.loading.set(true);

    // 🔥 APPEL RÉEL AU BACKEND
    this.auth.login(email, pass).subscribe({
      next: (res) => {
        this.loading.set(false);
        const dest: Record<Role, string> = {
          CLIENT:     '/home',
          RESTAURANT: '/dashboard/restaurant',
          LIVREUR:    '/dashboard/livreur',
          ADMIN:      '/dashboard/admin',
        };
        this.router.navigate([dest[res.user.role]]);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401 || err.status === 403) {
          this.erreur.set('Email ou mot de passe incorrect.');
        } else if (err.status === 0) {
          this.erreur.set('Serveur injoignable. Vérifie que le backend tourne sur localhost:8080.');
        } else {
          this.erreur.set(err.error?.message || 'Erreur de connexion. Réessaie.');
        }
      }
    });
  }

  // Garde le mock rapide pour tester les dashboards
  connexionRapide(role: Role): void {
    this.auth.loginMock(role);
    const dest: Record<Role, string> = {
      CLIENT: '/home', RESTAURANT: '/dashboard/restaurant',
      LIVREUR: '/dashboard/livreur', ADMIN: '/dashboard/admin',
    };
    this.router.navigate([dest[role]]);
  }

  motDePasseOublie(): void {
    if (!this.email()) {
      this.erreur.set("Entre d'abord ton email, puis clique sur 'Mot de passe oublie'.");
      return;
    }
    this.mdpMsg.set('Un email de reinitialisation sera envoye a ' + this.email() + ' des que le backend sera connecte.');
    setTimeout(() => this.mdpMsg.set(''), 5000);
  }
}