import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Mesa, MesaService } from '../../../services/mesa.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'smartrest-sala-mesas',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './sala-mesas.component.html',
  styleUrl: './sala-mesas.component.scss',
})
export class SalaMesasComponent implements OnInit {
  mesas: Mesa[] = [];

  constructor(
    private mesaService: MesaService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.mesaService.getMesas().subscribe({
      next: (data) => {
        this.mesas = data;
        console.log('MESAS', this.mesas);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando mesas', err),
    });
  }

  mesaOnClick(mesa: Mesa) {
    console.log('Click mesa:', mesa);
    this.router.navigate(['/sala/mesa/', mesa.idMesa]);
  }
}
