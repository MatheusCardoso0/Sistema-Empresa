import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from 'projects/sistema-empresa/src/app/home/home.component';
import { LoginComponent } from 'projects/sistema-empresa/src/app/login/login.component';
import { CotacaoComponent } from 'projects/sistema-empresa/src/app/cotacao/cotacao.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'cotacao', component: CotacaoComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
