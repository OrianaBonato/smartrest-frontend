import { Component } from '@angular/core';
import { SalaMesasComponent } from '../sala-mesas/sala-mesas.component';

@Component({
  selector: 'smartrest-sala-home',
  imports: [SalaMesasComponent],
  templateUrl: './sala-home.component.html',
  styleUrl: './sala-home.component.scss',
})
export class SalaHomeComponent {

}
