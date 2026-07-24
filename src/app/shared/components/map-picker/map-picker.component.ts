import {
  Component, ChangeDetectionStrategy, inject,
  output, OnInit, OnDestroy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapsService, PositionGPS } from '../../../core/services/maps.service';

@Component({
  selector: 'app-map-picker',
  imports: [CommonModule],
  templateUrl: './map-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPickerComponent implements OnInit, OnDestroy {
  private maps = inject(MapsService);

  readonly position    = this.maps.positionSelectionnee;
  readonly chargement  = this.maps.chargement;
  readonly erreur      = this.maps.erreur;
  readonly carteChargee = this.maps.carteChargee;
  readonly gpsAutorise  = this.maps.gpsAutorise;

  afficherInstructions = signal(false);

  positionChoisie = output<PositionGPS>();

  ngOnInit(): void {
    setTimeout(() => this.maps.initMap('eatscm-map'), 200);
  }

  async utiliserMaPosition(): Promise<void> {
    await this.maps.maPosition();
    const pos = this.position();
    if (pos) this.positionChoisie.emit(pos);
  }

  confirmerPosition(): void {
    const pos = this.position();
    if (pos) this.positionChoisie.emit(pos);
  }

  getMessageErreur(): string {
    return this.maps.getMessageErreur();
  }

  getInstructions(): string {
    return this.maps.getInstructionsGPS();
  }

  ngOnDestroy(): void {
    this.maps.detruireMap();
  }
}