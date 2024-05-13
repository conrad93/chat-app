import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { SocketService } from 'src/app/services/socket.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  user: User | null = null;
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  onlineUsers: string[] = [];
  search: string = '';

  constructor(private toastService: ToastService, private baseService: BaseService, private socketService: SocketService, private router: Router){
    let sub = this.baseService.loggedInUser.subscribe({
      next: (res: any) => {
        this.user = res;
        if(this.user) this.getOnlineUsers();
      }
    });
    this.subscriptions.push(sub);
  }

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(){
    let sub = this.baseService.getMethod("/api/users", {}).subscribe({
      next: (res: any) => {
        if(!res.error){
          this.allUsers = res;
          this.filteredUsers = res;
          this.setOnlineStatus();
        } else {
          this.toastService.show({body: res.error, classnames: "bg-danger text-white", delay: 3000});
        }
      },
      error: (err) => {
        this.toastService.show({body: "Server error", classnames: "bg-danger text-white", delay: 3000});
        console.error(err);
      }
    });
    this.subscriptions.push(sub);
  }

  filterUser(){
    if(this.search.length < 2){
      this.filteredUsers = this.allUsers;
    } else {
      this.filteredUsers = this.allUsers.filter(u => u.fullName.toLowerCase().includes(this.search.toLowerCase()));
    }
  }

  setUser(user: User){
    this.selectedUser = user;
    this.baseService.setSelectedUser(user);
  }

  logout(){
    let sub = this.baseService.postMethod({}, "/api/auth/logout", {}).subscribe({
      next: (res: any) => {
        if(!res.error){
          this.selectedUser = null;
          this.baseService.setSelectedUser(null);
          this.toastService.show({body: "Success", classnames: "bg-success text-white", delay: 3000});
          this.baseService.setLoggedInUser(null);
          this.baseService.deleteLocalStorage("chat-user");
          this.router.navigate(['/login']);
        } else {
          this.toastService.show({body: res.error, classnames: "bg-danger text-white", delay: 3000});
        }
      },
      error: (err) => {
        this.toastService.show({body: "Server error", classnames: "bg-danger text-white", delay: 3000});
        console.error(err);
      }
    });
    this.subscriptions.push(sub);
  }

  setOnlineStatus(){
    this.allUsers.forEach(e => {
      if(this.onlineUsers.includes(e._id)){ 
        e.isOnline = true;
      } else {
        e.isOnline = false;
      }
    });
    this.filteredUsers.forEach(e => {
      if(this.onlineUsers.includes(e._id)){ 
        e.isOnline = true;
      } else {
        e.isOnline = false;
      }
    });
  }

  getOnlineUsers(){
    let sub = this.socketService.getOnlineUsers().subscribe({
      next: (res: any) => {
        if(res?.length){
          this.onlineUsers = res;
        } else {
          this.onlineUsers = [];
        }
        this.setOnlineStatus();
      },
      error: err => console.log(err)
    });
    this.subscriptions.push(sub);
  }

  @HostListener('window:beforeunload', ['$event'])
  handleUnload($event: any) {
    this.handleDestroy();
  }

  handleDestroy(){
    this.subscriptions.forEach(s => s.unsubscribe());
    this.socketService.closeSocketEvent("getOnlineUsers");
  }

  ngOnDestroy(): void {
    this.handleDestroy();
  }

}
