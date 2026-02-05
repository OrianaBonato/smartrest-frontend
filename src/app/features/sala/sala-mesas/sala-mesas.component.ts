import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Mesa, MesaService } from '../../../services/mesa.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'smartrest-sala-mesas',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './sala-mesas.component.html',
  styleUrl: './sala-mesas.component.scss',
})
export class SalaMesasComponent implements OnInit {
  // Listado de mesas para el panel principal de sala
  mesas: Mesa[] = [];

  constructor(
    private mesaService: MesaService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  // Carga inicial de mesas al entrar en la vista
  ngOnInit(): void {
    this.mesaService.getMesas().subscribe({
      next: (data) => {
        this.mesas = data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error cargando mesas', err),
    });
  }

  // Navega al detalle de la mesa seleccionada
  mesaOnClick(mesa: Mesa) {
    this.router.navigate(['/sala/mesa/', mesa.idMesa]);
  }
}
