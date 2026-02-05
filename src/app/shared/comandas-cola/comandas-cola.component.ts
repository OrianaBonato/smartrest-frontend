import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ComandaService, EstadoLinea, LineaComandaResponse } from '../../services/comanda.service';

@Component({
  selector: 'smartrest-comandas-cola',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, MatPaginatorModule],
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
  canceladas: LineaComandaResponse[] = [];
  listasCols: string[] = ['mesa', 'producto', 'cantidad', 'destino', 'fecha'];
  canceladasCols: string[] = ['mesa', 'producto', 'cantidad', 'destino', 'fecha'];
  listasDataSource = new MatTableDataSource<LineaComandaResponse>([]);
  canceladasDataSource = new MatTableDataSource<LineaComandaResponse>([]);
  readonly listasPageSize = 10;
  readonly canceladasPageSize = 10;
  cargando = false;
  private colaRequestId = 0;
  @ViewChild('listasPaginator')
  set listasPaginator(paginator: MatPaginator | undefined) {
    if (!paginator) return;
    this.listasDataSource.paginator = paginator;
    this.cdr.markForCheck();
  }
  @ViewChild('canceladasPaginator')
  set canceladasPaginator(paginator: MatPaginator | undefined) {
    if (!paginator) return;
    this.canceladasDataSource.paginator = paginator;
    this.cdr.markForCheck();
  }

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
    const requestId = ++this.colaRequestId;
    this.cargando = true;
    this.cdr.markForCheck();
    this.comandaService.colaByDestino(this.destino).subscribe({
      next: (res) => {
        if (requestId !== this.colaRequestId) return;
        this.lineas = res;
        this.pendientes = this.lineas.filter(
          (l) => l.estado === 'PENDIENTE' || l.estado === 'EN_PREPARACION',
        ).slice().sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? -1 : 1));
        this.listas = this.lineas
          .filter((l) => l.estado === 'LISTO')
          .slice()
          .sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? 1 : -1));
        this.canceladas = this.lineas
          .filter((l) => l.estado === 'CANCELADO')
          .slice()
          .sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? 1 : -1));
        this.listasDataSource.data = this.listas;
        this.canceladasDataSource.data = this.canceladas;
        if (this.listasDataSource.paginator) {
          this.listasDataSource.paginator.firstPage();
        }
        if (this.canceladasDataSource.paginator) {
          this.canceladasDataSource.paginator.firstPage();
        }
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (e) => {
        if (requestId !== this.colaRequestId) return;
        console.error('Error cargando cola', e);
        this.cargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Cambia el estado de una linea segun accion del operador
  cambiarEstado(linea: LineaComandaResponse, nuevoEstado: EstadoLinea) {
    this.comandaService.cambiarEstadoLinea(linea.idLinea, nuevoEstado).subscribe({
      next: (actualizada) => {
        this.cargarCola();
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
