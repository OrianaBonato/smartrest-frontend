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
export class MesaService {
  constructor(private http: HttpClient) {}

  getMesas(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>('/api/mesas/list');
  }
}
