import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}
  protected readonly title = signal('smartrest-frontend');

  logout() {
    this.authService.logout();
      this.router.navigateByUrl('');
  }
}
