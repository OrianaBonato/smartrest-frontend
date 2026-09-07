import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicioResponse } from '../../../services/servicio.service';

// Formas de pago del panel de cuenta.
export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Bizum';

// Linea de la cuenta ya formateada.
export interface LineaCuenta {
  idLinea: number;
  producto: string;
  cantidad: number;
  detalle: string;
  subtotal: string;
}

@Component({
  selector: 'smartrest-sala-cuenta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sala-cuenta.component.html',
  styleUrl: './sala-cuenta.component.scss',
})
// Panel deslizable con el desglose, la division y la forma de pago.
export class SalaCuentaComponent {
  // Lineas que se cobran y total sin formatear
  @Input() lineas: LineaCuenta[] = [];
  @Input() total = 0;
  @Input() numeroMesa?: number;
  @Input() servicio?: ServicioResponse;

  @Output() cerrar = new EventEmitter<void>();
  @Output() cobrar = new EventEmitter<void>();

  // Division de la cuenta y forma de pago: estado propio del panel.
  // La division es una calculadora de ayuda y el metodo de pago no se
  // persiste todavia, porque el backend no tiene donde guardarlo.
  partes = 2;
  metodoPago: MetodoPago = 'Tarjeta';
  readonly metodosPago: MetodoPago[] = ['Efectivo', 'Tarjeta', 'Bizum'];

  private readonly euro = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  });

  // Arranca dividiendo entre los comensales del servicio
  @Input() set comensales(valor: number | undefined) {
    this.partes = Math.max(1, valor || 2);
  }

  get totalFormateado(): string {
    return this.euro.format(this.total);
  }

  get porParte(): string {
    return this.euro.format(this.total / Math.max(1, this.partes));
  }

  // Hora de apertura del servicio
  get horaInicio(): string {
    if (!this.servicio) return '';
    const inicio = new Date(this.servicio.fechaInicio);
    if (Number.isNaN(inicio.getTime())) return '';
    return inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  masPartes() {
    this.partes = Math.min(this.partes + 1, 12);
  }

  menosPartes() {
    this.partes = Math.max(this.partes - 1, 1);
  }

  seleccionarMetodo(metodo: MetodoPago) {
    this.metodoPago = metodo;
  }
}
