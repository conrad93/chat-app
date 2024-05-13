import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SignupComponent } from './components/signup/signup.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { ConferenceComponent } from './components/conference/conference.component';
import { RoomComponent } from './components/room/room.component';

const routes: Routes = [
  {
    path:'home', 
    component: HomeComponent,
    canActivate:[AuthGuard]
  },
  {
    path: 'conference',
    component: ConferenceComponent,
    canActivate:[AuthGuard]
  },
  {
    path: 'room/:roomId',
    component: RoomComponent,
    canActivate:[AuthGuard]
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
