import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { LivraisonValidationComponent } from '../../../shared/components/livraison-validation/livraison-validation.component';
import { NotificationPushService } from '../../../core/services/notificationpush.service';
import { TrackingService } from '../../../core/services/tracking.service';
import { AuthService } from '../../../core/services/auth.service';
import { MoyenTransport } from '../../../core/models';

interface Course {
  id: number;
  restaurantId: number; // ← AJOUTÉ pour le filtre interne/pool
  restaurantNom: string;
  restaurantAdresse: string;
  clientNom: string;
  clientAdresse: string;
  montantLivraison: number;
  distanceKm: number;
  statut: 'DISPONIBLE' | 'ACCEPTEE' | 'EN_COURS' | 'LIVREE';
  modePaiement: string;
  dateCreation: string;
}

@Component({
  selector: 'app-courses',
  imports: [CommonModule, DecimalPipe, LivraisonValidationComponent],
  templateUrl: './courses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesComponent implements OnInit {
  private tracking  = inject(TrackingService);
  private notifPush = inject(NotificationPushService);
  private auth      = inject(AuthService);

  // Tracking
  readonly estEnTracking  = this.tracking.estEnTracking;
  readonly statutLivreur  = this.tracking.statutLivreur;
  readonly moyenTransport = this.tracking.moyenTransport;
  readonly position       = this.tracking.positionLivreur;

  // Type livreur depuis le profil connecté
  // INTERNE_RESTAURANT → voit seulement son restaurant
  // POOL_PLATEFORME    → voit tout dans sa zone
  readonly typeLivreur = computed(() =>
    (this.auth.currentUser() as any)?.typeLivreur ?? 'POOL_PLATEFORME'
  );

  readonly restaurantProprietaireId = computed(() =>
    (this.auth.currentUser() as any)?.restaurantProprietaireId ?? null
  );

  // Badge affiché dans le header
  readonly badgeLivreur = computed(() =>
    this.typeLivreur() === 'INTERNE_RESTAURANT'
      ? '🟢 Livreur Maison'
      : '🟠 Livreur EatsCM'
  );

  readonly badgeCouleur = computed(() =>
    this.typeLivreur() === 'INTERNE_RESTAURANT'
      ? 'bg-green-100 text-green-700'
      : 'bg-orange-100 text-orange-700'
  );

  // Courses
  courses            = signal<Course[]>([]);
  onglet             = signal<'DISPONIBLE' | 'EN_COURS' | 'LIVREE'>('DISPONIBLE');
  courseEnValidation = signal<Course | null>(null);

  // ✅ FILTRE — interne voit seulement son resto, pool voit tout
  readonly coursesDisponiblesFiltrees = computed(() => {
    const dispo = this.courses().filter(c => c.statut === 'DISPONIBLE');

    if (this.typeLivreur() === 'INTERNE_RESTAURANT') {
      // Livreur interne — seulement les courses de son restaurant
      const monRestoId = this.restaurantProprietaireId();
      return dispo.filter(c => c.restaurantId === monRestoId);
    }

    // Pool plateforme — toutes les courses disponibles dans la zone
    return dispo;
  });

  readonly enCours     = computed(() => this.courses().filter(c => c.statut === 'ACCEPTEE' || c.statut === 'EN_COURS'));
  readonly livrees     = computed(() => this.courses().filter(c => c.statut === 'LIVREE'));
  readonly gainsDuJour = computed(() => this.livrees().reduce((s, c) => s + c.montantLivraison, 0));

  // Trie les courses par distance (plus proche en premier)
  readonly disponiblesTriees = computed(() =>
    [...this.coursesDisponiblesFiltrees()].sort((a, b) => a.distanceKm - b.distanceKm)
  );

  transports: { value: MoyenTransport; label: string; emoji: string }[] = [
    { value: 'MOTO',    label: 'Moto',    emoji: '🛵' },
    { value: 'VOITURE', label: 'Voiture', emoji: '🚗' },
    { value: 'VELO',    label: 'Vélo',    emoji: '🚲' },
    { value: 'PIED',    label: 'À pied',  emoji: '🚶' },
  ];

  ngOnInit(): void {
    this.courses.set([
      // restaurantId 1 = Chez Maman Bibiane
      { id: 2001, restaurantId: 1, restaurantNom: 'Chez Maman Bibiane', restaurantAdresse: 'Akwa, Douala',      clientNom: 'Paul Kamga',   clientAdresse: 'Bonamoussadi, Douala', montantLivraison: 1500, distanceKm: 3.2, statut: 'DISPONIBLE', modePaiement: 'MTN_MOMO',     dateCreation: new Date().toISOString() },
      // restaurantId 2 = Le Grill Akwa
      { id: 2002, restaurantId: 2, restaurantNom: 'Le Grill Akwa',      restaurantAdresse: 'Akwa, Douala',      clientNom: 'Marie Biya',   clientAdresse: 'Makepe, Douala',      montantLivraison: 2500, distanceKm: 6.8, statut: 'DISPONIBLE', modePaiement: 'CASH',         dateCreation: new Date().toISOString() },
      // restaurantId 3 = Pizza Roma
      { id: 2003, restaurantId: 3, restaurantNom: 'Pizza Roma',         restaurantAdresse: 'Bonapriso, Douala', clientNom: 'Eric Tchoupo', clientAdresse: 'Bali, Douala',        montantLivraison: 1000, distanceKm: 1.5, statut: 'EN_COURS',   modePaiement: 'ORANGE_MONEY', dateCreation: new Date().toISOString() },
      { id: 2004, restaurantId: 1, restaurantNom: 'Sweet Burger',       restaurantAdresse: 'Deido, Douala',     clientNom: 'Sophie Nkolo', clientAdresse: 'Logpom, Douala',      montantLivraison: 2500, distanceKm: 7.2, statut: 'LIVREE',     modePaiement: 'CASH',         dateCreation: new Date().toISOString() },
    ]);

    // Simule une nouvelle course après 8s
    setTimeout(() => {
      this.notifPush.notifierCourseDisponible(2005, 'Chez Maman Bibiane', 2500, 4.2);
    }, 8000);
  }

  // Toggle disponibilité + GPS
  toggleDisponibilite(): void {
    if (this.statutLivreur() === 'HORS_LIGNE') {
      this.tracking.demarrerTracking(3);
      this.tracking.setStatut('DISPONIBLE');
    } else {
      this.tracking.arreterTracking();
    }
  }

  setTransport(moyen: MoyenTransport): void {
    this.tracking.setMoyenTransport(moyen);
  }

  accepterCourse(course: Course): void {
    this.courses.update(l => l.map(c =>
      c.id === course.id ? { ...c, statut: 'ACCEPTEE' as const } : c
    ));
    // Passe en statut EN_COURSE
    this.tracking.setStatut('EN_COURSE');
    this.onglet.set('EN_COURS');
  }

  demarrerLivraison(course: Course): void {
    this.courses.update(l => l.map(c =>
      c.id === course.id ? { ...c, statut: 'EN_COURS' as const } : c
    ));
  }

  terminerLivraison(course: Course): void {
    this.courses.update(l => l.map(c =>
      c.id === course.id ? { ...c, statut: 'LIVREE' as const } : c
    ));
    // Redevient disponible après livraison
    this.tracking.setStatut('DISPONIBLE');
    this.onglet.set('LIVREE');
  }

  ouvrirValidation(course: Course): void {
    this.courseEnValidation.set(course);
  }

  onLivraisonValidee(result: any): void {
    this.terminerLivraison(this.courseEnValidation()!);
    this.courseEnValidation.set(null);
  }

  heureFormat(d: string): string {
    return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}