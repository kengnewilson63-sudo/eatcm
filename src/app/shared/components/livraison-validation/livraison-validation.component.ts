import { Component, ChangeDetectionStrategy, signal, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ValidationLivraison {
  commandeId: number;
  photoPreuve: string;
  qrScanne: boolean;
}

@Component({
  selector: 'app-livraison-validation',
  imports: [CommonModule],
  templateUrl: './livraison-validation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LivraisonValidationComponent implements OnInit {
  commandeId = input.required<number>();
  validated  = output<ValidationLivraison>();

  photoPreuve  = signal<string | null>(null);
  qrScanne     = signal(false);
  qrSimuleCode = signal('');
  etape        = signal<'photo' | 'qr' | 'done'>('photo');
  loading      = signal(false);

  ngOnInit(): void {
    this.qrSimuleCode.set(`EATSCM-${this.commandeId()}-${Date.now()}`);
  }

  onPhotoPreuve(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreuve.set(reader.result as string);
      this.etape.set('qr');
    };
    reader.readAsDataURL(file);
  }

  simulerScanQR(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.qrScanne.set(true);
      this.loading.set(false);
      this.etape.set('done');
    }, 1500);
  }

  validerLivraison(): void {
    if (!this.photoPreuve() || !this.qrScanne()) return;
    this.validated.emit({
      commandeId: this.commandeId(),
      photoPreuve: this.photoPreuve()!,
      qrScanne: true,
    });
  }
}