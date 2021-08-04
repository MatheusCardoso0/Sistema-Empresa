import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AdminComponent } from 'Projects/sistema-empresa/src/app/admin/admin.component';
import { HomeComponent } from 'Projects/sistema-empresa/src/app/home/home.component';
import { LoginComponent } from 'Projects/sistema-empresa/src/app/login/login.component';

@NgModule({
  declarations: [
    // AppComponent,
    LoginComponent,
    AdminComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    // AppRoutingModule
  ],
  providers: [],
  // bootstrap: [AppComponent]
})
export class AppModule { }
