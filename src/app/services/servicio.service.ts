import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ServicioResponse {
  idServicio: number;
  estado: 'ABIERTO' | 'CERRADO';
  idMesa: number;
  numeroMesa: number;
  numeroComensales: number;
  observaciones?: string;
  fechaInicio: string;
  fechaFin?: string | null;
}

export interface AbrirServicioRequest {
  idMesa: number;
  idUsuarioApertura: number;
  numeroComensales: number;
  observaciones?: string;
}

export interface CerrarServicioRequest {
  idServicio: number;
}

@Injectable({ providedIn: 'root' })
export class ServicioService {
  constructor(private http: HttpClient) {}

  abrirServicio(req: AbrirServicioRequest): Observable<ServicioResponse> {
    return this.http.post<ServicioResponse>('/api/servicios/abrir', req);
  }

  cerrarServicio(idServicio: number): Observable<ServicioResponse> {
    const req: CerrarServicioRequest = { idServicio };
    return this.http.post<ServicioResponse>('/api/servicios/cerrar', req);
  }
}