import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User, Role } from '../models';
import { environment } from '../../../environments/environment';

// CORRECTION CRITIQUE #1 — JWT stocké EN MÉMOIRE uniquement
// Le cahier des charges interdit explicitement localStorage pour le token
// Seul l'user est persisté en sessionStorage (session navigateur uniquement)
const USER_KEY = 'eatscm_user_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  // Token EN MÉMOIRE — disparaît à la fermeture du navigateur
  private _token = signal<string | null>(null);

  // User en sessionStorage — persiste pendant la session mais pas entre onglets
  private _user  = signal<User | null>(this._loadUserFromSession());

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._token() || !!this._user());
  readonly role        = computed(() => this._user()?.role ?? null);

  // ── API réelle (à activer quand backend prêt) ─────────────
  login(email: string, motDePasse: string): Observable<{ token: string; user: User }> {
    return this.http
      .post<{ token: string; user: User }>(`${environment.apiUrl}/auth/login`, { email, motDePasse })
      .pipe(tap(res => this.saveSession(res.token, res.user)));
  }

  register(data: any): Observable<{ token: string; user: User }> {
    return this.http
      .post<{ token: string; user: User }>(`${environment.apiUrl}/auth/register`, data)
      .pipe(tap(res => this.saveSession(res.token, res.user)));
  }

  // ── Mock dev (sans backend) ───────────────────────────────
  loginMock(role: Role): void {
    const mockUsers: Record<Role, User> = {
      CLIENT:     { id:1, nom:'Kamga',   prenom:'Paul',   email:'client@test.cm',  telephone:'655000001', role:'CLIENT',     actif:true, dateCreation: new Date().toISOString() },
      RESTAURANT: { id:2, nom:'Bibiane', prenom:'Maman',  email:'resto@test.cm',   telephone:'655000002', role:'RESTAURANT', actif:true, dateCreation: new Date().toISOString() },
      LIVREUR:    { id:3, nom:'Tchoupo', prenom:'Eric',   email:'livreur@test.cm', telephone:'655000003', role:'LIVREUR',    actif:true, dateCreation: new Date().toISOString() },
      ADMIN:      { id:4, nom:'Admin',   prenom:'EatsCM', email:'admin@eatscm.cm', telephone:'655000004', role:'ADMIN',      actif:true, dateCreation: new Date().toISOString() },
    };
    this.saveSession(`mock_token_${role.toLowerCase()}`, mockUsers[role]);
  }

  loginMockEmail(email: string): void {
    const user: User = {
      id: Date.now(), nom: 'Utilisateur', prenom: email.split('@')[0],
      email, telephone: '655000000', role: 'CLIENT', actif: true,
      dateCreation: new Date().toISOString(),
    };
    this.saveSession('mock_token_client', user);
  }

  // ── Session ───────────────────────────────────────────────
  saveSession(token: string, user: User): void {
    // Token EN MÉMOIRE uniquement
    this._token.set(token);
    // User en sessionStorage (pas localStorage)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    sessionStorage.removeItem(USER_KEY);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null { return this._token(); }

  private _loadUserFromSession(): User | null {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) as User : null;
    } catch { return null; }
  }
}
