import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewChecked {

  @ViewChild('scrollME') private scrollContainer!: ElementRef;
  user: User | null = null;
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  message: string = '';
  search: string = '';
  messages: any[] = [];
  isLoading = false;

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

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  getUsers(){
    this.baseService.getMethod("/api/users", {}).subscribe({
      next: (res: any) => {
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
    this.baseService.getMethod("/api/messages/" + this.selectedUser?._id, {}).subscribe({
      next: (res: any) => {
        if(!res.error){
          this.messages = res;
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
  }

  sendMessage(){
    this.isLoading = true;
    let req = {
      message: this.message
    };
    this.baseService.postMethod(req, "/api/messages/send/" + this.selectedUser?._id, {}).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if(!res.error){
          this.message = '';
          this.messages.push(res);
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
  }

  logout(){
    this.baseService.postMethod({}, "/api/auth/logout", {}).subscribe({
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
  }

}
function viewChild(arg0: string): (target: HomeComponent, propertyKey: "scrollContainer") => void {
  throw new Error('Function not implemented.');
}

