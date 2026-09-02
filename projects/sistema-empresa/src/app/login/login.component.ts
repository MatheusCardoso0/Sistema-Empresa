import { Component, Renderer2, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LoginComponent implements OnInit, OnDestroy {
  usuario = '';
  senha = '';
  erro = false;

  constructor(
    private readonly renderer: Renderer2,
    private readonly authService: AuthService,
    private readonly router: Router
  ) { }

  ngOnInit() {
    this.renderer.addClass(document.body, 'blurred-bg');
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'blurred-bg');
  }

  login() {
    this.erro = false;
    this.authService.login(this.usuario, this.senha).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => this.erro = true
    });
  }

  fecharLogin(event?: Event) {
    if (event) event.preventDefault();
    this.router.navigate(['/login']);
  }
}
