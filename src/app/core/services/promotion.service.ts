import { Injectable, signal } from '@angular/core';
import { Promotion } from '../models/promotion.model';

@Injectable({ providedIn: 'root' })
export class PromotionService {
  promotions = signal<Promotion[]>([
    {
      id: 1,
      restaurantId: 1,
      titre: '-20% sur tous les plats',
      description: 'Profitez de 20% de réduction sur l\'ensemble du menu cette semaine.',
      type: 'remise',
      valeurRemise: 20,
      codePromo: 'MAMAN20',
      dateDebut: '2026-07-28',
      dateFin: '2026-08-04',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
      actif: true,
      utilisationsMax: 100,
      utilisationsCount: 12,
      minimumCommande: 5000,
    },
    {
      id: 2,
      restaurantId: 1,
      titre: 'Livraison gratuite',
      description: 'Livraison offerte pour toute commande supérieure à 3000 FCFA.',
      type: 'livraison_gratuite',
      codePromo: 'LIVFREE',
      dateDebut: '2026-07-28',
      dateFin: '2026-08-15',
      actif: true,
      utilisationsCount: 45,
      minimumCommande: 3000,
    },
  ]);

  readonly promotionsActives = () =>
    this.promotions().filter(p => p.actif && new Date(p.dateFin) >= new Date());

  ajouterPromotion(promo: Promotion): void {
    this.promotions.update(list => [...list, { ...promo, id: Date.now() }]);
  }

  modifierPromotion(id: number, changes: Partial<Promotion>): void {
    this.promotions.update(list =>
      list.map(p => p.id === id ? { ...p, ...changes } : p)
    );
  }

  supprimerPromotion(id: number): void {
    this.promotions.update(list => list.filter(p => p.id !== id));
  }

  toggleActif(id: number): void {
    this.promotions.update(list =>
      list.map(p => p.id === id ? { ...p, actif: !p.actif } : p)
    );
  }

  // Récupère les promotions d'un restaurant spécifique
  getByRestaurant(restaurantId: number): Promotion[] {
    return this.promotions().filter(p => p.restaurantId === restaurantId);
  }
}