import { Component, ElementRef, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { CryptoService } from 'src/app/services/crypto.service';
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
  @ViewChild('imageInput') fileInput?: ElementRef<HTMLInputElement>;
  selectedUser: User | null = null;
  user?: User | null;
  imageUrl: string | ArrayBuffer | null = null;
  messages: any[] = [];
  isLoading = false;
  message: string = '';
  private key: CryptoKey | null = null;

  constructor(private cryptoService: CryptoService, private modalService: NgbModal, private socketService: SocketService, private toastService: ToastService, private baseService: BaseService){
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
    this.cryptoService.importKey().then(key => this.key = key);
  }

  onChangeSelectedUser(){
    if(this.selectedUser){
      this.messages = [];
      this.message = '';
      this.getMessages();
    }
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

  scrollToBottom(){
    const element = this.scrollContainer?.nativeElement;
    if(element) element.scrollTop = element.scrollHeight
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

  clearImage(): void {
    this.imageUrl = null;
    if(this.fileInput?.nativeElement){
      this.fileInput.nativeElement.value = '';
    }
  }

  getMessages(){
    let sub = this.baseService.getMethod("/api/messages/" + this.selectedUser?._id, {}).subscribe({
      next: (res: any) => {
        if(!res.error){
          let arr = res || [];
          const decryptPromises = arr.map((m: any) =>
            this.cryptoService.decryptData(m.encryptedData, m.iv)
            .then(decryptedMessage => {
              return decryptedMessage;
            })
            .catch(error => {
              console.error('Decryption failed for message', m, error);
              return {};
            })
          );
          Promise.all(decryptPromises).then(decryptedMessages => {
            this.messages = decryptedMessages;
            setTimeout(() => this.scrollToBottom(), 0);
          });
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
      this.cryptoService.encryptMessage(this.message, this.key as CryptoKey)
      .then(encrypted => {
        let sub = this.baseService.postMethod({message: encrypted}, "/api/messages/send/" + this.selectedUser?._id, {}).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            if(!res.error){
              this.message = '';
              this.cryptoService.decryptData(res.encryptedData, res.iv)
              .then(decryptedMessage => {
                this.messages.push(decryptedMessage);
                setTimeout(() => this.scrollToBottom(), 0);
              })
              .catch(error => {
                console.error('Decryption failed for message', res, error);
              });
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
      });
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

  @HostListener('window:unload', ['$event'])
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
