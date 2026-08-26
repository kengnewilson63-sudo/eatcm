export interface Promotion {
  id: number;
  restaurantId: number;
  titre: string;
  description: string;
  type: 'remise' | 'livraison_gratuite' | '1achete1offert' | 'menu_special';
  valeurRemise?: number;           // ex: 20 pour 20%
  codePromo: string;               // ex: "MAMAN20"
  dateDebut: string;               // ISO date
  dateFin: string;                 // ISO date
  imageUrl?: string;
  actif: boolean;
  utilisationsMax?: number;        // limite d'utilisations
  utilisationsCount: number;       // compteur actuel
  platsConcernes?: number[];      // IDs des plats concernés, vide = tous
  minimumCommande?: number;        // montant minimum pour activer
}