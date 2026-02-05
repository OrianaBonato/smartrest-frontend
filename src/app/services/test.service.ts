import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
// Servicio de prueba para verificar conexion con backend.
export class TestService {
  constructor(private http: HttpClient) {}

  // Ping simple al backend.
  ping(): Observable<string> {
    return this.http.get('/api/test', { responseType: 'text' });
  }
}
