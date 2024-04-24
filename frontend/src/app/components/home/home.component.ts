import { Component, ElementRef, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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

  @ViewChild('imageInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('scrollMe', {static: false}) private scrollContainer?: ElementRef<HTMLDivElement>;
  private subscriptions: Subscription[] = [];
  user: User | null = null;
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  onlineUsers: string[] = [];
  message: string = '';
  search: string = '';
  messages: any[] = [];
  isLoading = false;
  imageUrl: string | ArrayBuffer | null = null;

  constructor(private toastService: ToastService, private baseService: BaseService, private socketService: SocketService, private modalService: NgbModal, private router: Router){
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
    if(this.message){
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

  openImageModal(event: any, content: TemplateRef<any>){
    const file: File = event.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = e => this.imageUrl = reader.result;
      reader.readAsDataURL(file);
    
      const modalRef = this.modalService.open(content, {backdrop: "static", size: "md"});
      modalRef.result.then((result) => {
        if(result === 'send'){
          this.uploadImage(file);
        }
        this.clearImage();
      }).catch((err) => {
        console.log(err)
        this.clearImage();
      });
    }
  }

  uploadImage(file: File){
    this.isLoading = true;
    const fd = new FormData();
    fd.append('imageFile', file, file.name);
    let sub = this.baseService.postMethod(fd, "/api/messages/sendimage/" + this.selectedUser?._id, {}).subscribe({
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

  clearImage(): void {
    this.imageUrl = null;
    if(this.fileInput?.nativeElement){
      this.fileInput.nativeElement.value = '';
    }
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