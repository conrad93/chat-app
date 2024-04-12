import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SignupComponent } from './components/signup/signup.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path:'home', 
    component: HomeComponent,
    // canActivate:[AuthGuard]
  },
  {
    path:'login', 
    component: LoginComponent
  },
  {
    path:'signup', 
    component: SignupComponent
  },
  {path:'', redirectTo:'home', pathMatch:'full'},
  {
    path:'**', 
    redirectTo:'home'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
