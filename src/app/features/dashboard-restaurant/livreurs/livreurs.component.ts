import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatutLivreur = 'ACTIF' | 'INACTIF' | 'EN_ATTENTE';

export interface LivreurInterne {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  statut: StatutLivreur;
  livraisons: number;
  gainsMois: number;
  cashDu: number;
  dateAjout: string;
}

@Component({
  selector: 'app-livreurs-restaurant',
  imports: [CommonModule],
  templateUrl: './livreurs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LivreursRestaurantComponent {
  // ─── Signals ───
  modalInvit   = signal(false);
  modeInvit    = signal<'SMS' | 'EMAIL'>('SMS');
  invitTel     = signal('');
  invitEmail   = signal('');
  invitNom     = signal('');
  invitSucces  = signal(false);
  invitErreur  = signal('');
  lienGenere   = signal('');

  livreurs = signal<LivreurInterne[]>([
    {
      id: 1, nom: 'Mbarga', prenom: 'Jean', telephone: '+237677123456',
      email: 'jean.mbarga@gmail.com', statut: 'ACTIF', livraisons: 45,
      gainsMois: 67500, cashDu: 12500, dateAjout: '2025-01-01T00:00:00',
    },
    {
      id: 2, nom: 'Fotso', prenom: 'Paul', telephone: '+237655987654',
      email: 'paul.fotso@gmail.com', statut: 'ACTIF', livraisons: 23,
      gainsMois: 34500, cashDu: 0, dateAjout: '2025-01-10T00:00:00',
    },
    {
      id: 3, nom: 'Nkolo', prenom: 'Alain', telephone: '+237699456123',
      email: 'alain.nkolo@gmail.com', statut: 'EN_ATTENTE', livraisons: 0,
      gainsMois: 0, cashDu: 0, dateAjout: '2025-01-14T00:00:00',
    },
  ]);

  readonly stats = computed(() => ({
    total:     this.livreurs().length,
    actifs:    this.livreurs().filter(l => l.statut === 'ACTIF').length,
    attente:   this.livreurs().filter(l => l.statut === 'EN_ATTENTE').length,
    cashTotal: this.livreurs().reduce((s, l) => s + l.cashDu, 0),
  }));

  // ─── Méthodes ───

  toggleStatut(id: number): void {
    this.livreurs.update(l => l.map(x =>
      x.id === id
        ? { ...x, statut: x.statut === 'ACTIF' ? 'INACTIF' as const : 'ACTIF' as const }
        : x
    ));
  }

  retirer(id: number): void {
    if (!confirm('Retirer ce livreur de ton équipe ?')) return;
    this.livreurs.update(l => l.filter(x => x.id !== id));
  }

  inviter(): void {
    this.invitErreur.set('');

    if (!this.invitNom()) {
      this.invitErreur.set('Le nom est obligatoire.');
      return;
    }

    if (this.modeInvit() === 'SMS' && !this.invitTel()) {
      this.invitErreur.set('Le numéro de téléphone est obligatoire.');
      return;
    }

    if (this.modeInvit() === 'EMAIL' && !this.invitEmail()) {
      this.invitErreur.set("L'adresse email est obligatoire.");
      return;
    }

    const tokenInvit = Math.random().toString(36).substring(2, 10).toUpperCase();
    const lienInvit  = `https://eatscm.cm/invitation?token=${tokenInvit}&resto=1`;

    const messageSMS = `Bonjour ${this.invitNom()} ! Chez Maman Bibiane vous invite à rejoindre EatsCM comme livreur. Cliquez ici : ${lienInvit}`;
    const messageEmail = `Bonjour ${this.invitNom()},\n\nChez Maman Bibiane vous invite à rejoindre EatsCM comme livreur partenaire.\n\n${lienInvit}\n\nCe lien est valable 48h.\n\nÀ bientôt sur EatsCM 🛵`;

    console.log('Invitation envoyée:', {
      nom:     this.invitNom(),
      contact: this.modeInvit() === 'SMS' ? `+237${this.invitTel()}` : this.invitEmail(),
      lien:    lienInvit,
      message: this.modeInvit() === 'SMS' ? messageSMS : messageEmail,
    });

    const nouveau: LivreurInterne = {
      id:         Date.now(),
      nom:        this.invitNom().split(' ').slice(1).join(' ') || this.invitNom(),
      prenom:     this.invitNom().split(' ')[0],
      telephone:  this.modeInvit() === 'SMS' ? `+237${this.invitTel()}` : '',
      email:      this.modeInvit() === 'EMAIL' ? this.invitEmail() : '',
      statut:     'EN_ATTENTE',
      livraisons: 0,
      gainsMois:  0,
      cashDu:     0,
      dateAjout:  new Date().toISOString(),
    };

    this.livreurs.update(l => [...l, nouveau]);
    this.invitSucces.set(true);
    this.lienGenere.set(lienInvit);

    setTimeout(() => {
      this.invitSucces.set(false);
      this.lienGenere.set('');
      this.modalInvit.set(false);
      this.invitNom.set('');
      this.invitTel.set('');
      this.invitEmail.set('');
    }, 4000);
  }

  async copierLien(): Promise<void> {
    await navigator.clipboard.writeText(this.lienGenere());
    alert('Lien copié ! 🔗');
  }

  badgeClass(s: StatutLivreur): string {
    if (s === 'ACTIF')      return 'bg-green-100 text-green-700';
    if (s === 'INACTIF')    return 'bg-gray-100 text-gray-500';
    if (s === 'EN_ATTENTE') return 'bg-amber-100 text-amber-700';
    return '';
  }

  badgeLabel(s: StatutLivreur): string {
    if (s === 'ACTIF')      return '● Actif';
    if (s === 'INACTIF')    return '● Inactif';
    if (s === 'EN_ATTENTE') return '⏳ En attente';
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