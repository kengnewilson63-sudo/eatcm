import { Component, ChangeDetectionStrategy, inject, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapsService } from '../../../core/services/maps.service';
import { PositionGPS } from '../../../core/models';

@Component({
  selector: 'app-map-picker',
  imports: [CommonModule],
  templateUrl: './map-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPickerComponent implements OnInit, OnDestroy {
  private maps = inject(MapsService);

  readonly position   = this.maps.positionSelectionnee;
  readonly chargement = this.maps.chargement;
  readonly erreur     = this.maps.erreur;

  positionChoisie = output<PositionGPS>();

  ngOnInit(): void { setTimeout(() => this.maps.initMap('eatscm-map'), 150); }

  async utiliserMaPosition(): Promise<void> {
    try {
      await this.maps.maPosition();
    } catch {
      // Le service applique déjà un fallback local si la géolocalisation échoue.
    }

    const pos = this.position();
    if (pos) this.positionChoisie.emit(pos);
  }

  confirmerPosition(): void {
    const pos = this.position();
    if (pos) this.positionChoisie.emit(pos);
  }

  ngOnDestroy(): void { this.maps.detruireMap(); }
}
