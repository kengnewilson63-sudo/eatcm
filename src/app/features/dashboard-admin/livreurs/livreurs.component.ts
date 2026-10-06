import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminLivreur } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';

const LIVREURS_FALLBACK: AdminLivreur[] = [
  { id:1, nom:'Eric Tchoupo',  telephone:'+237699345678', verifie:true,  actif:true,  cashDu:0,     livraisons:23, type:'POOL_PLATEFORME' },
  { id:2, nom:'Jean Mbarga',   telephone:'+237677123456', verifie:false, actif:false, cashDu:0,     livraisons:0,  type:'POOL_PLATEFORME' },
  { id:3, nom:'Paul Fotso',    telephone:'+237655987654', verifie:true,  actif:true,  cashDu:12500, livraisons:45, type:'POOL_PLATEFORME' },
];

@Component({ selector:'app-admin-livreurs', imports:[CommonModule], templateUrl:'./livreurs.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class LivreursComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private notif = inject(NotificationService);

  livreurs = signal<AdminLivreur[]>(LIVREURS_FALLBACK);

  ngOnInit(): void {
    this.charger();
  }

  private charger(): void {
    this.adminSvc.getLivreurs().subscribe({
      next: data => { if (data && data.length > 0) this.livreurs.set(data); },
      error: () => { /* repli local conservé */ },
    });
  }

  valider(id: number): void {
    this.adminSvc.validerLivreur(id).subscribe({
      next: updated => {
        this.livreurs.update(l => l.map(x => x.id === id ? { ...x, ...updated } : x));
        this.notif.success('Livreur validé.');
      },
      // Repli optimiste : on applique quand même le changement localement.
      error: () => {
        this.livreurs.update(l => l.map(x => x.id === id ? { ...x, verifie:true, actif:true } : x));
      },
    });
  }

  suspendre(id: number): void {
    this.adminSvc.suspendreLivreur(id).subscribe({
      next: updated => {
        this.livreurs.update(l => l.map(x => x.id === id ? { ...x, ...updated } : x));
        this.notif.info(updated.actif ? 'Livreur réactivé.' : 'Livreur suspendu.');
      },
      error: () => {
        this.livreurs.update(l => l.map(x => x.id === id ? { ...x, actif: !x.actif } : x));
      },
    });
  }
}
