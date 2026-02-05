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
// Servicio para abrir, cerrar y consultar servicios de mesa.
export class ServicioService {
  constructor(private http: HttpClient) {}

  // Abre un servicio en una mesa.
  abrirServicio(req: AbrirServicioRequest): Observable<ServicioResponse> {
    return this.http.post<ServicioResponse>('/api/servicios/abrir', req);
  }

  // Cierra un servicio por id.
  cerrarServicio(idServicio: number): Observable<ServicioResponse> {
    const req: CerrarServicioRequest = { idServicio };
    return this.http.post<ServicioResponse>('/api/servicios/cerrar', req);
  }

  // Obtiene el servicio abierto de una mesa.
  getServicioMesaByMesaId(idMesa: number): Observable<ServicioResponse> {
    return this.http.get<ServicioResponse>(`/api/servicios/mesa/${idMesa}`);
  }
}
