import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { LivraisonValidationComponent } from '../../../shared/components/livraison-validation/livraison-validation.component';
import { TrackingService } from '../../../core/services/tracking.service';
import { AuthService } from '../../../core/services/auth.service';
import { LivreurService } from '../../../core/services/livreur.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Commande, MoyenTransport } from '../../../core/models';

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
  private auth      = inject(AuthService);
  private livreurApi = inject(LivreurService);
  private notif     = inject(NotificationService);

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
    this.chargerCourses();
  }

  /** Charge les courses disponibles + celles en cours depuis le backend. */
  chargerCourses(): void {
    this.livreurApi.getCoursesDisponibles().subscribe({
      next: dispo => this.courses.update(l => [
        ...l.filter(c => c.statut !== 'DISPONIBLE'),
        ...dispo.map(d => this.versCourse(d.commande, d.distanceKm ?? 0, 'DISPONIBLE')),
      ]),
      error: () => this.notif.error('Impossible de charger les courses disponibles'),
    });

    this.livreurApi.getCoursesEnCours().subscribe({
      next: encours => this.courses.update(l => [
        ...l.filter(c => c.statut !== 'ACCEPTEE' && c.statut !== 'EN_COURS'),
        ...encours.map(c => this.versCourse(
          c, 0,
          c.statut === 'EN_LIVRAISON' ? 'EN_COURS' : 'ACCEPTEE'
        )),
      ]),
      error: () => this.notif.error('Impossible de charger les courses en cours'),
    });

    this.livreurApi.getHistorique().subscribe({
      next: histo => this.courses.update(l => [
        ...l.filter(c => c.statut !== 'LIVREE'),
        ...histo
          .filter(c => c.statut === 'LIVREE')
          .map(c => this.versCourse(c, 0, 'LIVREE')),
      ]),
      error: () => { /* historique non critique */ },
    });
  }

  /** Mappe une Commande backend vers le modèle d'affichage local. */
  private versCourse(c: any, distanceKm: number, statut: Course['statut']): Course {
    const adr = c.adresseLivraison ?? {};
    const quartiers = [adr.quartier, adr.ville].filter(Boolean).join(', ');
    return {
      id: c.id,
      restaurantId: c.restaurantId ?? c.restaurant?.id ?? 0,
      restaurantNom: c.restaurant?.nom ?? c.restaurantNom ?? 'Restaurant',
      restaurantAdresse: c.restaurant?.adresse ?? '',
      clientNom: c.client ? `${c.client.prenom ?? ''} ${c.client.nom ?? ''}`.trim() : 'Client',
      clientAdresse: adr.pointDeRepere || quartiers || 'Adresse à confirmer',
      montantLivraison: c.fraisLivraison ?? 0,
      distanceKm,
      statut,
      modePaiement: c.modePaiement ?? 'CASH',
      dateCreation: c.dateCreation ?? new Date().toISOString(),
    };
  }

  // Toggle disponibilité + GPS
  toggleDisponibilite(): void {
    if (this.statutLivreur() === 'HORS_LIGNE') {
      const idLivreur = this.auth.currentUser()?.id ?? 0;
      this.tracking.demarrerTracking(idLivreur);
      this.tracking.setStatut('DISPONIBLE');
    } else {
      this.tracking.arreterTracking();
      this.tracking.setStatut('HORS_LIGNE');
    }
  }

  setTransport(moyen: MoyenTransport): void {
    this.tracking.setMoyenTransport(moyen);
  }

  accepterCourse(course: Course): void {
    this.livreurApi.accepterCourse(course.id).subscribe({
      next: () => {
        this.courses.update(l => l.map(c =>
          c.id === course.id ? { ...c, statut: 'ACCEPTEE' as const } : c
        ));
        this.tracking.setStatut('EN_COURSE');
        this.onglet.set('EN_COURS');
      },
      error: err => this.notif.error(
        err?.error?.message || 'Cette course a déjà été prise'
      ),
    });
  }

  demarrerLivraison(course: Course): void {
    this.livreurApi.changerStatutCourse(course.id, 'EN_LIVRAISON').subscribe({
      next: () => this.courses.update(l => l.map(c =>
        c.id === course.id ? { ...c, statut: 'EN_COURS' as const } : c
      )),
      error: () => this.notif.error('Impossible de démarrer la livraison'),
    });
  }

  terminerLivraison(course: Course): void {
    this.livreurApi.changerStatutCourse(course.id, 'LIVREE').subscribe({
      next: () => {
        this.courses.update(l => l.map(c =>
          c.id === course.id ? { ...c, statut: 'LIVREE' as const } : c
        ));
        // Redevient disponible après livraison
        this.tracking.setStatut('DISPONIBLE');
        this.onglet.set('LIVREE');
      },
      error: () => this.notif.error('Impossible de valider la livraison'),
    });
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