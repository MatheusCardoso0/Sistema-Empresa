import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from 'projects/sistema-empresa/src/app/login/login.component';
import { CotacaoComponent } from 'projects/sistema-empresa/src/app/cotacao/cotacao.component';
import { AdminComponent } from 'projects/sistema-empresa/src/app/admin/admin.component';
import { AuthGuard } from 'projects/sistema-empresa/src/app/auth/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  { path: 'cotacao', component: CotacaoComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
