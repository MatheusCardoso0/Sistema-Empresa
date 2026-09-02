import { Component, Renderer2, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-cotacao',
    templateUrl: './cotacao.component.html',
    styleUrls: ['./cotacao.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CotacaoComponent implements OnInit, OnDestroy {
  cotacao = {
    nome: '',
    email: '',
    tipo: ''
  };

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    this.renderer.addClass(document.body, 'blurred-bg');
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'blurred-bg');
  }

  enviarCotacao() {
    alert('Cotação enviada com sucesso!');
    window.history.back();
  }

  fecharCotacao() {
    window.history.back();
  }
}
