// Rôles
export type Role = 'CLIENT' | 'RESTAURANT' | 'LIVREUR' | 'ADMIN';
export type TypeAbonnement = 'GRATUIT' | 'STANDARD' | 'PREMIUM';

// CORRECTION #2 — livreur interne vs pool (cahier des charges section 3)
export type TypeLivreur = 'INTERNE_RESTAURANT' | 'POOL_PLATEFORME';
export type ModeLivraison = 'LIVREUR_INTERNE' | 'LIVREUR_PLATEFORME' | 'MIXTE';

// Statuts commande
export type StatutCommande =
  | 'EN_ATTENTE'
  | 'EN_ATTENTE_CONFIRMATION'
  | 'ACCEPTEE'
  | 'EN_PREPARATION'
  | 'PRETE'
  | 'PRISE_PAR_LIVREUR'
  | 'EN_LIVRAISON'
  | 'LIVREE'
  | 'ANNULEE';

export type ModePaiement = 'CASH' | 'ORANGE_MONEY' | 'MTN_MOMO';
export type StatutPaiement = 'EN_ATTENTE' | 'CONFIRME' | 'ECHEC';
export type StatutRemiseCash = 'REMIS' | 'NON_REMIS';

// Utilisateur — JWT en mémoire, JAMAIS en localStorage (cahier des charges section 6.1)
export interface User {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
   statut?: string;
  role: Role;
  actif: boolean;
  dateCreation: string;
  avatar?: string | null;
  typeLivreur?: string | null;           // ← AJOUTE
  restaurantProprietaireId?: number | null; // ← AJOUTE
}

// Restaurant avec mode de livraison
export interface Restaurant {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  adresse: string;
  quartier: string;
  ville: string;
  logoUrl: string;
  banniereUrl: string;
  telephone: string;
  numeroMoMo: string;
  note: number;
  totalAvis: number;
  tempsLivraisonMin: number;
  tempsLivraisonMax: number;
  fraisLivraison: number;
  ouvert: boolean;
  horaires?: HoraireOuverture[];
  abonnement: TypeAbonnement;
  certifie: boolean;
  tauxCommission: number;
  commissionDueTotal: number;
  soldeWallet: number;
  modeLivraison: ModeLivraison; // NOUVEAU
  actif: boolean;
}

export interface HoraireOuverture {
  jour: string;
  ouverture: string;
  fermeture: string;
  ferme: boolean;
}

export interface Plat {
  id: number;
  restaurantId: number;
  nom: string;
  description: string;
  prix: number;
  categorie: string;
  imageUrl: string;
  videoUrl?: string;
  tempsPreparation: number;
  disponible: boolean;
  populaire: boolean;
  likes: number;
}

// Adresse complète camerounaise (cahier des charges section 4.6)
export interface Adresse {
  id?: number;
  label?: string;
  latitude: number;
  longitude: number;
  pointDeRepere: string;
  photoMaison?: string; // NOUVEAU — photo de la maison/entrée
  quartier: string;
  ville: string;
  indications?: string;
}

export interface LigneCommande {
  platId: number;
  platNom: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

export interface Commande {
  id: number;
  clientId: number;
  restaurantId: number;
  livreurId?: number;
  lignes: LigneCommande[];
  adresseLivraison: Adresse;
  statut: StatutCommande;
  modePaiement: ModePaiement;
  statutPaiement: StatutPaiement;
  montantPlats: number;
  fraisLivraison: number;
  montantTotal: number;
  montantCommission: number;
  montantRestaurant: number;
  // Cash (cahier des charges section 4.9)
  montantCashCollecte?: number;
  statutRemiseCash?: StatutRemiseCash;
  dateCreation: string;
  dateMAJ: string;
}

// Livreur avec type interne/pool (cahier des charges section 3.2)
export interface Livreur extends User {
  typeLivreur: TypeLivreur;
  restaurantProprietaireId?: number; // si INTERNE_RESTAURANT
  montantCashDu: number;
  plafondCash: number;
  verifie: boolean;
}

export interface PanierItem { plat: Plat; quantite: number; sousTotal: number; }
export interface Panier { restaurantId: number; restaurantNom: string; items: PanierItem[]; total: number; }

export interface PositionGPS {
  latitude: number;
  longitude: number;
  adresse: string;
  quartier: string;
  ville: string;
}

// NOUVEAU — Litige/réclamation (cahier des charges section 4.11)
export interface Litige {
  id: number;
  commandeId: number;
  clientId: number;
  type: 'PLAT_MANQUANT' | 'ERREUR_COMMANDE' | 'RETARD' | 'PAIEMENT_FRAUDULEUX' | 'INCIDENT_LIVREUR';
  description: string;
  statut: 'OUVERT' | 'EN_TRAITEMENT' | 'RESOLU' | 'FERME';
  dateCreation: string;
}

// NOUVEAU — Notification
export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// NOUVEAU — Zone livraison avec frais (cahier des charges section 4.13)
export interface ZoneLivraison {
  distanceMinKm: number;
  distanceMaxKm: number;
  frais: number;
}

// Frais par défaut selon cahier des charges
export const ZONES_LIVRAISON_DEFAULT: ZoneLivraison[] = [
  { distanceMinKm: 0,  distanceMaxKm: 3,  frais: 1000 },
  { distanceMinKm: 3,  distanceMaxKm: 6,  frais: 1500 },
  { distanceMinKm: 6,  distanceMaxKm: 10, frais: 2500 },
];
// Moyen de transport du livreur
export type MoyenTransport = 'MOTO' | 'VOITURE' | 'VELO' | 'PIED';

// Statut disponibilité livreur
export type StatutLivreur = 'DISPONIBLE' | 'EN_COURSE' | 'HORS_LIGNE';