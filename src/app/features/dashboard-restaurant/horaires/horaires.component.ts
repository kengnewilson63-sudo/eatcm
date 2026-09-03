import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { NotificationService } from '../../../core/services/notification.service';

interface HoraireJour {
  jour: string;
  jourCourt: string;
  ouverture: string;
  fermeture: string;
  ferme: boolean;
}

const HORAIRES_DEFAUT: HoraireJour[] = [
  { jour: 'Lundi',    jourCourt: 'Lun', ouverture: '08:00', fermeture: '22:00', ferme: false },
  { jour: 'Mardi',    jourCourt: 'Mar', ouverture: '08:00', fermeture: '22:00', ferme: false },
  { jour: 'Mercredi', jourCourt: 'Mer', ouverture: '08:00', fermeture: '22:00', ferme: false },
  { jour: 'Jeudi',    jourCourt: 'Jeu', ouverture: '08:00', fermeture: '22:00', ferme: false },
  { jour: 'Vendredi', jourCourt: 'Ven', ouverture: '08:00', fermeture: '23:00', ferme: false },
  { jour: 'Samedi',   jourCourt: 'Sam', ouverture: '09:00', fermeture: '23:00', ferme: false },
  { jour: 'Dimanche', jourCourt: 'Dim', ouverture: '10:00', fermeture: '20:00', ferme: true  },
];

@Component({
  selector: 'app-horaires',
  imports: [CommonModule],
  templateUrl: './horaires.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorairesComponent implements OnInit {
  private restoSvc = inject(RestaurantService);
  private notif = inject(NotificationService);

  // Toggle ouvert/fermé maintenant (override manuel)
  ouvertMaintenant = signal(true);
  saveSuccess      = signal(false);
  loading          = signal(false);
  horaires = signal<HoraireJour[]>(HORAIRES_DEFAUT);

  ngOnInit(): void {
    this.chargerRestaurant();
  }

  private chargerRestaurant(): void {
    this.restoSvc.getMonRestaurant().subscribe({
      next: (resto) => {
        this.ouvertMaintenant.set(resto.ouvert ?? true);
        if (resto.horairesJson) {
          try {
            const parsed = JSON.parse(resto.horairesJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.horaires.set(parsed);
            }
          } catch (e) {
            console.error('Erreur parsing horairesJson:', e);
          }
        }
      },
      error: (err) => {
        console.error('Erreur chargement restaurant pour horaires:', err);
      }
    });
  }

  // Calcule si le restaurant est ouvert selon les horaires
  readonly estOuvertAutomatique = computed(() => {
    const maintenant  = new Date();
    const jours       = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    const nomJour     = jours[maintenant.getDay()];
    const horaire     = this.horaires().find(h => h.jour === nomJour);

    if (!horaire || horaire.ferme) return false;

    const [hO, mO] = horaire.ouverture.split(':').map(Number);
    const [hF, mF] = horaire.fermeture.split(':').map(Number);
    const now       = maintenant.getHours() * 60 + maintenant.getMinutes();

    return now >= hO * 60 + mO && now <= hF * 60 + mF;
  });

  readonly jourActuel = computed(() => {
    const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    return jours[new Date().getDay()];
  });

  readonly horaireAujourdhui = computed(() =>
    this.horaires().find(h => h.jour === this.jourActuel())
  );

  readonly heureActuelle = computed(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  });

  // Toggle un jour fermé/ouvert
  toggleJour(index: number): void {
    this.horaires.update(l => l.map((h, i) =>
      i === index ? { ...h, ferme: !h.ferme } : h
    ));
  }

  // Modifier l'heure d'ouverture
  setOuverture(index: number, e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.horaires.update(l => l.map((h, i) =>
      i === index ? { ...h, ouverture: val } : h
    ));
  }

  // Modifier l'heure de fermeture
  setFermeture(index: number, e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.horaires.update(l => l.map((h, i) =>
      i === index ? { ...h, fermeture: val } : h
    ));
  }

  // Copier les horaires du lundi à tous les jours ouvrables
  copierLundiATous(): void {
    const lundi = this.horaires()[0];
    this.horaires.update(l => l.map(h =>
      h.jour === 'Samedi' || h.jour === 'Dimanche'
        ? h
        : { ...h, ouverture: lundi.ouverture, fermeture: lundi.fermeture }
    ));
  }

  // Sauvegarder les horaires
  sauvegarder(): void {
    this.loading.set(true);
    const json = JSON.stringify(this.horaires());
    this.restoSvc.updateHoraires(json).subscribe({
      next: () => {
        this.loading.set(false);
        this.saveSuccess.set(true);
        this.notif.success('Horaires mis à jour avec succès !');
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: (err) => {
        this.loading.set(false);
        this.notif.error('Erreur lors de la sauvegarde des horaires.');
        console.error(err);
      }
    });
  }

  // Toggle ouvert/fermé maintenant (override immédiat)
  toggleOuvertMaintenant(): void {
    const nouveauStatut = !this.ouvertMaintenant();
    this.ouvertMaintenant.set(nouveauStatut);
    this.restoSvc.toggleStatut(nouveauStatut).subscribe({
      next: () => {
        this.notif.info(nouveauStatut ? 'Votre restaurant est maintenant ouvert !' : 'Votre restaurant est maintenant fermé.');
      },
      error: (err) => {
        this.ouvertMaintenant.set(!nouveauStatut); // rollback
        this.notif.error('Erreur lors du changement de statut.');
        console.error(err);
      }
    });
  }

  heuresRestantes(): string {
    const horaire = this.horaireAujourdhui();
    if (!horaire || horaire.ferme) return '';
    const [hF, mF] = horaire.fermeture.split(':').map(Number);
    const now       = new Date();
    const diffMin   = (hF * 60 + mF) - (now.getHours() * 60 + now.getMinutes());
    if (diffMin <= 0) return 'Fermé maintenant';
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return h > 0 ? `Ferme dans ${h}h${m > 0 ? m + 'min' : ''}` : `Ferme dans ${m} min`;
  }
}