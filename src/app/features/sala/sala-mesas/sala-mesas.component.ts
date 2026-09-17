import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Mesa, MesaService } from '../../../services/mesa.service';
import { ServicioResponse, ServicioService } from '../../../services/servicio.service';
import { ComandaService, LineaComandaResponse } from '../../../services/comanda.service';

// Aviso de cocina que se pinta sobre la mesa.
export type TipoAviso = 'listo' | 'preparacion' | 'pendiente';

// Mesa preparada para pintar, con lo derivado del servicio y sus lineas.
export interface MesaVista {
  mesa: Mesa;
  numero: string;
  capacidad: number;
  comensales: number | null;
  tiempo: string;
  total: string;
  aviso: string;
  tipoAviso: TipoAviso;
  listo: boolean;
}

// Servicio abierto de una mesa junto a sus lineas.
interface DetalleMesa {
  idMesa: number;
  servicio: ServicioResponse;
  lineas: LineaComandaResponse[];
}

@Component({
  selector: 'smartrest-sala-mesas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sala-mesas.component.html',
  styleUrl: './sala-mesas.component.scss',
})
// Lista de mesas para el rol SALA, agrupada por estado.
export class SalaMesasComponent implements OnInit {
  // Mesas agrupadas segun esten en servicio o libres
  ocupadas: MesaVista[] = [];
  libres: MesaVista[] = [];
  cargando = false;

  private mesasRequestId = 0;
  private readonly euro = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  });

  constructor(
    private mesaService: MesaService,
    private servicioService: ServicioService,
    private comandaService: ComandaService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  // Carga inicial de mesas al entrar en la vista
  ngOnInit(): void {
    this.cargarMesas();
  }

  // Resumen bajo el titulo
  get resumen(): string {
    const avisos = this.ocupadas.filter((m) => m.listo).length;
    return `${this.ocupadas.length} en servicio · ${this.libres.length} libres · ${avisos} avisos de cocina`;
  }

  // Refresca mesas y, por cada una ocupada, su servicio y sus lineas
  cargarMesas() {
    const requestId = ++this.mesasRequestId;
    this.cargando = true;
    this.cdr.markForCheck();
    this.mesaService
      .getMesas()
      .pipe(
        switchMap((mesas) => {
          const ocupadas = mesas.filter((m) => m.estado === 'OCUPADA');
          if (!ocupadas.length) {
            return of({ mesas, detalles: [] as (DetalleMesa | null)[] });
          }
          return forkJoin(ocupadas.map((m) => this.detalleDeMesa(m))).pipe(
            map((detalles) => ({ mesas, detalles })),
          );
        }),
      )
      .subscribe({
        next: ({ mesas, detalles }) => {
          if (requestId !== this.mesasRequestId) return;
          const porMesa = new Map<number, DetalleMesa>();
          for (const d of detalles) {
            if (d) porMesa.set(d.idMesa, d);
          }
          this.ocupadas = mesas
            .filter((m) => m.estado === 'OCUPADA')
            .map((m) => this.aVistaOcupada(m, porMesa.get(m.idMesa)));
          this.libres = mesas.filter((m) => m.estado !== 'OCUPADA').map((m) => this.aVistaLibre(m));
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          if (requestId !== this.mesasRequestId) return;
          console.error('Error cargando mesas', err);
          this.cargando = false;
          this.cdr.markForCheck();
        },
      });
  }

  // Navega al detalle de la mesa seleccionada
  mesaOnClick(mesa: Mesa) {
    this.router.navigate(['/sala/mesa/', mesa.idMesa]);
  }

  // Servicio abierto de una mesa con sus lineas. Null si algo falla,
  // para que una mesa rota no tumbe el listado entero.
  private detalleDeMesa(mesa: Mesa): Observable<DetalleMesa | null> {
    return this.servicioService.getServicioMesaByMesaId(mesa.idMesa).pipe(
      switchMap((servicio) =>
        this.comandaService.lineasByServicioId(servicio.idServicio).pipe(
          map((lineas) => ({ idMesa: mesa.idMesa, servicio, lineas })),
          catchError(() => of({ idMesa: mesa.idMesa, servicio, lineas: [] })),
        ),
      ),
      catchError(() => of(null)),
    );
  }

  // Mesa en servicio: comensales, tiempo abierto, total y aviso de cocina
  private aVistaOcupada(mesa: Mesa, detalle?: DetalleMesa): MesaVista {
    const lineas = detalle?.lineas ?? [];
    const aviso = this.avisoDe(lineas);
    return {
      mesa,
      numero: this.formatearNumero(mesa.numero),
      capacidad: mesa.capacidad,
      comensales: detalle?.servicio.numeroComensales ?? null,
      tiempo: detalle ? this.tiempoDesde(detalle.servicio.fechaInicio) : '',
      total: this.euro.format(this.totalDe(lineas)),
      aviso: aviso.texto,
      tipoAviso: aviso.tipo,
      listo: aviso.tipo === 'listo',
    };
  }

  // Mesa libre: solo numero y capacidad
  private aVistaLibre(mesa: Mesa): MesaVista {
    return {
      mesa,
      numero: this.formatearNumero(mesa.numero),
      capacidad: mesa.capacidad,
      comensales: null,
      tiempo: '',
      total: '',
      aviso: '',
      tipoAviso: 'pendiente',
      listo: false,
    };
  }

  // Que esta esperando la mesa ahora mismo
  private avisoDe(lineas: LineaComandaResponse[]): { texto: string; tipo: TipoAviso } {
    if (lineas.some((l) => l.estado === 'LISTO')) {
      return { texto: 'Listo para servir', tipo: 'listo' };
    }
    const preparando = lineas.filter((l) => l.estado === 'EN_PREPARACION').length;
    if (preparando > 0) {
      return { texto: `${preparando} en preparación`, tipo: 'preparacion' };
    }
    const pendientes = lineas.filter((l) => l.estado === 'PENDIENTE').length;
    if (pendientes > 0) {
      return { texto: `${pendientes} pendiente${pendientes > 1 ? 's' : ''}`, tipo: 'pendiente' };
    }
    return { texto: 'Pendiente de cuenta', tipo: 'pendiente' };
  }

  // Total del servicio, sin contar lo cancelado
  private totalDe(lineas: LineaComandaResponse[]): number {
    return lineas
      .filter((l) => l.estado !== 'CANCELADO')
      .reduce((acc, l) => acc + Number(l.precioUnitario) * l.cantidad, 0);
  }

  // Tiempo que lleva abierto el servicio, en horas y minutos
  private tiempoDesde(inicio: string): string {
    const abierto = new Date(inicio).getTime();
    if (Number.isNaN(abierto)) return '';
    const minutos = Math.max(0, Math.floor((Date.now() - abierto) / 60000));
    const horas = Math.floor(minutos / 60);
    return `${String(horas).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
  }

  // Numero de mesa a dos digitos, como en el diseno
  private formatearNumero(numero: number): string {
    return String(numero).padStart(2, '0');
  }
}
