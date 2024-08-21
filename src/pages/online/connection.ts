import debug from 'debug';
import { EventEmitter } from 'tseep';

import { SignalingMessageWithoutPeerId } from './types';

const log = debug('webrtc:connection');

export default class PeerConnection extends EventEmitter {
  peerId: string;
  signalingSend: (message: SignalingMessageWithoutPeerId) => void;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  fileChannel: RTCDataChannel | null;
  incomingFileMetadata: { name: string; size: number; type: string } | null = null;
  receivedFileData: ArrayBuffer[] = [];
  receivedFileSize: number = 0;

  constructor(peerId: string, signalingSend: (message: SignalingMessageWithoutPeerId) => void) {
    super();
    this.peerId = peerId;
    this.signalingSend = signalingSend;
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    this.dataChannel = null;
    this.fileChannel = null;
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
      const channel = event.channel;
      if (channel.label.startsWith('fileChannel')) {
        this.setFileChannel(channel);
      } else {
        this.setDataChannel(channel);
      }
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
    this.fileChannel = this.peerConnection.createDataChannel('fileChannel');
    this.setFileChannel(this.fileChannel);
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

  setFileChannel(fileChannel: RTCDataChannel) {
    this.fileChannel = fileChannel;
    this.fileChannel.binaryType = 'arraybuffer';
    this.fileChannel.onopen = () => console.log('File channel is open');
    this.fileChannel.onmessage = (event) => {
      console.log('File channel received message:', event.data);
      if (typeof event.data === 'string') {
        const metadata = JSON.parse(event.data);
        if (metadata.type === 'file-metadata') {
          this.incomingFileMetadata = metadata.metadata;
          this.receivedFileData = [];
          this.receivedFileSize = 0;
          console.log('Received file metadata:', this.incomingFileMetadata);
        }
      } else if (event.data instanceof ArrayBuffer) {
        this.receivedFileData.push(event.data);
        this.receivedFileSize += event.data.byteLength;
        console.log('Received file chunk:', event.data.byteLength, 'bytes');
        console.log('Total received size:', this.receivedFileSize, 'bytes');

        if (this.incomingFileMetadata) {
          console.log('Expected file size:', this.incomingFileMetadata.size, 'bytes');
          if (this.receivedFileSize === this.incomingFileMetadata.size) {
            console.log('File fully received, saving file...');
            this.saveReceivedFile();
          } else {
            console.log('File not fully received, waiting...');
          }
        } else {
          console.error('No file metadata available');
        }
      }
    };
    this.fileChannel.onclose = () => {
      console.log('File channel is closed');
    };
  }

  async saveReceivedFile() {
    if (!this.incomingFileMetadata) {
      console.error('No file metadata available');
      return;
    }

    const confirmString = `Save ${this.incomingFileMetadata.name} from ${this.peerId}?`;
    if (!confirm(confirmString)) {
      console.log('User did not confirm file save');
      this.incomingFileMetadata = null;
      this.receivedFileData = [];
      this.receivedFileSize = 0;
      return;
    }

    console.log('Saving file with metadata:', this.incomingFileMetadata);
    console.log('Total received file data size:', this.receivedFileSize);

    const blob = new Blob(this.receivedFileData, { type: this.incomingFileMetadata.type });
    console.log('Created Blob:', blob);

    const url = URL.createObjectURL(blob);
    console.log('Created Object URL:', url);

    const a = document.createElement('a');
    a.href = url;
    a.download = this.incomingFileMetadata.name;
    document.body.appendChild(a);
    console.log('Appended anchor element to body:', a);

    a.click();
    console.log('Triggered download');

    document.body.removeChild(a);
    console.log('Removed anchor element from body');

    URL.revokeObjectURL(url);
    console.log('Revoked Object URL');

    // Reset file data
    this.incomingFileMetadata = null;
    this.receivedFileData = [];
    this.receivedFileSize = 0;
    console.log('Reset file data');
  }

  sendJsonData(jsonData: unknown) {
    if (this.dataChannel?.readyState === 'open') {
      const jsonString = JSON.stringify(jsonData);
      this.dataChannel.send(jsonString);
    }
  }

  sendFile(file: File) {
    if (this.peerConnection.connectionState === 'connected') {
      // Create a unique file channel name
      const fileChannelName = `fileChannel-${Date.now()}`;
      const fileChannel = this.peerConnection.createDataChannel(fileChannelName);
      this.setFileChannel(fileChannel);

      // Send file metadata over the file channel
      const metadata = {
        type: 'file-metadata',
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      };
      fileChannel.onopen = () => {
        console.log('File channel is open, sending metadata');
        fileChannel.send(JSON.stringify(metadata));

        // Read and send the file as binary data
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result && reader.result instanceof ArrayBuffer) {
            fileChannel.send(reader.result);
          }
        };
        reader.readAsArrayBuffer(file);
      };
    } else {
      console.error('Peer connection is not connected');
    }
  }

  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.fileChannel) {
      this.fileChannel.close();
    }
    this.peerConnection.close();
    this.emit('close');
  }
}