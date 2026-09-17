import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComandaService, EstadoLinea, LineaComandaResponse } from '../../services/comanda.service';

// Pestanas de la cola.
export type PestanaCola = 'pendientes' | 'listas' | 'canceladas';

// Linea preparada para pintar: evita calcular fechas y textos en la plantilla.
export interface LineaVista {
  linea: LineaComandaResponse;
  mesa: string;
  producto: string;
  cantidad: number;
  estado: EstadoLinea;
  enPreparacion: boolean;
  observaciones: string | null;
  hora: string;
  espera: string;
}

@Component({
  selector: 'smartrest-comandas-cola',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comandas-cola.component.html',
  styleUrl: './comandas-cola.component.scss',
})
// Cola de comandas para cocina o barra.
export class ComandasColaComponent implements OnInit, OnDestroy {
  // Destino de la cola: cocina o barra
  @Input({ required: true }) destino!: 'COCINA' | 'BARRA';

  // Titulo mostrado en el encabezado de la pantalla
  @Input() titulo = 'Cola';

  // Pestana visible y lineas ya preparadas para pintar
  pestana: PestanaCola = 'pendientes';
  pendientes: LineaVista[] = [];
  listas: LineaVista[] = [];
  canceladas: LineaVista[] = [];
  cargando = false;

  // Refresco automatico: cocina no puede depender de pulsar un boton
  private readonly intervaloRefresco = 12000;
  private temporizador?: ReturnType<typeof setInterval>;
  private colaRequestId = 0;

  constructor(
    private comandaService: ComandaService,
    private cdr: ChangeDetectorRef,
  ) {}

  // Carga inicial y arranque del refresco automatico
  ngOnInit(): void {
    this.cargarCola();
    this.temporizador = setInterval(() => this.cargarCola(), this.intervaloRefresco);
  }

  // Para el refresco al salir de la pantalla
  ngOnDestroy(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
    }
  }

  // Resumen bajo el titulo
  get resumen(): string {
    return `${this.pendientes.length} en cola · ${this.listas.length} listas para servir`;
  }

  // Cambia de pestana
  seleccionar(pestana: PestanaCola) {
    this.pestana = pestana;
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
        this.pendientes = res
          .filter((l) => l.estado === 'PENDIENTE' || l.estado === 'EN_PREPARACION')
          .sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? -1 : 1))
          .map((l) => this.aVista(l));
        this.listas = res
          .filter((l) => l.estado === 'LISTO')
          .sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? 1 : -1))
          .map((l) => this.aVista(l));
        this.canceladas = res
          .filter((l) => l.estado === 'CANCELADO')
          .sort((a, b) => (a.fechaCreacion < b.fechaCreacion ? 1 : -1))
          .map((l) => this.aVista(l));
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

  // Avanza la linea al siguiente estado del flujo
  avanzar(linea: LineaComandaResponse) {
    const siguiente = this.siguienteEstado(linea.estado);
    if (!siguiente) return;
    this.cambiarEstado(linea, siguiente);
  }

  // Marca como entregada una linea lista, que sale de la cola
  entregar(linea: LineaComandaResponse) {
    this.cambiarEstado(linea, 'ENTREGADO');
  }

  // Cambia el estado de una linea segun accion del operador
  cambiarEstado(linea: LineaComandaResponse, nuevoEstado: EstadoLinea) {
    this.comandaService.cambiarEstadoLinea(linea.idLinea, nuevoEstado).subscribe({
      next: () => this.cargarCola(),
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

  // Prepara una linea del backend para pintarla
  private aVista(l: LineaComandaResponse): LineaVista {
    return {
      linea: l,
      mesa: this.numeroMesa(l),
      producto: l.productoNombre || `Producto #${l.idProducto}`,
      cantidad: l.cantidad,
      estado: l.estado,
      enPreparacion: l.estado === 'EN_PREPARACION',
      observaciones: l.observaciones?.trim() || null,
      hora: this.formatearHora(l.fechaActualizacion || l.fechaCreacion),
      espera: this.calcularEspera(l.fechaCreacion),
    };
  }

  // Numero de mesa a dos digitos, como en el diseno
  private numeroMesa(l: LineaComandaResponse): string {
    const numero = l.numeroMesa ?? l.idMesa;
    return numero == null ? '--' : String(numero).padStart(2, '0');
  }

  // Hora corta de la linea
  private formatearHora(fecha: string): string {
    const momento = new Date(fecha);
    if (Number.isNaN(momento.getTime())) return '';
    return momento.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  // Tiempo que lleva la linea esperando en la cola
  private calcularEspera(fecha: string): string {
    const creada = new Date(fecha).getTime();
    if (Number.isNaN(creada)) return '';
    const minutos = Math.max(0, Math.floor((Date.now() - creada) / 60000));
    if (minutos < 60) return `${minutos} min en cola`;
    const horas = Math.floor(minutos / 60);
    return `${horas} h en cola`;
  }
}
