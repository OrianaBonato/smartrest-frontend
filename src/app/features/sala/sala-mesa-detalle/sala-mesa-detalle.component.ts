import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Mesa, MesaService } from '../../../services/mesa.service';
import { ActivatedRoute } from '@angular/router';
import { Producto, ProductoService } from '../../../services/producto.service';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth/auth.service';
import { ServicioService } from '../../../services/servicio.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'smartrest-sala-mesa-detalle',
  imports: [MatButtonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  standalone: true,
  templateUrl: './sala-mesa-detalle.component.html',
  styleUrl: './sala-mesa-detalle.component.scss',
})
export class SalaMesaDetalleComponent implements OnInit {
  mesa?: Mesa;
  idMesa?: number;
  productos?: Producto[] = [];
  servicioEstaAbierto: Boolean = false;
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
          this.getMesa();
          this.cdr.detectChanges();
        },
        error: (e) => console.error(e),
      });
  }

  cerrarServicio() {
    const idServicio = 5;
    this.servicioService.cerrarServicio(idServicio).subscribe({
      next: (s) => {
        console.log('Servicio cerrado:', s);
        this.servicioEstaAbierto = false;
        this.getMesa();
        this.cdr.detectChanges();
      },
      error: (e) => console.error(e),
    });
  }
}
