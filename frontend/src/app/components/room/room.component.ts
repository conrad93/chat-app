import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.model';
import { BaseService } from 'src/app/services/base.service';
import { SocketService } from 'src/app/services/socket.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit, AfterViewInit, OnDestroy {
  
  private subscriptions: Subscription[] = [];
  @ViewChild('localVideo', {static: false}) localVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', {static: false}) remoteVideo?: ElementRef<HTMLVideoElement>;
  private peerConnection!: RTCPeerConnection;
  private localStream!: MediaStream;
  private remoteStream!: MediaStream;
  private servers = {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302'
        ]
      }
    ]
  };
  roomId = '';
  user!: User | null;
  private constraints = {
    // video:{
    //     width:{min:640, ideal:1920, max:1920},
    //     height:{min:480, ideal:1080, max:1080},
    // },
    video: true,
    audio:true
  };
  cameraBtnBgClass = 'primary';
  micBtnBgClass = 'primary';

  constructor(private route: ActivatedRoute, private router: Router, private socketService: SocketService, private baseService: BaseService) {
    this.baseService.loggedInUser.subscribe({
      next: (res: any) => {
        this.user = res;
      },
    });
  }

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    this.newJoiner();
    this.exitJoiner();
    this.getSignal();
  }

  ngAfterViewInit(): void {
    this.initFunction();
  }

  newJoiner(){
    let sub = this.socketService.roomJoined().subscribe({
      next: (res: any) => {
        this.handleNewJoiner(res);
      },
      error: err => console.log(err)
    });
    this.subscriptions.push(sub);
  }

  exitJoiner(){
    this.socketService.roomLeft().subscribe({
      next: (res: any) => {
        this.handleUserLeft(res);
      },
      error: err => console.log(err)
    });
  }

  getSignal(){
    this.socketService.getSignal().subscribe({
      next: (res: any) => {
        this.handleSignal(res);
      },
      error: err => console.log(err)
    });
  }
  
  async initFunction() {
    this.localStream = await navigator.mediaDevices.getUserMedia(this.constraints);
    if (this.localVideo) {
      this.localVideo.nativeElement.srcObject = this.localStream;
    }
    if(this.roomId) {
      this.socketService.joinRoom({roomId: this.roomId, userId: this.user?._id});
    }
  }

  handleSignal(data: any) {
    console.log("signal", data);
    if(data?.signal?.type === 'offer'){
      this.createAnswer(data.from, data?.signal?.offer)
    }

    if(data?.signal?.type === 'answer'){
      this.addAnswer(data?.signal?.answer)
    }

    if(data?.signal?.type === 'candidate'){
      if(this.peerConnection){
        this.peerConnection.addIceCandidate(data?.signal?.candidate)
      }
    }
  }

  createPeerConnection = async (userId: string) => {
    this.peerConnection = new RTCPeerConnection(this.servers);

    this.remoteStream = new MediaStream();
    if(this.remoteVideo) {
      this.remoteVideo.nativeElement.srcObject = this.remoteStream;
      this.remoteVideo.nativeElement.style.display = 'block';
    }

    if(this.localVideo) this.localVideo.nativeElement.classList.add('smallFrame');

    if(!this.localStream){
      this.localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
      if(this.localVideo) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }
    }

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.peerConnection.ontrack = (event) => {
      if(event?.streams?.[0]){
        event.streams[0].getTracks().forEach((track) => {
          this.remoteStream.addTrack(track)
        });
      }
    };

    this.peerConnection.onicecandidate = async (event) => {
      if(event.candidate){
        this.socketService.sendSignal({to: userId, from: this.user?._id, signal: { type: 'candidate', candidate: event.candidate }});
      }
    };
  }

  createOffer = async (userId: string) => {
    await this.createPeerConnection(userId)

    let offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer)

    this.socketService.sendSignal({to: userId, from: this.user?._id, signal: { type: 'offer', offer: offer }});
  }

  createAnswer = async (userId: string, offer: any) => {
    await this.createPeerConnection(userId)

    await this.peerConnection.setRemoteDescription(offer)

    let answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)

    this.socketService.sendSignal({to: userId, from: this.user?._id, signal: { type: 'answer', answer: answer }});
  }

  addAnswer = async (answer: any) => {
    if(!this.peerConnection.currentRemoteDescription){
      this.peerConnection.setRemoteDescription(answer)
    }
  }

  handleNewJoiner(data: any) {
    console.log("new joiner", data);
    if(data.userId === this.user?._id){
      return;
    }
    this.createOffer(data.userId);
  }

  handleUserLeft = (data: any) => {
    if(this.remoteVideo) this.remoteVideo.nativeElement.style.display = 'none';
    if(this.localVideo) this.localVideo.nativeElement.classList.remove('smallFrame');
  }

  leaveChannel = async () => {
    if(this.peerConnection) this.peerConnection.close();
    this.localStream.getTracks().forEach((track) => {
      track.stop();
    });
    this.socketService.leaveRoom({roomId: this.roomId, userId: this.user?._id});
    this.router.navigate(['/conference']);
  }

  toggleCamera = async () => {
    let videoTrack = this.localStream.getTracks().find(track => track.kind === 'video')

    if(videoTrack){
      if(videoTrack.enabled){
        videoTrack.enabled = false;
        this.cameraBtnBgClass = 'secondary';
      }else{
        videoTrack.enabled = true;
        this.cameraBtnBgClass = 'primary';
      }
    }
  }

  toggleMic = async () => {
    let audioTrack = this.localStream.getTracks().find(track => track.kind === 'audio')

    if(audioTrack){
      if(audioTrack.enabled){
        audioTrack.enabled = false;
        this.micBtnBgClass = 'secondary';
      }else{
        audioTrack.enabled = true
        this.micBtnBgClass = 'primary';
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.socketService.closeSocketEvent("roomJoined");
    this.socketService.closeSocketEvent("roomLeft");
    this.socketService.closeSocketEvent("signal");
  }
}
