import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RestaurantService,
  InvitationLivreur as InvitationApi,
} from '../../../core/services/restaurant.service';
import { NotificationService } from '../../../core/services/notification.service';

export type StatutLivreur = 'ACTIF' | 'ACCEPTEE' | 'EN_ATTENTE' | 'EXPIREE';

export interface LivreurInterne {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  statut: StatutLivreur;
  token: string;
  dateAjout: string;
  dateExpiration: string;
}

@Component({
  selector: 'app-livreurs-restaurant',
  imports: [CommonModule],
  templateUrl: './livreurs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LivreursRestaurantComponent implements OnInit {
  private restoSvc = inject(RestaurantService);
  private notif = inject(NotificationService);

  // ─── Signals ───
  loading      = signal(false);
  modalInvit   = signal(false);
  modeInvit    = signal<'SMS' | 'EMAIL'>('SMS');
  invitTel     = signal('');
  invitEmail   = signal('');
  invitNom     = signal('');
  invitSucces  = signal(false);
  invitErreur  = signal('');
  lienGenere   = signal('');

  livreurs = signal<LivreurInterne[]>([]);

  readonly stats = computed(() => ({
    total:   this.livreurs().length,
    actifs:  this.livreurs().filter(l => l.statut === 'ACCEPTEE').length,
    attente: this.livreurs().filter(l => l.statut === 'EN_ATTENTE').length,
    expirees: this.livreurs().filter(l => l.statut === 'EXPIREE').length,
  }));

  ngOnInit(): void {
    this.chargerInvitations();
  }

  /** Charge les invitations envoyées par le restaurant connecté. */
  chargerInvitations(): void {
    this.loading.set(true);
    this.restoSvc.getMesInvitations().subscribe({
      next: invitations => {
        this.livreurs.set(invitations.map(i => this.versLivreur(i)));
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.notif.error('Impossible de charger tes invitations livreurs');
        console.error(err);
      }
    });
  }

  private versLivreur(i: InvitationApi): LivreurInterne {
    const parts = (i.livreurNom ?? '').trim().split(' ');
    return {
      id: i.id,
      prenom: parts[0] ?? '',
      nom: parts.slice(1).join(' ') || parts[0] || '',
      telephone: i.telephone ?? '',
      email: i.email ?? '',
      statut: i.statut === 'ACCEPTEE' ? 'ACCEPTEE' : (i.statut === 'EXPIREE' ? 'EXPIREE' : 'EN_ATTENTE'),
      token: i.token,
      dateAjout: i.dateCreation,
      dateExpiration: i.dateExpiration,
    };
  }

  // ─── Méthodes ───

  inviter(): void {
    this.invitErreur.set('');

    if (!this.invitNom().trim()) {
      this.invitErreur.set('Le nom est obligatoire.');
      return;
    }
    if (this.modeInvit() === 'SMS' && !this.invitTel().trim()) {
      this.invitErreur.set('Le numéro de téléphone est obligatoire.');
      return;
    }
    if (this.modeInvit() === 'EMAIL' && !this.invitEmail().trim()) {
      this.invitErreur.set("L'adresse email est obligatoire.");
      return;
    }

    const payload = {
      nom: this.invitNom().trim(),
      mode: this.modeInvit(),
      telephone: this.modeInvit() === 'SMS' ? `+237${this.invitTel().trim()}` : undefined,
      email: this.modeInvit() === 'EMAIL' ? this.invitEmail().trim() : undefined,
    };

    this.restoSvc.inviterLivreur(payload).subscribe({
      next: res => {
        this.livreurs.update(l => [
          this.versLivreur({
            id: res.id, restaurantId: 0, livreurNom: payload.nom,
            telephone: payload.telephone ?? null, email: payload.email ?? null,
            token: res.token, statut: 'EN_ATTENTE',
            dateCreation: new Date().toISOString(), dateExpiration: res.dateExpiration,
          }),
          ...l,
        ]);
        this.invitSucces.set(true);
        this.lienGenere.set(res.lien);
        this.notif.success(res.message);
        setTimeout(() => this.fermerModal(), 6000);
      },
      error: err => {
        this.invitErreur.set(err?.error?.message || "Échec de l'envoi de l'invitation.");
        console.error(err);
      }
    });
  }

  private fermerModal(): void {
    this.invitSucces.set(false);
    this.lienGenere.set('');
    this.modalInvit.set(false);
    this.invitNom.set('');
    this.invitTel.set('');
    this.invitEmail.set('');
    this.invitErreur.set('');
  }

  async copierLien(lien?: string): Promise<void> {
    const url = lien ?? this.lienGenere();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.notif.success('Lien copié ! 🔗');
    } catch {
      this.notif.warning(url);
    }
  }

  /** Reconstruit le lien d'invitation à partir du token. */
  lienInvitation(l: LivreurInterne): string {
    return `${window.location.origin}/auth/register?role=LIVREUR&invitation=${l.token}`;
  }

  badgeClass(s: StatutLivreur): string {
    if (s === 'ACCEPTEE')   return 'bg-green-100 text-green-700';
    if (s === 'EN_ATTENTE') return 'bg-amber-100 text-amber-700';
    if (s === 'EXPIREE')    return 'bg-gray-100 text-gray-500';
    return '';
  }

  badgeLabel(s: StatutLivreur): string {
    if (s === 'ACCEPTEE')   return '● Actif';
    if (s === 'EN_ATTENTE') return '⏳ En attente';
    if (s === 'EXPIREE')    return '✕ Expirée';
    return '';
  }

  onField(field: string, e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    if (field === 'tel')   this.invitTel.set(v);
    if (field === 'email') this.invitEmail.set(v);
    if (field === 'nom')   this.invitNom.set(v);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getInitials(l: LivreurInterne): string {
    return `${l.prenom?.[0] ?? ''}${l.nom?.[0] ?? ''}`.toUpperCase();
  }
}