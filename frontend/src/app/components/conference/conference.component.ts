import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {v4 as uuidV4} from 'uuid';

@Component({
  selector: 'app-conference',
  templateUrl: './conference.component.html',
  styleUrls: ['./conference.component.scss']
})
export class ConferenceComponent {

  constructor(private router: Router) { }

  roomId: string = '';

  createRoom() {
    this.roomId = uuidV4();
  }

  joinRoom() {
    this.router.navigate(['/room/' + this.roomId]);
  }
}
