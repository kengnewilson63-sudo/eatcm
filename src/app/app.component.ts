import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NotificationPushService } from './core/services/notificationpush.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet/>'
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private notifPush = inject(NotificationPushService);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    const vu = localStorage.getItem('eatscm_onboarding_vu');

    if (user) {
      // Session restaurée depuis le sessionStorage : rebranche le flux de
      // notifications (chargement initial + STOMP) avant la redirection.
      this.notifPush.demarrer();

      const redirectMap = {
        CLIENT: '/home',
        RESTAURANT: '/dashboard/restaurant',
        LIVREUR: '/dashboard/livreur',
        ADMIN: '/dashboard/admin',
      } as const;

      const target = redirectMap[user.role] ?? '/home';
      if (this.router.url === '/' || this.router.url === '') {
        this.router.navigateByUrl(target);
      }
      return;
    }

    // L'onboarding ne s'affiche que sur la racine. Un `navigate()` inconditionnel
    // ici renvoyait aussi /auth/login et /auth/register vers /onboarding, ce qui
    // rendait la connexion et l'inscription inaccessibles à un nouvel arrivant.
    if (!vu && (this.router.url === '/' || this.router.url === '')) {
      this.router.navigate(['/onboarding']);
    }
  }
}