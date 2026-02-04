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

@Component({
  selector: 'smartrest-sala-mesa-detalle',
  imports: [CommonModule, MatButtonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCardModule],
  standalone: true,
  templateUrl: './sala-mesa-detalle.component.html',
  styleUrl: './sala-mesa-detalle.component.scss',
})
export class SalaMesaDetalleComponent implements OnInit {
  mesa?: Mesa;
  idMesa?: number;
  productos?: Producto[] = [];
  servicioEstaAbierto: Boolean = false;
  servicioActual?: ServicioResponse;
  formAbrir: FormGroup;
  loading = false;

  constructor(
    private mesaService: MesaService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private productoService: ProductoService,
    private auth: AuthService,
    private servicioService: ServicioService,
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
          this.cdr.detectChanges();
        },
        error: (e) => console.error(e),
      });
    });
  }

  getMesa() {
    if (this.idMesa) {
      this.loading = true;
      this.mesaService.getMesa(this.idMesa).subscribe({
        next: (data: any) => {
          this.mesa = data;
          if (this.mesa?.estado === 'OCUPADA') {
            this.servicioEstaAbierto = true;
            this.servicioService.getServicioMesaByMesaId(this.idMesa!).subscribe({
              next: (s) => {
                this.servicioActual = s;
                this.cdr.detectChanges();
              },
              error: (e) => {
                this.servicioActual = undefined;
                this.servicioEstaAbierto = false;
                console.error('Error cargando servicio de mesa', e);
                this.cdr.detectChanges();
              },
            });
          } else {
            this.servicioActual = undefined;
            this.servicioEstaAbierto = false;
          }
          this.cdr.detectChanges();
          this.loading = true;
        },
        error: (err: any) => {
          this.loading = true;
          console.error('Error cargando mesas', err);
        },
      });
    }
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
          console.log('Servicio abierto:', s);
          this.servicioEstaAbierto = true;
          this.servicioActual = s;
          this.getMesa();
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
    this.servicioService.cerrarServicio(idServicio).subscribe({
      next: (s) => {
        console.log('Servicio cerrado:', s);
        this.servicioEstaAbierto = false;
        this.servicioActual = undefined;
        this.getMesa();
        this.cdr.detectChanges();
      },
      error: (e) => console.error(e),
    });
  }
}
