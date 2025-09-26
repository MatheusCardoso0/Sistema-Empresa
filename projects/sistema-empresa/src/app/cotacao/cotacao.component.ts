import { Component } from '@angular/core';

@Component({
  selector: 'app-cotacao',
  templateUrl: './cotacao.component.html',
  styleUrls: ['./cotacao.component.css']
})
export class CotacaoComponent {
  cotacao = {
    nome: '',
    email: '',
    tipo: ''
  };

  enviarCotacao() {
    alert('Cotação enviada com sucesso!');
    window.history.back();
  }

  fecharCotacao() {
    window.history.back();
  }
}
