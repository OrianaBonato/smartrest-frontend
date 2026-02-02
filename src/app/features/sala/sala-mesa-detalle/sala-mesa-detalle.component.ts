import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Mesa, MesaService } from '../../../services/mesa.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'smartrest-sala-mesa-detalle',
  imports: [],
  standalone: true,
  templateUrl: './sala-mesa-detalle.component.html',
  styleUrl: './sala-mesa-detalle.component.scss',
})
export class SalaMesaDetalleComponent implements OnInit {
  mesa?: Mesa;
  idMesa?: string | null;

  constructor(
    private mesaService: MesaService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.idMesa = params.get('id');
      if (this.idMesa) {
        this.mesaService.getMesa(this.idMesa).subscribe({
          next: (data: any) => {
            this.mesa = data;
            console.log('MESA', this.mesa);
            this.cdr.detectChanges();
          },
          error: (err: any) => console.error('Error cargando mesas', err),
        });
      }
    });
  }
}
