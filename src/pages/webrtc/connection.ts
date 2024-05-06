import debug from 'debug';
import { EventEmitter } from 'tseep';

import { SignalingMessageWithoutPeerId } from './types';

const log = debug('webrtc:connection');

export default class PeerConnection extends EventEmitter {
  peerId: string;
  signalingSend: (message: SignalingMessageWithoutPeerId) => void;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;

  constructor(peerId: string, signalingSend: (message: SignalingMessageWithoutPeerId) => void) {
    super();
    this.peerId = peerId;
    this.signalingSend = signalingSend;
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    this.dataChannel = null;
    this.setupPeerConnectionEvents();
  }

  setupPeerConnectionEvents() {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingSend({
          type: 'candidate',
          candidate: event.candidate,
          recipient: this.peerId,
        });
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.setDataChannel(event.channel);
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === 'closed') {
        console.log(`${this.peerId} connection closed`);
        this.close();
      }
    };
  }

  async createOffer() {
    this.dataChannel = this.peerConnection.createDataChannel('jsonChannel');
    this.setDataChannel(this.dataChannel);
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.signalingSend({ type: 'offer', offer, recipient: this.peerId });
  }

  async createAnswer(offer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.signalingSend({ type: 'answer', answer, recipient: this.peerId });
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  setDataChannel(dataChannel: RTCDataChannel) {
    this.dataChannel = dataChannel;
    this.dataChannel.onopen = () => console.log('Data channel is open');
    this.dataChannel.onmessage = (event) => {
      console.log('Received message:', event.data);
    };
    this.dataChannel.onclose = () => {
      console.log('Data channel is closed');
      this.close();
    };
  }

  sendJsonData(jsonData: unknown) {
    if (this.dataChannel?.readyState === 'open') {
      const jsonString = JSON.stringify(jsonData);
      this.dataChannel.send(jsonString);
    }
  }

  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    this.peerConnection.close();
    this.emit('close');
  }
}
