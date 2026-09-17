import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService, LoginRequest } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
// Pantalla de login y validacion de credenciales.
export class LoginComponent implements OnInit, OnDestroy {
  form: FormGroup;
  error: string | null = null;

  // Animacion de entrada: dura lo mismo que la del diseno
  mostrarSplash = true;
  private readonly duracionSplash = 3600;
  private temporizador?: ReturnType<typeof setTimeout>;

  // Mostrar u ocultar la contrasena
  verPass = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    if (typeof window === 'undefined') return;
    // Quien pide menos animacion entra directo al formulario
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.mostrarSplash = false;
      return;
    }
    this.temporizador = setTimeout(() => {
      this.mostrarSplash = false;
      this.cdr.markForCheck();
    }, this.duracionSplash);
  }

  ngOnDestroy(): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
    }
  }

  // Tipo del input de contrasena segun el interruptor
  get tipoPassword(): string {
    return this.verPass ? 'text' : 'password';
  }

  alternarPassword(): void {
    this.verPass = !this.verPass;
  }

  // Envia credenciales y redirige segun rol.
  submit(): void {
    this.error = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Revisa el email y la contraseña';
      this.cdr.markForCheck();
      return;
    }

    const req: LoginRequest = {
      email: this.form.value.email,
      password: this.form.value.password,
    };

    this.auth.login(req).subscribe({
      next: (res) => {
        const rol = (res.rol || '').toUpperCase();
        this.router.navigateByUrl(this.homeByRol(rol));
      },
      error: (err) => {
        this.error = err?.error?.error ?? 'Login incorrecto';
        this.cdr.markForCheck();
      },
    });
  }

  // Devuelve la ruta segun el rol.
  homeByRol(rol: string): string {
    switch (rol) {
      case 'SALA':
        return '/sala';
      case 'COCINA':
        return '/cocina';
      case 'BARRA':
        return '/barra';
      case 'ADMIN':
        return '/admin';
      default:
        return '/login';
    }
  }
}
