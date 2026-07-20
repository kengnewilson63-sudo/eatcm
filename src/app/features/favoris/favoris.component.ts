import{Component,ChangeDetectionStrategy}from'@angular/core';
import{CommonModule}from'@angular/common';
import{RouterLink}from'@angular/router';
@Component({selector:'app-favoris',imports:[CommonModule,RouterLink],changeDetection:ChangeDetectionStrategy.OnPush,
template:`<div class="page-enter max-w-lg mx-auto px-4 py-6"><h1 class="text-xl font-extrabold text-secondary mb-4">❤️ Mes favoris</h1><div class="text-center py-16"><p class="text-4xl mb-3">❤️</p><p class="font-bold text-secondary mb-2">Aucun favori pour l'instant</p><p class="text-sm text-muted mb-6">Appuie sur le cœur d'un restaurant pour l'ajouter</p><a routerLink="/home" class="px-6 py-3 rounded-full text-white font-bold text-sm no-underline" style="background:#FF5A36">Explorer les restaurants</a></div></div>`})
export class FavorisComponent{}
