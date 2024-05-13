import { Injectable } from '@angular/core';
import {io,Socket} from 'socket.io-client';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { from, Observable } from 'rxjs';

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

  joinRoom(data: any){
    this.socket.emit('joinRoom', data);
  }

  roomJoined() {
    return new Observable(observer => {
      this.socket.on('roomJoined', (data) => {
        observer.next(data);
      });
      
      this.socket.on('error', (error) => {
        observer.error(error);
      });
    });
  }

  leaveRoom(data: any){
    this.socket.emit('leaveRoom', data);
  }

  roomLeft() {
    return new Observable(observer => {
      this.socket.on('roomLeft', (data) => {
        observer.next(data);
      });
      
      this.socket.on('error', (error) => {
        observer.error(error);
      });
    });
  }

  sendSignal(data: any){
    this.socket.emit('signal', data);
  }

  getSignal() {
    return new Observable(observer => {
      this.socket.on('signal', (data) => {
        observer.next(data);
      });
      
      this.socket.on('error', (error) => {
        observer.error(error);
      });
    });
  }

}
