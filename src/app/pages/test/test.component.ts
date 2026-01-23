import { Component, OnInit } from '@angular/core';
import { TestService } from '../../services/test.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html'
})
export class TestComponent implements OnInit {
  result = 'Cargando...';

  constructor(private testService: TestService) {}

  ngOnInit(): void {
    this.testService.ping().subscribe({
      next: (res: string) => (this.result = res),
      error: (err: HttpErrorResponse) => (this.result = `Error: ${err.message}`)
    });
  }
}
