import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({ selector:'app-admin-livreurs', imports:[CommonModule], templateUrl:'./livreurs.component.html', changeDetection:ChangeDetectionStrategy.OnPush })
export class LivreursComponent {
  livreurs = signal([
    { id:1, nom:'Eric Tchoupo',  telephone:'+237699345678', verifie:true,  actif:true,  cashDu:0,     livraisons:23, type:'POOL_PLATEFORME' },
    { id:2, nom:'Jean Mbarga',   telephone:'+237677123456', verifie:false, actif:false, cashDu:0,     livraisons:0,  type:'POOL_PLATEFORME' },
    { id:3, nom:'Paul Fotso',    telephone:'+237655987654', verifie:true,  actif:true,  cashDu:12500, livraisons:45, type:'POOL_PLATEFORME' },
  ]);
  valider(id: number): void  { this.livreurs.update(l => l.map(x => x.id===id ? {...x, verifie:true, actif:true} : x)); }
  suspendre(id: number): void { this.livreurs.update(l => l.map(x => x.id===id ? {...x, actif:!x.actif} : x)); }
}
