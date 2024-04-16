import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { SocketService } from 'src/app/services/socket.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  @ViewChild('scrollMe', {static: false}) private scrollContainer?: ElementRef<HTMLDivElement>;
  private subscriptions: Subscription[] = [];
  user: User | null = null;
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  message: string = '';
  search: string = '';
  messages: any[] = [];
  isLoading = false;

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
        console.log(res);
        if(!res.error){
          this.allUsers = res;
          this.filteredUsers = res;
        } else {
          this.toastService.show({body: res.error, classname: "bg-danger text-white", delay: 3000});
        }
      },
      error: (err) => {
        this.toastService.show({body: "Server error", classname: "bg-danger text-white", delay: 3000});
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

  scrollToBottom(){
    const element = this.scrollContainer?.nativeElement;
    if(element) element.scrollTop = element.scrollHeight
  }

  setUser(user: User){
    this.selectedUser = user;
    this.messages = [];
    this.getMessages();
  }

  getMessages(){
    let sub = this.baseService.getMethod("/api/messages/" + this.selectedUser?._id, {}).subscribe({
      next: (res: any) => {
        if(!res.error){
          this.messages = res;
          setTimeout(() => this.scrollToBottom(), 0);
          this.socketService.closeSocketEvent("newMessage");
          this.getSocketMessage();
        } else {
          this.toastService.show({body: res.error, classname: "bg-danger text-white", delay: 3000});
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.show({body: "Server error", classname: "bg-danger text-white", delay: 3000});
        console.error(err);
      }
    });
    this.subscriptions.push(sub);
  }

  sendMessage(){
    this.isLoading = true;
    let req = {
      message: this.message
    };
    let sub = this.baseService.postMethod(req, "/api/messages/send/" + this.selectedUser?._id, {}).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if(!res.error){
          this.message = '';
          this.messages.push(res);
          setTimeout(() => this.scrollToBottom(), 0);
        } else {
          this.toastService.show({body: res.error, classname: "bg-danger text-white", delay: 3000});
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.show({body: "Server error", classname: "bg-danger text-white", delay: 3000});
        console.error(err);
      }
    });
    this.subscriptions.push(sub);
  }

  logout(){
    let sub = this.baseService.postMethod({}, "/api/auth/logout", {}).subscribe({
      next: (res: any) => {
        if(!res.error){
          this.selectedUser = null;
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
    this.subscriptions.push(sub);
  }

  getOnlineUsers(){
    let sub = this.socketService.getOnlineUsers().subscribe({
      next: (res: any) => {
        console.log("getOnlineUsers > ", res);
        if(res?.length){
          this.allUsers.forEach(e => {
            if(res.includes(e._id)){ 
              e.isOnline = true;
            } else {
              e.isOnline = false;
            }
          });
          this.filteredUsers.forEach(e => {
            if(res.includes(e._id)){ 
              e.isOnline = true;
            } else {
              e.isOnline = false;
            }
          });
        }
      },
      error: err => console.log(err)
    });
    this.subscriptions.push(sub);
  }

  getSocketMessage(){
    let sub = this.socketService.getMessage().subscribe({
      next: (res: any) => {
        if(res?.senderId === this.selectedUser?._id){
          this.messages.push(res);
          setTimeout(() => this.scrollToBottom(), 0);
        }
      },
      error: err => console.log(err)
    });
    this.subscriptions.push(sub);
  }

  @HostListener('window:unload', ['$event'])
  handleUnload($event: any) {
    this.handleDestroy();
  }

  handleDestroy(){
    this.subscriptions.forEach(s => s.unsubscribe());
    this.socketService.closeSocketEvent("newMessage");
    this.socketService.closeSocketEvent("getOnlineUsers");
    this.socketService.closeConnection();
  }

  ngOnDestroy(): void {
    this.handleDestroy();
  }

}