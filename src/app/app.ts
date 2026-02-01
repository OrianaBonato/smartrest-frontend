import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, MatToolbarModule, MatButtonModule ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}
  protected readonly title = signal('smartrest-frontend');

  logout() {
    this.authService.logout();
      this.router.navigateByUrl('');
  }
}
