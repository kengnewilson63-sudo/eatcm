import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Litige } from '../../../core/models';

type StatutLitige = Litige['statut'];

@Component({
  selector: 'app-admin-litiges',
  imports: [CommonModule],
  templateUrl: './litiges.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LitigesComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private notif = inject(NotificationService);

  litiges = signal<Litige[]>([]);

  ngOnInit(): void {
    this.adminSvc.getLitiges().subscribe({
      next: data => this.litiges.set(data ?? []),
      error: () => { /* liste vide conservée */ },
    });
  }

  resoudre(id: number): void {
    this.changerStatut(id, 'RESOLU', 'Litige résolu.');
  }

  fermer(id: number): void {
    this.changerStatut(id, 'FERME', 'Litige fermé.');
  }

  private changerStatut(id: number, statut: StatutLitige, message: string): void {
    // Optimiste : l'UI réagit tout de suite, on annule si le serveur refuse.
    const precedent = this.litiges();
    this.litiges.update(l => l.map(x => x.id === id ? { ...x, statut } : x));
    this.adminSvc.changerStatutLitige(id, statut).subscribe({
      next: () => this.notif.success(message),
      error: () => {
        this.litiges.set(precedent);
        this.notif.error('Erreur lors de la mise à jour du litige.');
      },
    });
  }

  badgeClass(s: string): string {
    const m: Record<string, string> = {
      'OUVERT': 'bg-red-100 text-red-700',
      'EN_TRAITEMENT': 'bg-amber-100 text-amber-700',
      'RESOLU': 'bg-green-100 text-green-700',
      'FERME': 'bg-gray-100 text-gray-500'
    };
    return m[s] ?? 'bg-gray-100 text-gray-500';
  }
}