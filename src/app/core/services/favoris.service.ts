import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FavorisService {
  private _ids = signal<number[]>(
    JSON.parse(sessionStorage.getItem('eatscm_favoris') ?? '[]')
  );
  readonly ids = this._ids.asReadonly();

  isFavori(id: number): boolean { return this._ids().includes(id); }

  toggle(id: number): void {
    this._ids.update(list => {
      const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
      sessionStorage.setItem('eatscm_favoris', JSON.stringify(next));
      return next;
    });
  }
}
