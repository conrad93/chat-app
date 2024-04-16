import { Injectable } from '@angular/core';
import {io,Socket} from 'socket.io-client';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket!: Socket;
  private apiUrl = environment.apiUrl;

  constructor(private baseService: BaseService) {
    this.baseService.loggedInUser.subscribe({
      next: (res: any) => {
        if(res) {
          this.connect(res?._id);
        } else if(this.socket){
          this.socket.close();
        }
      },
    });
  }

  private connect(id: string){
    this.socket = io(this.apiUrl, {
      query: {
        userId: id
      }
    });
  }

  createConnection(id: string){
    this.connect(id);
  }

  closeConnection(){
    this.socket.close();
  }

  closeSocketEvent(name: string){
    if(this.socket) this.socket.off(name);
  }

  getOnlineUsers() {
    return new Observable(observer => {
      this.socket.on('getOnlineUsers', (users) => {
        observer.next(users);
      });

      this.socket.on('error', (error) => {
        observer.error(error);
      });
    });
  }

  getMessage() {
    return new Observable(observer => {
      this.socket.on('newMessage', (message) => {
        observer.next(message);
      });

      this.socket.on('error', (error) => {
        observer.error(error);
      });
    });
  }

}
