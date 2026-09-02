import { Component, Renderer2, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

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

  constructor(private readonly renderer: Renderer2) { }

  ngOnInit() {
    this.renderer.addClass(document.body, 'blurred-bg');
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'blurred-bg');
  }

  login() {
    if (this.usuario === 'admin' && this.senha === 'admin') {
      this.erro = false;
      alert('Login realizado com sucesso!');
      // Redirecionar para área administrativa se desejar
      this.fecharLogin();
    } else {
      this.erro = true;
    }
  }

  fecharLogin(event?: Event) {
    if (event) event.preventDefault();
    // Aqui você pode navegar para a home ou esconder o componente, conforme a navegação do app
    window.history.back();
  }
}
