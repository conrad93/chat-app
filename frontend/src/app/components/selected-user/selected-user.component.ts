import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { SocketService } from 'src/app/services/socket.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-selected-user',
  templateUrl: './selected-user.component.html',
  styleUrls: ['./selected-user.component.scss']
})
export class SelectedUserComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  @ViewChild('scrollMe', {static: false}) private scrollContainer?: ElementRef<HTMLDivElement>;
  selectedUser: User | null = null;
  user?: User | null;
  messages: any[] = [];
  isLoading = false;
  message: string = '';

  constructor(private socketService: SocketService, private toastService: ToastService, private baseService: BaseService){
    let userSub = this.baseService.loggedInUser.subscribe({
      next: (res: any) => {
        this.user = res;
      }
    });
    this.subscriptions.push(userSub);
  }

  ngOnInit(): void {
    let userSub = this.baseService.selectedUser.subscribe({
      next: (res: any) => {
        this.selectedUser = res;
        this.onChangeSelectedUser();
      }
    });
  }

  onChangeSelectedUser(){
    if(this.selectedUser){
      this.messages = [];
      this.message = '';
      this.getMessages();
    }
  }

  scrollToBottom(){
    const element = this.scrollContainer?.nativeElement;
    if(element) element.scrollTop = element.scrollHeight
  }

  getMessages(){
    let sub = this.baseService.getMethod("/api/messages/" + this.selectedUser?._id, {}).subscribe({
      next: (res: any) => {
        if(!res.error){
          this.messages = res || [];
          this.socketService.closeSocketEvent("newMessage");
          this.getSocketMessage();
        } else {
          this.toastService.show({body: res.error, classnames: "bg-danger text-white", delay: 3000});
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.show({body: "Server error", classnames: "bg-danger text-white", delay: 3000});
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
      let sub = this.baseService.postMethod({message: this.message}, "/api/messages/send/" + this.selectedUser?._id, {}).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if(!res.error){
            this.message = '';
            this.messages.push(res);
            setTimeout(() => this.scrollToBottom(), 0);
          } else {
            this.toastService.show({body: res.error, classnames: "bg-danger text-white", delay: 3000});
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.toastService.show({body: "Server error", classnames: "bg-danger text-white", delay: 3000});
          console.error(err);
        }
      });
      this.subscriptions.push(sub);
    }
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

  @HostListener('window:beforeunload', ['$event'])
  handleUnload($event: any) {
    this.handleDestroy();
  }

  handleDestroy(){
    this.messages = [];
    this.subscriptions.forEach(s => s.unsubscribe());
    this.socketService.closeSocketEvent("newMessage");
  }

  ngOnDestroy(): void {
    this.handleDestroy();
  }
}
