import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CrearLineaRequest {
  idServicio: number;
  idProducto: number;
  cantidad: number;
  observaciones?: string;
  idUsuarioCreador: number;
}

export interface LineaComandaResponse {
  idLinea: number;
  idServicio: number;
  idProducto: number;
  productoNombre?: string;
  cantidad: number;
  precioUnitario: number;
  destino: 'COCINA' | 'BARRA';
  estado: string;
  observaciones?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

@Injectable({ providedIn: 'root' })
export class ComandaService {
  constructor(private http: HttpClient) {}

  crearLinea(req: CrearLineaRequest): Observable<LineaComandaResponse> {
    return this.http.post<LineaComandaResponse>('/api/comandas/lineas', req);
  }

  pendientesByServicioId(idServicio: number): Observable<LineaComandaResponse[]> {
    return this.http.get<LineaComandaResponse[]>(`/api/servicios/${idServicio}/pendientes`);
  }

  lineasByServicioId(idServicio: number): Observable<LineaComandaResponse[]> {
    return this.http.get<LineaComandaResponse[]>(`/api/servicios/${idServicio}/lineas`);
  }
}
