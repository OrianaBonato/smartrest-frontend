import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Mesa {
  idMesa: number;
  numero: number;
  capacidad: number;
  estado: string; // "LIBRE" | "OCUPADA" ...
  fechaActualizacion?: string;
}

@Injectable({
  providedIn: 'root',
})
// Servicio para consultar mesas.
export class MesaService {
  constructor(private http: HttpClient) {}

  // Lista todas las mesas.
  getMesas(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>('/api/mesas/list');
  }

  // Obtiene una mesa por id.
  getMesa(idMesa: number): Observable<Mesa> {
    return this.http.get<Mesa>(`/api/mesas/${idMesa}`);
  }
}
