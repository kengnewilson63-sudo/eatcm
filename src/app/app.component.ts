import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet/>'
})
export class AppComponent implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    // Affiche onboarding seulement à la première ouverture
    const vu = localStorage.getItem('eatscm_onboarding_vu');
    if (!vu) {
      this.router.navigate(['/onboarding']);
    }
  }
}