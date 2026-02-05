import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Mesa, MesaService } from '../../../services/mesa.service';
import { ActivatedRoute } from '@angular/router';
import { Producto, ProductoService } from '../../../services/producto.service';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth/auth.service';
import { ServicioResponse, ServicioService } from '../../../services/servicio.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ComandaService, LineaComandaResponse } from '../../../services/comanda.service';
import { catchError, finalize, forkJoin, of } from 'rxjs';

@Component({
  selector: 'smartrest-sala-mesa-detalle',
  imports: [
    CommonModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    RouterLink,
  ],
  standalone: true,
  templateUrl: './sala-mesa-detalle.component.html',
  styleUrl: './sala-mesa-detalle.component.scss',
})
export class SalaMesaDetalleComponent implements OnInit {
  // Vista de detalle de mesa para sala.
  // Datos base de mesa/servicio para el panel de comandaje
  mesa?: Mesa;
  idMesa?: number;
  productos?: Producto[] = [];
  servicioEstaAbierto: Boolean = false;
  servicioActual?: ServicioResponse;

  // Estado del flujo de pedido: carrito, pendientes y lineas para cuenta
  carrito: { producto: Producto; cantidad: number }[] = [];
  pendientes: LineaComandaResponse[] = [];
  lineasServicio: LineaComandaResponse[] = [];

  // Formulario de apertura y estados de carga
  formAbrir: FormGroup;
  loading = false;
  enviandoComandas = false;

  constructor(
    private mesaService: MesaService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private productoService: ProductoService,
    private auth: AuthService,
    private servicioService: ServicioService,
    private comandaService: ComandaService,
    private fb: FormBuilder,
  ) {
    this.formAbrir = this.fb.group({
      numeroComensales: [undefined, [Validators.required, Validators.min(1)]],
      observaciones: [''],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.idMesa = parseInt(params.get('id')!);
      this.getMesa();
      this.productoService.listar().subscribe({
        next: (productosRes) => {
          this.productos = productosRes;
          this.cdr.markForCheck();
        },
        error: (e) => console.error(e),
      });
    });
  }

  getMesa() {
    if (!this.idMesa) return;
    const mesaId = this.idMesa;
    this.loading = true;
    this.cdr.markForCheck();
    this.mesaService.getMesa(mesaId).subscribe({
      next: (data: any) => {
        if (this.idMesa !== mesaId) return;
        this.mesa = data;
        this.cdr.markForCheck();
        if (this.mesa?.estado === 'OCUPADA') {
          this.servicioEstaAbierto = true;
          this.servicioService.getServicioMesaByMesaId(mesaId).subscribe({
            next: (s) => {
              if (this.idMesa !== mesaId) return;
              this.servicioActual = s;
              this.cargarPendientes();
              this.cargarLineas();
              this.loading = false;
              this.cdr.markForCheck();
            },
            error: (e) => {
              if (this.idMesa !== mesaId) return;
              this.servicioActual = undefined;
              this.servicioEstaAbierto = false;
              this.pendientes = [];
              this.lineasServicio = [];
              this.loading = false;
              console.error('Error cargando servicio de mesa', e);
              this.cdr.markForCheck();
            },
          });
        } else {
          this.servicioActual = undefined;
          this.servicioEstaAbierto = false;
          this.pendientes = [];
          this.lineasServicio = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: (err: any) => {
        if (this.idMesa !== mesaId) return;
        this.loading = false;
        console.error('Error cargando mesas', err);
        this.cdr.markForCheck();
      },
    });
  }

  abrirServicio() {
    const user = this.auth.getAuth();
    const mesaID = this.idMesa!;
    const { numeroComensales, observaciones } = this.formAbrir.value;
    this.servicioService
      .abrirServicio({
        idMesa: mesaID,
        idUsuarioApertura: user.idUsuario,
        numeroComensales: numeroComensales,
        observaciones: observaciones,
      })
      .subscribe({
        next: (s) => {
          this.servicioEstaAbierto = true;
          this.servicioActual = s;
          this.cargarPendientes();
          this.cargarLineas();
          this.getMesa();
          this.cdr.markForCheck();
        },
        error: (e) => console.error(e),
      });
  }

  cerrarServicio() {
    const idServicio = this.servicioActual?.idServicio;
    if (!idServicio) {
      console.error('No hay servicio abierto para cerrar');
      return;
    }
    const confirmado = window.confirm('El servicio esta pagado? Se cerrara la mesa.');
    if (!confirmado) return;
    this.servicioService.cerrarServicio(idServicio).subscribe({
      next: (s) => {
        this.servicioEstaAbierto = false;
        this.servicioActual = undefined;
        this.pendientes = [];
        this.lineasServicio = [];
        this.getMesa();
        this.cdr.markForCheck();
      },
      error: (e) => console.error(e),
    });
  }

  agregarAlCarrito(producto: Producto) {
    const item = this.carrito.find((i) => i.producto.idProducto === producto.idProducto);
    if (item) {
      item.cantidad += 1;
    } else {
      this.carrito.push({ producto, cantidad: 1 });
    }
  }

  quitarDelCarrito(producto: Producto) {
    const item = this.carrito.find((i) => i.producto.idProducto === producto.idProducto);
    if (!item) return;
    item.cantidad -= 1;
    if (item.cantidad <= 0) {
      this.carrito = this.carrito.filter((i) => i.producto.idProducto !== producto.idProducto);
    }
  }

  actualizarCantidad(producto: Producto, valor: string) {
    const cantidad = Number(valor);
    if (!Number.isFinite(cantidad)) return;
    const item = this.carrito.find((i) => i.producto.idProducto === producto.idProducto);
    if (!item) return;
    if (cantidad <= 0) {
      this.carrito = this.carrito.filter((i) => i.producto.idProducto !== producto.idProducto);
      return;
    }
    item.cantidad = Math.floor(cantidad);
  }

  enviarComandas() {
    if (!this.servicioActual) {
      console.warn('No hay servicioActual para enviar comandas');
      return;
    }
    if (this.carrito.length === 0) {
      console.warn('Carrito vacio, no se enviaran comandas');
      return;
    }
    if (this.enviandoComandas) return;
    const user = this.auth.getAuth();
    if (!user?.idUsuario) {
      console.warn('No hay usuario autenticado para crear comandas');
      return;
    }
    const carritoSnapshot = [...this.carrito];
    if (carritoSnapshot.length === 0) return;
    const reqs = carritoSnapshot.map((item) =>
      this.comandaService.crearLinea({
        idServicio: this.servicioActual!.idServicio,
        idProducto: item.producto.idProducto,
        cantidad: item.cantidad,
        observaciones: '',
        idUsuarioCreador: user.idUsuario,
      }),
    );
    this.enviandoComandas = true;
    this.cdr.markForCheck();
    const requests = reqs.map((req$) =>
      req$.pipe(
        catchError((e) => {
          console.error('Error enviando comanda', e);
          return of(null);
        }),
      ),
    );
    forkJoin(requests)
      .pipe(
        finalize(() => {
          this.enviandoComandas = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe((resultados) => {
        const fallidos = resultados
          .map((res, idx) => (res ? null : carritoSnapshot[idx]))
          .filter(
            (item): item is { producto: Producto; cantidad: number } => item !== null,
          );
        this.carrito = fallidos;
        this.cargarPendientes();
        this.cargarLineas();
        this.cdr.markForCheck();
      });
  }

  totalItems(): number {
    return this.carrito.reduce((acc, item) => acc + item.cantidad, 0);
  }

  // Pendientes visibles para sala (PENDIENTE/EN_PREPARACION)
  cargarPendientes() {
    const idServicio = this.servicioActual?.idServicio;
    if (!idServicio) {
      this.pendientes = [];
      this.cdr.markForCheck();
      return;
    }
    this.comandaService.pendientesByServicioId(idServicio).subscribe({
      next: (res) => {
        if (this.servicioActual?.idServicio !== idServicio) return;
        this.pendientes = res;
        this.cdr.markForCheck();
      },
      error: (e) => {
        if (this.servicioActual?.idServicio !== idServicio) return;
        console.error('Error cargando pendientes', e);
        this.cdr.markForCheck();
      },
    });
  }

  // Lineas completas para el desglose de cuenta
  cargarLineas() {
    const idServicio = this.servicioActual?.idServicio;
    if (!idServicio) {
      this.lineasServicio = [];
      this.cdr.markForCheck();
      return;
    }
    this.comandaService.lineasByServicioId(idServicio).subscribe({
      next: (res) => {
        if (this.servicioActual?.idServicio !== idServicio) return;
        this.lineasServicio = res;
        this.cdr.markForCheck();
      },
      error: (e) => {
        if (this.servicioActual?.idServicio !== idServicio) return;
        console.error('Error cargando lineas', e);
        this.cdr.markForCheck();
      },
    });
  }

  // Total calculado en cliente para MVP
  totalCuenta(): number {
    return this.lineasServicio.reduce((acc, l) => acc + Number(l.precioUnitario) * l.cantidad, 0);
  }
}
