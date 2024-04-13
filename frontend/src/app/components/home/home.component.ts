import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  noChatSelected = true;
  user: User | null = null;
  allUsers: User[] = [];

  constructor(private toastService: ToastService, private baseService: BaseService, private router: Router){
    this.baseService.loggedInUser.subscribe({
      next: (res: any) => {
        this.user = res;
      }
    });
  }

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(){
    this.baseService.getMethod("/api/users", {}).subscribe({
      next: (res: any) => {
        if(!res.error){
          this.allUsers = res;
        } else {
          this.toastService.show({body: res.error, classname: "bg-danger text-white", delay: 3000});
        }
      },
      error: (err) => {
        this.toastService.show({body: "Server error", classname: "bg-danger text-white", delay: 3000});
        console.error(err);
      }
    });
  }

  logout(){
    this.baseService.postMethod({}, "/api/auth/logout", {}).subscribe({
      next: (res: any) => {
        if(!res.error){
          this.toastService.show({body: "Success", classname: "bg-success text-white", delay: 3000});
          this.baseService.setLoggedInUser(null);
          this.baseService.deleteLocalStorage("chat-user");
          this.router.navigate(['/login']);
        } else {
          this.toastService.show({body: res.error, classname: "bg-danger text-white", delay: 3000});
        }
      },
      error: (err) => {
        this.toastService.show({body: "Server error", classname: "bg-danger text-white", delay: 3000});
        console.error(err);
      }
    });
  }

}
