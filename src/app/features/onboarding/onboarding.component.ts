import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface SlideOnboarding {
  emoji:       string;
  titre:       string;
  description: string;
  couleur:     string;
  image:       string;
}

@Component({
  selector: 'app-onboarding',
  imports: [CommonModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent {
readonly router = inject(Router);

  slideActuel = signal(0);
  direction   = signal<'next' | 'prev'>('next');

  slides: SlideOnboarding[] = [
    {
      emoji:       '🍽️',
      titre:       'Bienvenue sur EatsCM',
      description: 'La première app de livraison de repas à Douala. Commande tes plats préférés en quelques clics !',
      couleur:     '#FF5A36',
      image:       'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    },
    {
      emoji:       '📱',
      titre:       'Découvre les plats en vidéo',
      description: 'Swipe le feed Discover pour voir les plats en action. Like, commente et commande directement !',
      couleur:     '#FF7A5C',
      image:       'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80',
    },
    {
      emoji:       '🛵',
      titre:       'Livraison rapide à Douala',
      description: 'Suis ton livreur en temps réel sur la carte. Livraison en 20-45 minutes selon ta zone.',
      couleur:     '#FF5A36',
      image:       'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80',
    },
    {
      emoji:       '💳',
      titre:       'Paiement Mobile Money',
      description: 'Paye avec Orange Money, MTN MoMo ou en cash à la livraison. Simple et sécurisé !',
      couleur:     '#FF7A5C',
      image:       'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80',
    },
  ];

  get slide(): SlideOnboarding {
    return this.slides[this.slideActuel()];
  }

  get estDernier(): boolean {
    return this.slideActuel() === this.slides.length - 1;
  }

  suivant(): void {
    if (this.estDernier) {
      this.terminer();
      return;
    }
    this.direction.set('next');
    this.slideActuel.update(i => i + 1);
  }

  precedent(): void {
    if (this.slideActuel() === 0) return;
    this.direction.set('prev');
    this.slideActuel.update(i => i - 1);
  }

  allerA(index: number): void {
    this.direction.set(index > this.slideActuel() ? 'next' : 'prev');
    this.slideActuel.set(index);
  }

  terminer(): void {
    // Marque l'onboarding comme vu
    localStorage.setItem('eatscm_onboarding_vu', 'true');
    this.router.navigate(['/auth/register']);
  }

  passer(): void {
    localStorage.setItem('eatscm_onboarding_vu', 'true');
    this.router.navigate(['/home']);
  }
}