import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  idUsuario: number;
  nombre: string;
  rol: string; // "SALA" | "COCINA" | "BARRA" | ...
}

const LS_KEY = 'smartrest_auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`/api/auth/login`, req).pipe(
      tap(res => {
        localStorage.setItem(LS_KEY, JSON.stringify(res));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(LS_KEY);
  }

  getAuth(): LoginResponse | null {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) as LoginResponse : null;
  }

  getRol(): string | null {
    return this.getAuth()?.rol ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getAuth();
  }
}