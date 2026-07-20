import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CommandeService } from '../../../core/services/commande.service';
import { Restaurant, Plat } from '../../../core/models';

@Component({
  selector: 'app-restaurant-detail',
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './restaurant-detail.component.html',
  styleUrl: './restaurant-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantDetailComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private cmdSvc = inject(CommandeService);

  readonly totalItems = this.cmdSvc.totalItems;
  readonly totalPrix  = this.cmdSvc.totalPrix;
  restaurant = signal<Restaurant | null>(null);
  plats      = signal<Plat[]>([]);
  loading    = signal(true);
  activeTab  = signal('Tous');

  categories   = computed(() => ['Tous', ...new Set(this.plats().map(p => p.categorie))]);
  platsFiltres = computed(() => {
    const t = this.activeTab();
    return t === 'Tous' ? this.plats() : this.plats().filter(p => p.categorie === t);
  });

  // ✅ FIX — données par restaurant selon l'ID dans l'URL
  private mockRestos: Record<number, Restaurant> = {
    1: {
      id: 1, nom: 'Chez Maman Bibiane',
      description: 'Le meilleur ndolé de Douala depuis 1998. Cuisine traditionnelle camerounaise préparée avec amour.',
      categorie: 'Cuisine camerounaise', adresse: 'Rue Joss, Akwa', quartier: 'Akwa', ville: 'Douala',
      logoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&q=80',
      banniereUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&q=85',
      telephone: '+237655123456', numeroMoMo: '655123456',
      note: 4.8, totalAvis: 312, tempsLivraisonMin: 20, tempsLivraisonMax: 35,
      fraisLivraison: 1000, ouvert: true, abonnement: 'PREMIUM', certifie: true,
      tauxCommission: 5, commissionDueTotal: 0, soldeWallet: 0,
      modeLivraison: 'LIVREUR_PLATEFORME', actif: true,
    },
    2: {
      id: 2, nom: 'Le Grill Akwa',
      description: 'Les meilleures brochettes de Douala, grillées au feu de bois depuis 2005.',
      categorie: 'Brochettes • Grillades', adresse: 'Boulevard de la Liberté, Akwa', quartier: 'Akwa', ville: 'Douala',
      logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&q=80',
      banniereUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=85',
      telephone: '+237677234567', numeroMoMo: '677234567',
      note: 4.7, totalAvis: 198, tempsLivraisonMin: 15, tempsLivraisonMax: 25,
      fraisLivraison: 1000, ouvert: true, abonnement: 'STANDARD', certifie: false,
      tauxCommission: 5, commissionDueTotal: 0, soldeWallet: 0,
      modeLivraison: 'LIVREUR_PLATEFORME', actif: true,
    },
    3: {
      id: 3, nom: 'Pizza Roma Douala',
      description: 'Pizzas artisanales avec des ingrédients frais, pâte faite maison chaque jour.',
      categorie: 'Pizza • Pâtes', adresse: 'Rue Ivy, Bonapriso', quartier: 'Bonapriso', ville: 'Douala',
      logoUrl: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=100&q=80',
      banniereUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=85',
      telephone: '+237699345678', numeroMoMo: '699345678',
      note: 4.6, totalAvis: 145, tempsLivraisonMin: 25, tempsLivraisonMax: 35,
      fraisLivraison: 1500, ouvert: true, abonnement: 'PREMIUM', certifie: true,
      tauxCommission: 5, commissionDueTotal: 0, soldeWallet: 0,
      modeLivraison: 'LIVREUR_PLATEFORME', actif: true,
    },
    4: {
      id: 4, nom: 'Sweet Burger',
      description: 'Burgers artisanaux avec des steaks frais et des sauces maison.',
      categorie: 'Burgers • Fast food', adresse: 'Carrefour Deido', quartier: 'Deido', ville: 'Douala',
      logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=80',
      banniereUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=85',
      telephone: '+237655987654', numeroMoMo: '655987654',
      note: 4.5, totalAvis: 87, tempsLivraisonMin: 20, tempsLivraisonMax: 30,
      fraisLivraison: 1200, ouvert: false, abonnement: 'GRATUIT', certifie: false,
      tauxCommission: 5, commissionDueTotal: 0, soldeWallet: 0,
      modeLivraison: 'LIVREUR_PLATEFORME', actif: true,
    },
    5: {
      id: 5, nom: 'Délices du Wouri',
      description: 'Poissons et fruits de mer frais du fleuve Wouri préparés à la camerounaise.',
      categorie: 'Poisson • Fruits de mer', adresse: 'Bord du Wouri, Bali', quartier: 'Bali', ville: 'Douala',
      logoUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=100&q=80',
      banniereUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=1200&q=85',
      telephone: '+237677111222', numeroMoMo: '677111222',
      note: 4.9, totalAvis: 421, tempsLivraisonMin: 30, tempsLivraisonMax: 45,
      fraisLivraison: 2000, ouvert: true, abonnement: 'PREMIUM', certifie: true,
      tauxCommission: 5, commissionDueTotal: 0, soldeWallet: 0,
      modeLivraison: 'LIVREUR_PLATEFORME', actif: true,
    },
    6: {
      id: 6, nom: 'Snack du Marché',
      description: 'Plats locaux rapides et abordables, fait maison chaque jour.',
      categorie: 'Plats locaux • Rapide', adresse: 'Marché Central, Douala', quartier: 'Akwa', ville: 'Douala',
      logoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&q=80',
      banniereUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=85',
      telephone: '+237699555666', numeroMoMo: '699555666',
      note: 4.3, totalAvis: 56, tempsLivraisonMin: 10, tempsLivraisonMax: 20,
      fraisLivraison: 800, ouvert: true, abonnement: 'GRATUIT', certifie: false,
      tauxCommission: 5, commissionDueTotal: 0, soldeWallet: 0,
      modeLivraison: 'LIVREUR_PLATEFORME', actif: true,
    },
  };

  private mockPlatsParResto: Record<number, Plat[]> = {
    1: [
      { id:1,  restaurantId:1, nom:'Ndolé au poisson fumé',    description:'Notre fameux ndolé avec du poisson fumé, accompagné de plantain mûr et de miondo.',    prix:3500, categorie:'Plats traditionnels', imageUrl:'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80', tempsPreparation:20, disponible:true,  populaire:true,  likes:245 },
      { id:2,  restaurantId:1, nom:'Eru et water fufu',         description:'Eru préparé selon la tradition du Sud-Ouest.',                                          prix:3000, categorie:'Plats traditionnels', imageUrl:'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80', tempsPreparation:25, disponible:true,  populaire:false, likes:178 },
      { id:3,  restaurantId:1, nom:'Poulet DG',                 description:'Poulet entier mijoté avec plantains dorés, poivrons et épices du chef.',                prix:5000, categorie:'Plats traditionnels', imageUrl:'https://images.unsplash.com/photo-1598103442097-8b74394b95c1?w=400&q=80', tempsPreparation:35, disponible:true,  populaire:true,  likes:198 },
      { id:4,  restaurantId:1, nom:'Jus de gingembre frais',    description:'Gingembre frais pressé avec citron et miel.',                                           prix:800,  categorie:'Boissons',            imageUrl:'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', tempsPreparation:5,  disponible:true,  populaire:false, likes:89  },
      { id:5,  restaurantId:1, nom:'Poisson braisé',            description:'Poisson frais braisé au charbon avec sauce tomate.',                                     prix:4000, categorie:'Grillades',           imageUrl:'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80', tempsPreparation:25, disponible:false, populaire:false, likes:134 },
    ],
    2: [
      { id:6,  restaurantId:2, nom:'Brochettes de bœuf',        description:'Brochettes marinées 24h aux épices locales, grillées au feu de bois.',                 prix:2500, categorie:'Grillades',           imageUrl:'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80', tempsPreparation:15, disponible:true,  populaire:true,  likes:312 },
      { id:7,  restaurantId:2, nom:'Poisson braisé entier',      description:'Poisson entier grillé au charbon de bois avec sauce pimentée.',                        prix:4500, categorie:'Grillades',           imageUrl:'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80', tempsPreparation:25, disponible:true,  populaire:false, likes:134 },
      { id:8,  restaurantId:2, nom:'Côtes de porc grillées',     description:'Côtes marinées à la sauce locale, grillées à la perfection.',                          prix:3500, categorie:'Grillades',           imageUrl:'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80', tempsPreparation:20, disponible:true,  populaire:false, likes:67  },
      { id:9,  restaurantId:2, nom:'Jus de bissap',              description:'Jus d\'hibiscus frais sucré.',                                                          prix:700,  categorie:'Boissons',            imageUrl:'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', tempsPreparation:5,  disponible:true,  populaire:false, likes:45  },
    ],
    3: [
      { id:10, restaurantId:3, nom:'Pizza Margherita',           description:'Tomate fraîche, mozzarella et basilic.',                                                prix:5000, categorie:'Pizzas',              imageUrl:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', tempsPreparation:20, disponible:true,  populaire:false, likes:145 },
      { id:11, restaurantId:3, nom:'Pizza 4 fromages',           description:'Mozzarella, gorgonzola, parmesan et emmental fondus.',                                  prix:6000, categorie:'Pizzas',              imageUrl:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', tempsPreparation:25, disponible:true,  populaire:true,  likes:321 },
      { id:12, restaurantId:3, nom:'Pizza Poulet BBQ',           description:'Poulet grillé, sauce BBQ, oignons caramélisés.',                                        prix:5500, categorie:'Pizzas',              imageUrl:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', tempsPreparation:25, disponible:true,  populaire:false, likes:198 },
      { id:13, restaurantId:3, nom:'Pâtes carbonara',            description:'Spaghetti, crème, parmesan, lardons.',                                                  prix:4500, categorie:'Pâtes',               imageUrl:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', tempsPreparation:15, disponible:true,  populaire:false, likes:98  },
    ],
    4: [
      { id:14, restaurantId:4, nom:'Classic Burger',             description:'Steak de bœuf, cheddar, salade, tomate, sauce maison.',                                prix:3500, categorie:'Burgers',             imageUrl:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', tempsPreparation:15, disponible:true,  populaire:true,  likes:210 },
      { id:15, restaurantId:4, nom:'Double Cheese Burger',       description:'Double steak, double cheddar, cornichons, oignons.',                                    prix:4500, categorie:'Burgers',             imageUrl:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', tempsPreparation:15, disponible:true,  populaire:false, likes:156 },
      { id:16, restaurantId:4, nom:'Frites maison',              description:'Frites croustillantes assaisonnées.',                                                   prix:1000, categorie:'Accompagnements',     imageUrl:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80', tempsPreparation:10, disponible:true,  populaire:false, likes:89  },
      { id:17, restaurantId:4, nom:'Coca-Cola',                  description:'Boisson fraîche.',                                                                       prix:500,  categorie:'Boissons',            imageUrl:'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', tempsPreparation:1,  disponible:true,  populaire:false, likes:34  },
    ],
    5: [
      { id:18, restaurantId:5, nom:'Poisson braisé entier',      description:'Poisson frais du Wouri, braisé au charbon.',                                            prix:6000, categorie:'Poissons',            imageUrl:'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80', tempsPreparation:30, disponible:true,  populaire:true,  likes:389 },
      { id:19, restaurantId:5, nom:'Crevettes sautées',           description:'Crevettes fraîches sautées à l\'ail et au beurre.',                                    prix:7000, categorie:'Fruits de mer',       imageUrl:'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400&q=80', tempsPreparation:20, disponible:true,  populaire:false, likes:234 },
      { id:20, restaurantId:5, nom:'Ndolé au poisson',            description:'Ndolé traditionnel avec poisson frais.',                                                prix:4500, categorie:'Plats traditionnels', imageUrl:'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80', tempsPreparation:25, disponible:true,  populaire:false, likes:178 },
    ],
    6: [
      { id:21, restaurantId:6, nom:'Riz sauté au poulet',        description:'Riz parfumé avec morceaux de poulet sautés.',                                           prix:1500, categorie:'Plats rapides',       imageUrl:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', tempsPreparation:10, disponible:true,  populaire:true,  likes:145 },
      { id:22, restaurantId:6, nom:'Haricots et plantain',        description:'Haricots mijotés avec plantain mûr.',                                                   prix:1200, categorie:'Plats rapides',       imageUrl:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', tempsPreparation:10, disponible:true,  populaire:false, likes:89  },
      { id:23, restaurantId:6, nom:'Beignets haricots',           description:'Beignets de haricots frits croustillants.',                                             prix:500,  categorie:'Snacks',              imageUrl:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', tempsPreparation:5,  disponible:true,  populaire:false, likes:67  },
    ],
  };

  ngOnInit(): void {
    // ✅ FIX PRINCIPAL — lit l'ID depuis l'URL et charge le bon restaurant
    const idParam = this.route.snapshot.paramMap.get('id');
    const id      = idParam ? parseInt(idParam, 10) : 1;

    setTimeout(() => {
      // Charge le bon restaurant — fallback sur resto 1 si ID inconnu
      const resto = this.mockRestos[id] ?? this.mockRestos[1];
      const plats = this.mockPlatsParResto[id] ?? this.mockPlatsParResto[1];

      this.restaurant.set(resto);
      this.plats.set(plats);
      this.loading.set(false);
    }, 300);
  }

  ajouterAuPanier(plat: Plat): void {
    if (!plat.disponible) return;
    this.cmdSvc.ajouterAuPanier(plat, this.restaurant()?.nom ?? '');
  }

  retirerDuPanier(id: number): void {
    this.cmdSvc.retirerDuPanier(id);
  }

  quantiteDansPanier(id: number): number {
    return this.cmdSvc.panier()?.items.find(i => i.plat.id === id)?.quantite ?? 0;
  }
}