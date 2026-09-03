import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models';

@Component({
  selector: 'app-register',
  imports: [CommonModule, RouterLink],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);

  // ========== CONFIG ZONE ==========
  readonly VILLES_AUTORISEES = ['Douala'];

  // ========== ÉTATS ==========
  etape         = signal<1 | 2>(1);
  role          = signal<Role>('CLIENT');
  loading       = signal(false);
  erreur        = signal('');
  showPass      = signal(false);

  // GPS / Zone
  villeDetectee  = signal<string | null>(null);
  villeAutorisee = signal(true);
  gpsLoading     = signal(false);
  gpsRefusee     = signal(false);

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
  photoRestoCniRecto = signal<string | null>(null);
  photoRestoCniVerso = signal<string | null>(null);

  roles: { value: Role; label: string; emoji: string; desc: string }[] = [
    { value: 'CLIENT',     label: 'Client',     emoji: '🛒', desc: 'Je veux commander des repas' },
    { value: 'RESTAURANT', label: 'Restaurant', emoji: '🍽️', desc: 'Je veux vendre mes plats' },
    { value: 'LIVREUR',    label: 'Livreur',    emoji: '🛵', desc: 'Je veux effectuer des livraisons' },
  ];

  ngOnInit(): void {
    this.detecterVille();
  }

  // ========== GPS / ZONE ==========
  utiliserDoualaParDefaut(): void {
    this.villeDetectee.set('Douala');
    this.villeAutorisee.set(true);
    this.gpsLoading.set(false);
    this.gpsRefusee.set(true);
  }

  async detecterVille(): Promise<void> {
    if (!navigator.geolocation) {
      this.utiliserDoualaParDefaut();
      return;
    }

    this.gpsLoading.set(true);
    this.gpsRefusee.set(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=fr`
          );
          if (!res.ok) throw new Error('Nominatim unavailable');

          const data = await res.json();
          const ville = data.address?.city || data.address?.town || data.address?.state || 'Douala';
          this.villeDetectee.set(ville);
          const autorisee = this.VILLES_AUTORISEES.some(v =>
            ville.toLowerCase().includes(v.toLowerCase())
          );
          this.villeAutorisee.set(autorisee);
          this.gpsRefusee.set(false);
        } catch {
          this.utiliserDoualaParDefaut();
        } finally {
          this.gpsLoading.set(false);
        }
      },
      (error) => {
        console.warn('GPS non disponible:', error);
        this.utiliserDoualaParDefaut();
        this.gpsRefusee.set(true);
        this.gpsLoading.set(false);
      },
      { timeout: 20000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  }

  // ========== UI HELPERS ==========
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
      motDePasse: (val) => this.motDePasse.set(val),
      nomResto:   (val) => this.nomResto.set(val),
    };
    map[field]?.(v);
    this.erreur.set('');
  }

  // 🔥 NOUVEAU : Gère les inputs téléphone (chiffres uniquement, max 9)
  onPhoneInput(event: Event, field: 'telephone' | 'numeroMoMo' = 'telephone'): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, 9);
    if (field === 'telephone') {
      this.telephone.set(cleaned);
    } else {
      this.numeroMoMo.set(cleaned);
    }
    input.value = cleaned;
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
      if (field === 'restoCniRecto') this.photoRestoCniRecto.set(res);
      if (field === 'restoCniVerso') this.photoRestoCniVerso.set(res);
    };
    reader.readAsDataURL(file);
  }

  private validateRoleSpecificFields(): string | null {
    if (this.role() === 'RESTAURANT') {
      if (!this.nomResto().trim()) return 'Le nom du restaurant est obligatoire.';
      if (!this.numeroMoMo().trim()) return 'Le numéro Mobile Money du restaurant est obligatoire.';
      if (this.numeroMoMo().length !== 9) return 'Le numéro Mobile Money doit faire exactement 9 chiffres.';
      if (!this.photoFacade()) return 'La photo de la façade du restaurant est obligatoire.';
      if (!this.photoRestoCniRecto() || !this.photoRestoCniVerso()) {
        return 'Les deux photos de la CNI du restaurant sont obligatoires.';
      }
    }

    if (this.role() === 'LIVREUR') {
      if (!this.photoCniRecto() || !this.photoCniVerso()) {
        return 'Les deux photos de la CNI du livreur sont obligatoires.';
      }
    }

    return null;
  }

  // ========== SUBMIT ==========
  onSubmit(): void {
    if (!this.prenom().trim()) {
      this.erreur.set('Le prénom est obligatoire.'); return;
    }
    if (!this.nom().trim()) {
      this.erreur.set('Le nom est obligatoire.'); return;
    }
    if (!this.email().trim() || !this.email().includes('@') || !this.email().includes('.')) {
      this.erreur.set('Entre un email valide (ex: nom@email.com).'); return;
    }
    if (!this.telephone().trim()) {
      this.erreur.set('Le numéro de téléphone est obligatoire.'); return;
    }
    if (this.telephone().length !== 9) {
      this.erreur.set('Le numéro doit faire exactement 9 chiffres.'); return;
    }
    if (this.motDePasse().length < 6) {
      this.erreur.set('Le mot de passe doit faire au moins 6 caractères.'); return;
    }

    const roleError = this.validateRoleSpecificFields();
    if (roleError) {
      this.erreur.set(roleError);
      return;
    }

    this.loading.set(true);
    this.erreur.set('');

    const registerData = {
      prenom:     this.prenom().trim(),
      nom:        this.nom().trim(),
      email:      this.email().trim().toLowerCase(),
      telephone:  `+237${this.telephone().trim()}`,
      motDePasse: this.motDePasse(),
      role:       this.role(),
      ...(this.role() === 'RESTAURANT' && { nomRestaurant: this.nomResto().trim() }),
      ...(this.role() === 'RESTAURANT' && this.photoFacade() && { photoFacade: this.photoFacade() }),
      ...(this.role() === 'RESTAURANT' && this.photoRestoCniRecto() && { cniRecto: this.photoRestoCniRecto() }),
      ...(this.role() === 'RESTAURANT' && this.photoRestoCniVerso() && { cniVerso: this.photoRestoCniVerso() }),
      ...(this.role() === 'LIVREUR' && this.photoCniRecto() && { cniRecto: this.photoCniRecto() }),
      ...(this.role() === 'LIVREUR' && this.photoCniVerso() && { cniVerso: this.photoCniVerso() }),
      ...(this.numeroMoMo().trim() && { numeroMoMo: `+237${this.numeroMoMo().trim()}` }),
    };

    this.auth.register(registerData).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.auth.redirectAfterAuth(res.user);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 409 || err.error?.message?.includes('déjà')) {
          this.erreur.set('Cet email ou ce numéro est déjà utilisé.');
        } else if (err.status === 400) {
          this.erreur.set('Données invalides. Vérifie tes informations.');
        } else if (err.status === 0) {
          this.erreur.set('Impossible de contacter le serveur. Vérifie que le backend est lancé sur localhost:8080.');
        } else {
          this.erreur.set(err.error?.message || 'Une erreur est survenue. Réessaie.');
        }
      }
    });
  }
}