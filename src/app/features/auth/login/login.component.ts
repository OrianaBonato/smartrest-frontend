import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { AuthService, LoginRequest } from '../../../core/auth/auth.service';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
})
// Pantalla de login y validacion de credenciales.
export class LoginComponent {
  form: FormGroup;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  // Envia credenciales y redirige segun rol.
  submit(): void {
    this.error = null;
    if (this.form.invalid) return;

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
