import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto {
  idProducto: number;
  nombre: string;
  precio: number;
  activo: boolean;
  destinoDefecto: 'COCINA' | 'BARRA';
  idCategoria?: number;
  nombreCategoria?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductoService {
  constructor(private http: HttpClient) {}

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>('/api/productos/list');
  }
}