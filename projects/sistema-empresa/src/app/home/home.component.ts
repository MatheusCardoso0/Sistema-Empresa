import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  popupAberto = false;
  cotacao = {
    nome: '',
    email: '',
    tipo: ''
  };

  constructor() { }

  // ngOnInit não utilizado

  abrirCotacao() {
    this.popupAberto = true;
  }

  fecharCotacao() {
    this.popupAberto = false;
    this.cotacao = { nome: '', email: '', tipo: '' };
  }

  enviarCotacao() {
    // Aqui você pode integrar com backend ou exibir mensagem de sucesso
    alert('Cotação enviada com sucesso!');
    this.fecharCotacao();
  }
}
