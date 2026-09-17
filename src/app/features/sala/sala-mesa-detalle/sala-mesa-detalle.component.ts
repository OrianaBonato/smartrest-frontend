import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { Mesa, MesaService } from '../../../services/mesa.service';
import { Producto, ProductoService } from '../../../services/producto.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ServicioResponse, ServicioService } from '../../../services/servicio.service';
import { ComandaService, LineaComandaResponse } from '../../../services/comanda.service';

import { LineaCuenta, SalaCuentaComponent } from '../sala-cuenta/sala-cuenta.component';

@Component({
  selector: 'smartrest-sala-mesa-detalle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SalaCuentaComponent],
  templateUrl: './sala-mesa-detalle.component.html',
  styleUrl: './sala-mesa-detalle.component.scss',
})
export class SalaMesaDetalleComponent implements OnInit {
  // Vista de detalle de mesa para sala.
  // Datos base de mesa/servicio para el panel de comandaje
  mesa?: Mesa;
  idMesa?: number;
  productos: Producto[] = [];
  servicioEstaAbierto = false;
  servicioActual?: ServicioResponse;

  // Estado del flujo de pedido: carrito, pendientes y lineas para cuenta
  carrito: { producto: Producto; cantidad: number }[] = [];
  pendientes: LineaComandaResponse[] = [];
  lineasServicio: LineaComandaResponse[] = [];

  // Formulario de apertura y estados de carga
  formAbrir: FormGroup;
  loading = false;
  enviandoComandas = false;

  // Apertura de mesa: opciones y atajos del diseno
  readonly opcionesComensales = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly atajos = ['Alergia al gluten', 'Trona para bebé', 'Cumpleaños', 'Mesa juntada'];

  // Comandero: categoria activa del catalogo
  categorias: string[] = [];
  categoriaActiva = '';

  // Panel de cuenta
  cuentaAbierta = false;

  private readonly euro = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  });

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
          this.productos = productosRes.filter((p) => p.activo !== false);
          this.categorias = [...new Set(this.productos.map((p) => this.categoriaDe(p)))];
          if (!this.categorias.includes(this.categoriaActiva)) {
            this.categoriaActiva = this.categorias[0] ?? '';
          }
          this.cdr.markForCheck();
        },
        error: (e) => console.error(e),
      });
    });
  }

  // --- Datos derivados para la plantilla ---

  // Numero de mesa a dos digitos, como en el diseno
  get numeroMesa(): string {
    return this.mesa ? String(this.mesa.numero).padStart(2, '0') : '--';
  }

  // Hora de apertura del servicio
  get horaInicio(): string {
    if (!this.servicioActual) return '';
    const inicio = new Date(this.servicioActual.fechaInicio);
    if (Number.isNaN(inicio.getTime())) return '';
    return inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  // Comensales elegidos en el formulario de apertura
  get comensalesElegidos(): number | null {
    return this.formAbrir.value.numeroComensales ?? null;
  }

  // Resumen del pie del formulario de apertura
  get resumenApertura(): string {
    const comensales = this.comensalesElegidos;
    if (!comensales) return 'Sin comensales seleccionados';
    const observaciones = (this.formAbrir.value.observaciones || '').trim();
    return `${comensales} comensales${observaciones ? ' · con observaciones' : ''}`;
  }

  // Productos de la categoria seleccionada
  get productosVisibles(): Producto[] {
    return this.productos.filter((p) => this.categoriaDe(p) === this.categoriaActiva);
  }

  // Lineas que se cobran: todo lo del servicio menos lo cancelado
  get cuentaLineas(): LineaCuenta[] {
    return this.lineasServicio
      .filter((l) => l.estado !== 'CANCELADO')
      .map((l) => ({
        idLinea: l.idLinea,
        producto: l.productoNombre || `Producto #${l.idProducto}`,
        cantidad: l.cantidad,
        detalle: `${l.cantidad} × ${this.euro.format(Number(l.precioUnitario))}`,
        subtotal: this.euro.format(Number(l.precioUnitario) * l.cantidad),
      }));
  }

  // Total de la cuenta ya formateado
  get totalFormateado(): string {
    return this.euro.format(this.totalCuenta());
  }

  // Unidades en el carrito
  get unidadesCarrito(): number {
    return this.totalItems();
  }

  // --- Apertura de mesa ---

  seleccionarComensales(numero: number) {
    this.formAbrir.patchValue({ numeroComensales: numero });
  }

  // Anade un atajo al final de las observaciones
  anadirAtajo(texto: string) {
    const actual = (this.formAbrir.value.observaciones || '').trim();
    this.formAbrir.patchValue({ observaciones: actual ? `${actual}. ${texto}` : texto });
  }

  // --- Comandero ---

  seleccionarCategoria(categoria: string) {
    this.categoriaActiva = categoria;
  }

  // --- Panel de cuenta ---

  abrirCuenta() {
    this.cuentaAbierta = true;
  }

  cerrarCuenta() {
    this.cuentaAbierta = false;
  }

  // --- Carga de datos ---

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
              this.limpiarServicio();
              this.loading = false;
              console.error('Error cargando servicio de mesa', e);
              this.cdr.markForCheck();
            },
          });
        } else {
          this.limpiarServicio();
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
    if (this.formAbrir.invalid) return;
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
      next: () => {
        this.cuentaAbierta = false;
        this.limpiarServicio();
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
        // Solo se quedan en el carrito las lineas que no se pudieron crear
        this.carrito = resultados
          .map((res, idx) => (res ? null : carritoSnapshot[idx]))
          .filter((item): item is { producto: Producto; cantidad: number } => item !== null);
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

  // Total calculado en cliente, sin contar lo cancelado
  totalCuenta(): number {
    return this.lineasServicio
      .filter((l) => l.estado !== 'CANCELADO')
      .reduce((acc, l) => acc + Number(l.precioUnitario) * l.cantidad, 0);
  }

  // Precio de un producto ya formateado
  precio(producto: Producto): string {
    return this.euro.format(Number(producto.precio));
  }

  // Deja la mesa sin servicio abierto
  private limpiarServicio() {
    this.servicioActual = undefined;
    this.servicioEstaAbierto = false;
    this.pendientes = [];
    this.lineasServicio = [];
    this.carrito = [];
  }

  // Categoria del producto, con cajon de sastre para los que no la traen
  private categoriaDe(producto: Producto): string {
    return producto.nombreCategoria?.trim() || 'Otros';
  }
}
