import { Component } from '@angular/core';
import { ComandasColaComponent } from '../../../shared/comandas-cola/comandas-cola.component';

@Component({
  selector: 'smartrest-barra-home',
  imports: [ComandasColaComponent],
  templateUrl: './barra-home.component.html',
  styleUrl: './barra-home.component.scss',
})
// Vista principal para barra con cola de comandas.
export class BarraHomeComponent {

}
