import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet/>'
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    const vu = localStorage.getItem('eatscm_onboarding_vu');

    if (user) {
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

    if (!vu) {
      this.router.navigate(['/onboarding']);
    }
  }
}