import { Injectable } from '@angular/core';

export interface ToastInfo {
  classname: string;
  body: string;
  delay?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  
  toasts: ToastInfo[] = [];
  
  constructor() { }

  show(toast: ToastInfo) {
    this.toasts.push(toast);
  }

  remove(toast: ToastInfo) {
    this.toasts = this.toasts.filter(t => t != toast);
  }

}
