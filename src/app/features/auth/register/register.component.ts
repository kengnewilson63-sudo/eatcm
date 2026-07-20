import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Role, User } from '../../../core/models';

@Component({
  selector: 'app-register',
  imports: [CommonModule, RouterLink],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  etape         = signal<1 | 2>(1);
  role          = signal<Role>('CLIENT');
  loading       = signal(false);
  erreur        = signal('');
  showPass      = signal(false);

  // Champs formulaire
  prenom        = signal('');
  nom           = signal('');
  email         = signal('');
  telephone     = signal('');
  motDePasse    = signal('');
  nomResto      = signal('');
  numeroMoMo    = signal('');
  photoFacade   = signal<string | null>(null);
  photoCniRecto = signal<string | null>(null);
  photoCniVerso = signal<string | null>(null);

  roles: { value: Role; label: string; emoji: string; desc: string }[] = [
    { value: 'CLIENT',     label: 'Client',     emoji: '🛒', desc: 'Je veux commander des repas' },
    { value: 'RESTAURANT', label: 'Restaurant', emoji: '🍽️', desc: 'Je veux vendre mes plats' },
    { value: 'LIVREUR',    label: 'Livreur',    emoji: '🛵', desc: 'Je veux effectuer des livraisons' },
  ];

  badgeClass(r: Role): string {
    if (r === 'CLIENT')     return 'role-badge-client';
    if (r === 'RESTAURANT') return 'role-badge-restaurant';
    if (r === 'LIVREUR')    return 'role-badge-livreur';
    return 'role-badge-admin';
  }

  selectRole(r: Role): void { this.role.set(r); }

  nextEtape(): void {
    this.erreur.set('');
    this.etape.set(2);
  }

  back(): void {
    this.etape.set(1);
    this.erreur.set('');
  }

  togglePass(): void { this.showPass.update(v => !v); }

  onField(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    const map: Record<string, (val: string) => void> = {
      prenom:     (val) => this.prenom.set(val),
      nom:        (val) => this.nom.set(val),
      email:      (val) => this.email.set(val),
      telephone:  (val) => this.telephone.set(val),
      motDePasse: (val) => this.motDePasse.set(val),
      nomResto:   (val) => this.nomResto.set(val),
      numeroMoMo: (val) => this.numeroMoMo.set(val),
    };
    map[field]?.(v);
    // Reset erreur à chaque saisie
    this.erreur.set('');
  }

  onFile(field: string, e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      if (field === 'facade')   this.photoFacade.set(res);
      if (field === 'cniRecto') this.photoCniRecto.set(res);
      if (field === 'cniVerso') this.photoCniVerso.set(res);
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    // Validation
    if (!this.prenom().trim()) {
      this.erreur.set('Le prénom est obligatoire.'); return;
    }
    if (!this.nom().trim()) {
      this.erreur.set('Le nom est obligatoire.'); return;
    }
    if (!this.email().trim() || !this.email().includes('@')) {
      this.erreur.set('Entre un email valide.'); return;
    }
    if (!this.telephone().trim()) {
      this.erreur.set('Le numéro de téléphone est obligatoire.'); return;
    }
    if (this.motDePasse().length < 6) {
      this.erreur.set('Le mot de passe doit faire au moins 6 caractères.'); return;
    }
    if (this.role() === 'RESTAURANT' && !this.nomResto().trim()) {
      this.erreur.set('Le nom du restaurant est obligatoire.'); return;
    }

    this.loading.set(true);
    this.erreur.set('');

    setTimeout(() => {
      // ✅ FIX PRINCIPAL — utilise les VRAIES données du formulaire
      const user: User = {
        id:           Date.now(),
        prenom:       this.prenom().trim(),
        nom:          this.nom().trim(),
        email:        this.email().trim().toLowerCase(),
        telephone:    `+237${this.telephone().trim()}`,
        role:         this.role(),
        actif:        true,
        dateCreation: new Date().toISOString(),
      };

      // Sauvegarde en session avec les vraies données
      this.auth.saveSession(
        `mock_token_${this.role().toLowerCase()}_${Date.now()}`,
        user
      );

      this.loading.set(false);

      // Redirige selon le rôle
      const dest: Record<Role, string> = {
        CLIENT:     '/home',
        RESTAURANT: '/dashboard/restaurant',
        LIVREUR:    '/dashboard/livreur',
        ADMIN:      '/home',
      };
      this.router.navigate([dest[this.role()]]);
    }, 1000);
  }
}