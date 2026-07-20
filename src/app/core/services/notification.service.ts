import { Injectable, signal } from '@angular/core';
import { AppNotification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _list = signal<AppNotification[]>([]);
  readonly list = this._list.asReadonly();

  show(message: string, type: AppNotification['type'] = 'info', duration = 3500): void {
    const id = Math.random().toString(36).slice(2);
    this._list.update(n => [...n, { id, type, message }]);
    setTimeout(() => this._list.update(n => n.filter(x => x.id !== id)), duration);
  }

  success(msg: string): void { this.show(msg, 'success'); }
  error(msg: string):   void { this.show(msg, 'error', 5000); }
  info(msg: string):    void { this.show(msg, 'info'); }
  warning(msg: string): void { this.show(msg, 'warning'); }
}
