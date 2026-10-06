import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commande, MoyenTransport, StatutLivreur } from '../models';
import { environment } from '../../../environments/environment';

/**
 * Une course proposée au livreur — miroir de
 * backend cm.eatscm.backend.livreur.dto.CourseDisponible.
 */
export interface CourseDisponible {
  commande: Commande;
  /** Distance livreur → restaurant en km (null si position inconnue). */
  distanceKm: number | null;
  /** Vrai si le livreur est interne au restaurant de la commande. */
  interne: boolean;
}

/** GET /api/livreur/wallet — miroir de WalletResponse. */
export interface WalletResponse {
  gainsDuJour: number;
  gainsDuMois: number;
  gainsTotal: number;
  cashDu: number;
  plafondCash: number;
  plafondDepasse: boolean;
  coursesDuJour: number;
  coursesDuMois: number;
  coursesTotal: number;
  coursesEnCours: number;
  noteMoyenne: number;
}

/** Réponse de PATCH /api/livreur/statut et /transport. */
export interface MajProfilResponse {
  statut?: StatutLivreur;
  moyenTransport?: MoyenTransport;
  message: string;
}

/**
 * Appels HTTP vers les endpoints livreur du backend
 * (cm.eatscm.backend.livreur.LivreurController).
 */
@Injectable({ providedIn: 'root' })
export class LivreurService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // ===== COURSES DISPONIBLES =====

  /** Courses visibles par le livreur (rayon 10 km ou interne au restaurant). */
  getCoursesDisponibles(): Observable<CourseDisponible[]> {
    return this.http.get<CourseDisponible[]>(`${this.api}/livreurs/courses-disponibles`);
  }

  /** Course active (PRISE_PAR_LIVREUR / EN_LIVRAISON) du livreur connecté. */
  getCoursesEnCours(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.api}/livreur/courses/en-cours`);
  }

  /** Historique des livraisons du livreur connecté. */
  getHistorique(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.api}/livreur/courses/historique`);
  }

  // ===== ACCEPTER =====

  /**
   * Accepter une course (premier arrivé). Le backend répond une erreur
   * si la course a déjà été prise — le composant affiche « course déjà prise ».
   */
  accepterCourse(commandeId: number): Observable<Commande> {
    return this.http.post<Commande>(`${this.api}/courses/${commandeId}/accepter`, {});
  }

  // ===== STATUT COURSE =====

  /** Fait avancer la course : EN_LIVRAISON (récupérée) puis LIVREE. */
  changerStatutCourse(commandeId: number, statut: string): Observable<Commande> {
    return this.http.patch<Commande>(
      `${this.api}/courses/${commandeId}/statut`,
      { statut }
    );
  }

  // ===== PROFIL LIVREUR =====

  /** DISPONIBLE / EN_COURSE / HORS_LIGNE. */
  changerStatut(statut: StatutLivreur): Observable<MajProfilResponse> {
    return this.http.patch<MajProfilResponse>(
      `${this.api}/livreur/statut`,
      { statut }
    );
  }

  /** MOTO / VOITURE / VELO / PIED. */
  changerTransport(moyenTransport: MoyenTransport): Observable<MajProfilResponse> {
    return this.http.patch<MajProfilResponse>(
      `${this.api}/livreur/transport`,
      { moyenTransport }
    );
  }

  /** Repli REST de la position GPS quand le WebSocket est indisponible. */
  majPosition(latitude: number, longitude: number): Observable<unknown> {
    return this.http.post(`${this.api}/livreur/position`, { latitude, longitude });
  }

  // ===== WALLET =====

  getWallet(): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(`${this.api}/livreur/wallet`);
  }
}
