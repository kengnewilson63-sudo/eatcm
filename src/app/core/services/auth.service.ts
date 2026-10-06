import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User, Role } from '../models';
import { environment } from '../../../environments/environment';
import { NotificationPushService } from './notificationpush.service';

const USER_KEY = 'eatscm_user_session';
const TOKEN_KEY = 'eatscm_token';

interface BackendAuthResponse {
  token: string;
  type: string;
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  role: Role;
  statut: string; 
  typeLivreur: string | null;
  restaurantProprietaireId: number | null;
  avatar: string | null;
  dateCreation: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  // Résolu paresseusement (voir notifPush()) pour casser le cycle
  // AuthService → NotificationPushService → TrackingGateway → AuthService.
  private injector = inject(Injector);

  private get notifPush(): NotificationPushService {
    return this.injector.get(NotificationPushService);
  }

  private _token = signal<string | null>(sessionStorage.getItem(TOKEN_KEY));
  private _user  = signal<User | null>(this._loadUserFromSession());

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._token() || !!this._user());
  readonly role        = computed(() => this._user()?.role ?? null);

  login(email: string, motDePasse: string): Observable<{ token: string; user: User }> {
    return this.http
      .post<BackendAuthResponse>(`${environment.apiUrl}/auth/login`, {
        email: email.trim().toLowerCase(),
        motDePasse,
      })
      .pipe(
        map(res => this._mapBackendResponse(res)),
        tap(mapped => this.saveSession(mapped.token, mapped.user))
      );
  }

  register(data: any): Observable<{ token: string; user: User }> {
    const payload = {
      ...data,
      email: String(data?.email ?? '').trim().toLowerCase(),
    };
    return this.http
      .post<BackendAuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(map(res => this._mapBackendResponse(res)));
  }

  redirectAfterAuth(user: User): void {
    // Le backend renvoie EN_ATTENTE_VALIDATION (ancien nom : EN_ATTENTE) pour
    // les comptes RESTAURANT/LIVREUR créés mais pas encore validés par l'admin.
    const enAttente = user.statut === 'EN_ATTENTE_VALIDATION'
      || user.statut === 'EN_ATTENTE';
    if ((user.role === 'RESTAURANT' || user.role === 'LIVREUR') && enAttente) {
      this.router.navigate(['/auth/en-attente-validation']);
      return;
    }
    const dest: Record<Role, string> = {
      CLIENT: '/home',
      RESTAURANT: '/dashboard/restaurant',
      LIVREUR: '/dashboard/livreur',
      ADMIN: '/dashboard/admin',
    };
    this.router.navigate([dest[user.role] ?? '/home']);
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/forgot-password`,
      { email }
    );
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/reset-password`,
      { token, newPassword }
    );
  }

  loginMock(role: Role): void {
    const mockUsers: Record<Role, User> = {
      CLIENT:     { id:1, nom:'Kamga',   prenom:'Paul',   email:'client@test.cm',  telephone:'655000001', role:'CLIENT',     statut:'ACTIF', actif:true, dateCreation: new Date().toISOString() },
      RESTAURANT: { id:2, nom:'Bibiane', prenom:'Maman',  email:'resto@test.cm',   telephone:'655000002', role:'RESTAURANT', statut:'ACTIF', actif:true, dateCreation: new Date().toISOString() },
      LIVREUR:    { id:3, nom:'Tchoupo', prenom:'Eric',   email:'livreur@test.cm', telephone:'655000003', role:'LIVREUR',    statut:'ACTIF', actif:true, dateCreation: new Date().toISOString() },
      ADMIN:      { id:4, nom:'Admin',   prenom:'EatsCM', email:'admin@eatscm.cm', telephone:'655000004', role:'ADMIN',      statut:'ACTIF', actif:true, dateCreation: new Date().toISOString() },
    };
    this.saveSession(`mock_token_${role.toLowerCase()}`, mockUsers[role]);
  }

  loginMockEmail(email: string): void {
    const user: User = {
      id: Date.now(), nom: 'Utilisateur', prenom: email.split('@')[0],
      email, telephone: '655000000', role: 'CLIENT', statut: 'ACTIF', actif: true,
      dateCreation: new Date().toISOString(),
    };
    this.saveSession('mock_token_client', user);
  }

  saveSession(token: string, user: User): void {
    this._token.set(token);
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
    // Nouvelle session : on repart d'une liste vide puis on rebranche le flux.
    this.notifPush.arreter();
    this.notifPush.demarrer();
  }

  logout(): void {
    this.notifPush.arreter();
    this._token.set(null);
    this._user.set(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this._token() || sessionStorage.getItem(TOKEN_KEY);
  }

  private _loadUserFromSession(): User | null {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) as User : null;
    } catch { return null; }
  }

  private _mapBackendResponse(res: BackendAuthResponse): { token: string; user: User } {
    const user: User = {
      id: res.id,
      prenom: res.prenom,
      nom: res.nom,
      email: res.email,
      telephone: res.telephone,
      role: res.role,
      statut: res.statut ?? 'ACTIF',
      actif: true,
      dateCreation: res.dateCreation,
      avatar: res.avatar,
      typeLivreur: res.typeLivreur,
      restaurantProprietaireId: res.restaurantProprietaireId,
    };
    return { token: res.token, user };
  }
}