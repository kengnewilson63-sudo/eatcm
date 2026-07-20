import{Component,ChangeDetectionStrategy,inject,signal,computed}from'@angular/core';
import{RouterLink,Router}from'@angular/router';
import{CommonModule,DecimalPipe}from'@angular/common';
import{CommandeService}from'../../../core/services/commande.service';
@Component({selector:'app-panier',imports:[CommonModule,RouterLink,DecimalPipe],templateUrl:'./panier.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class PanierComponent{
  private cmdSvc=inject(CommandeService);private router=inject(Router);
  readonly panier=this.cmdSvc.panier;readonly totalItems=this.cmdSvc.totalItems;readonly totalPrix=this.cmdSvc.totalPrix;
  fraisLivraison=signal(1000);
  readonly totalFinal=computed(()=>this.totalPrix()+this.fraisLivraison());
  ajouter(id:number):void{const i=this.panier()?.items.find(x=>x.plat.id===id);if(i)this.cmdSvc.ajouterAuPanier(i.plat,this.panier()!.restaurantNom)}
  retirer(id:number):void{this.cmdSvc.retirerDuPanier(id)}
  vider():void{if(confirm('Vider le panier ?'))this.cmdSvc.viderPanier()}
  commander():void{this.router.navigate(['/checkout'])}
}
