import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AdminComponent } from 'projects/sistema-empresa/src/app/admin/admin.component';
import { HomeComponent } from 'projects/sistema-empresa/src/app/home/home.component';
import { LoginComponent } from 'projects/sistema-empresa/src/app/login/login.component';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AdminComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
