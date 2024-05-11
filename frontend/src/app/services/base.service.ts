import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BaseService {

  loggedInUser = new BehaviorSubject<User | null>(this.getLocalStorage("chat-user"));
  selectedUser = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) { }

  setLoggedInUser(data: User | null){
    this.loggedInUser.next(data);
    if(data) this.setLocalStorage("chat-user", data);
  }

  getLocalStorage(key: string){
    let val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  }

  deleteLocalStorage(key: string){
    localStorage.removeItem(key);
  }

  setLocalStorage(key: string, body: User){
    let val = JSON.stringify(body);
    localStorage.setItem(key, val);
  }

  postMethod(body: any, url: string, header: any){
    return this.http.post(url, body, header);
  }

  getMethod(url: string, header: any){
    return this.http.get(url, header);
  }

  setSelectedUser(data: User | null){
    this.selectedUser.next(data);
  }

}
