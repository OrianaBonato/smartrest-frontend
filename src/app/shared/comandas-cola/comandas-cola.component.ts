import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ComandaService, EstadoLinea, LineaComandaResponse } from '../../services/comanda.service';

@Component({
  selector: 'smartrest-comandas-cola',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule],
  templateUrl: './comandas-cola.component.html',
  styleUrl: './comandas-cola.component.scss',
})
export class ComandasColaComponent implements OnInit {
  // Destino de la cola: cocina o barra
  @Input({ required: true }) destino!: 'COCINA' | 'BARRA';

  // Titulo mostrado en el encabezado del panel
  @Input() titulo = 'Cola';

  // Lineas visibles en la cola y estado de carga
  lineas: LineaComandaResponse[] = [];
  pendientes: LineaComandaResponse[] = [];
  listas: LineaComandaResponse[] = [];
  listasCols: string[] = ['mesa', 'producto', 'cantidad', 'destino', 'fecha'];
  cargando = false;

  constructor(
    private comandaService: ComandaService,
    private cdr: ChangeDetectorRef,
  ) {}

  // Carga inicial de la cola
  ngOnInit(): void {
    this.cargarCola();
  }

  // Refresca la cola desde el backend
  cargarCola() {
    if (!this.destino) return;
    this.cargando = true;
    this.comandaService.colaByDestino(this.destino).subscribe({
      next: (res) => {
        this.lineas = res;
        this.pendientes = this.lineas.filter(
          (l) => l.estado === 'PENDIENTE' || l.estado === 'EN_PREPARACION',
        );
        this.listas = this.lineas
          .filter((l) => l.estado === 'LISTO')
          .slice()
          .sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? 1 : -1));
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Error cargando cola', e);
        this.cargando = false;
      },
    });
  }

  // Cambia el estado de una linea segun accion del operador
  cambiarEstado(linea: LineaComandaResponse, nuevoEstado: EstadoLinea) {
    this.comandaService.cambiarEstadoLinea(linea.idLinea, nuevoEstado).subscribe({
      next: (actualizada) => {
        if (actualizada.estado === 'CANCELADO' || actualizada.estado === 'ENTREGADO') {
          this.lineas = this.lineas.filter((l) => l.idLinea !== actualizada.idLinea);
        } else {
          const idx = this.lineas.findIndex((l) => l.idLinea === actualizada.idLinea);
          if (idx >= 0) this.lineas[idx] = actualizada;
        }
        this.cdr.detectChanges();
      },
      error: (e) => console.error('Error cambiando estado', e),
    });
  }

  // Confirmacion para cancelar linea
  cancelarLinea(linea: LineaComandaResponse) {
    const ok = window.confirm('Cancelar esta comanda?');
    if (!ok) return;
    this.cambiarEstado(linea, 'CANCELADO');
  }

  // Estado siguiente segun flujo simple de cocina/barra
  siguienteEstado(estado: EstadoLinea): EstadoLinea | null {
    if (estado === 'PENDIENTE') return 'EN_PREPARACION';
    if (estado === 'EN_PREPARACION') return 'LISTO';
    return null;
  }
}
