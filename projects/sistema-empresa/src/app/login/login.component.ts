import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usuario = '';
  senha = '';
  erro = false;

  constructor() { }

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
