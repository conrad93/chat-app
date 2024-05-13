import { Component, HostListener, OnDestroy } from '@angular/core';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy{
  title = 'chat-app';

  constructor(private socketService: SocketService){
    
  }

  handleDestroy(){
    this.socketService.closeConnection();
  }

  @HostListener('window:unload', ['$event'])
  handleUnload(event: any) {
    this.handleDestroy();
  }

  ngOnDestroy(): void {
    this.handleDestroy();
  }
}
