import{Component,ChangeDetectionStrategy,signal,inject}from'@angular/core';
import{RouterLink}from'@angular/router';
import{CommonModule}from'@angular/common';
import{AuthService}from'../../core/services/auth.service';
@Component({selector:'app-profil',imports:[CommonModule,RouterLink],templateUrl:'./profil.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class ProfilComponent{
  auth=inject(AuthService);
  readonly user=this.auth.currentUser;
  // Photo de profil (data URL)
  profilePic=signal<string|null>(this.user()?.avatar ?? null);

  // Propriétés pour statistiques
  totalCommandes=0;
  totalDepense=0;
  noteMoyenneClient=4.5;

  // Signaux pour UI state
  editSuccess=signal(false);
  onglet=signal<'profil'|'commandes'|'adresses'>('profil');
  editMode=signal(false);
  editLoading=signal(false);
  modalAdresse=signal(false);

  // Signaux pour édition profil
  editPrenom=signal('');
  editNom=signal('');
  editTel=signal('');

  // Signaux pour commandes et adresses
  commandes=signal<any[]>([]);
  adresses=signal<any[]>([]);
  nouvelleAdresse=signal({label:'',ville:'Douala',quartier:'',pointDeRepere:''});

  // Données de villes et quartiers
  villes=['Douala','Yaoundé','Buea','Limbe'];
  quartiers:{[key:string]:string[]}={
    'Douala':['Akwa','Bonamoussadi','Bonjongo','Logbessou','Makepe'],
    'Yaoundé':['Bastos','Montée','Melen','Guilmang','Essos'],
    'Buea':['Down Town','Up Town','Molyko'],
    'Limbe':['Down Beach','Up Beach','Botanic']
  };

  getRoleBadgeClass():string{const r=this.auth.role();if(r==='CLIENT')return'role-badge-client';if(r==='RESTAURANT')return'role-badge-restaurant';if(r==='LIVREUR')return'role-badge-livreur';return'role-badge-admin'}
  getRoleLabel():string{const r=this.auth.role();if(r==='CLIENT')return'🛒 Client';if(r==='RESTAURANT')return'🍽️ Restaurant';if(r==='LIVREUR')return'🛵 Livreur';return'⚙️ Admin'}
  getDashboardRoute():string{const r=this.auth.role();if(r==='RESTAURANT')return'/dashboard/restaurant';if(r==='LIVREUR')return'/dashboard/livreur';if(r==='ADMIN')return'/dashboard/admin';return'/profil'}
  getInitials():string{const u=this.user();if(!u)return'U';return`${u.prenom?.[0]??''}${u.nom?.[0]??''}`.toUpperCase()}

  formatDate(date:any):string{if(!date)return'—';try{return new Date(date).toLocaleDateString('fr-FR');}catch{return'—'}}

  ouvrirEdition():void{
    const u=this.user();
    if(u){
      this.editPrenom.set(u.prenom||'');
      this.editNom.set(u.nom||'');
      this.editTel.set(u.telephone||'');
      this.editMode.set(true);
    }
  }

  onFileSelected(e:Event):void{
    const f=(e.target as HTMLInputElement).files?.[0];
    if(!f)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{this.profilePic.set(ev.target?.result as string || null)};
    reader.readAsDataURL(f);
  }

  removePhoto():void{this.profilePic.set(null);}

  onField(field:string,e:Event):void{
    const val=(e.target as HTMLInputElement).value;
    if(field==='editPrenom')this.editPrenom.set(val);
    else if(field==='editNom')this.editNom.set(val);
    else if(field==='editTel')this.editTel.set(val);
    else if(field==='label')this.nouvelleAdresse.update(a=>({...a,label:val}));
    else if(field==='ville')this.nouvelleAdresse.update(a=>({...a,ville:val}));
    else if(field==='quartier')this.nouvelleAdresse.update(a=>({...a,quartier:val}));
    else if(field==='pointDeRepere')this.nouvelleAdresse.update(a=>({...a,pointDeRepere:val}));
  }

  sauvegarderProfil():void{
    this.editLoading.set(true);
    setTimeout(()=>{
      // Persist mock update to session via AuthService
      const token=this.auth.getToken();
      const u=this.user();
      if(u){
        const updated={...u,prenom:this.editPrenom(),nom:this.editNom(),telephone:this.editTel(),avatar:this.profilePic() ?? undefined};
        this.auth.saveSession(token||'',updated);
      }
      this.editLoading.set(false);
      this.editMode.set(false);
      this.editSuccess.set(true);
      setTimeout(()=>this.editSuccess.set(false),3000);
    },1000);
  }

  setPrincipale(adresseId:number):void{
    console.log('Set principale:',adresseId);
  }

  supprimerAdresse(adresseId:number):void{
    console.log('Supprimer adresse:',adresseId);
    this.adresses.update(a=>a.filter(x=>x.id!==adresseId));
  }

  ajouterAdresse():void{
    const newAddr=this.nouvelleAdresse();
    if(newAddr.label&&newAddr.quartier){
      const addr={id:Date.now(),label:newAddr.label,ville:newAddr.ville,quartier:newAddr.quartier,pointDeRepere:newAddr.pointDeRepere,principale:false};
      this.adresses.update(a=>[...a,addr]);
      this.nouvelleAdresse.set({label:'',ville:'Douala',quartier:'',pointDeRepere:''});
      this.modalAdresse.set(false);
    }
  }

  logout():void{this.auth.logout()}
}
