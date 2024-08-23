import { NDKUser } from '@nostr-dev-kit/ndk';
// import debug from 'debug';
import { JsonValue } from 'irisdb';
import { ndk, publicState } from 'irisdb-nostr';
import { EventEmitter } from 'tseep';
import { v4 as uuidv4 } from 'uuid';

import PeerConnection from './connection';
import { HelloMessage, PeerId, SignalingMessage } from './types';

// const log = debug('webrtc:pool');

export class WebRtcPool extends EventEmitter {
  maxConnections: number;
  peerConnections: Map<string, PeerConnection>;
  myPeerId: PeerId;
  onlineUsers: Map<string, number>;
  TIMEOUT: number = 10 * 1000;
  follows: string[];
  interval?: number;
  myNdkUser: NDKUser;

  constructor(follows: string[], peerId: PeerId, maxConnections = 5) {
    super();
    this.maxConnections = maxConnections;
    this.peerConnections = new Map();
    this.myPeerId = peerId;
    this.onlineUsers = new Map();
    this.follows = follows;
    this.myNdkUser = ndk().getUser({ npub: peerId.npub });

    this.startPinging();
  }

  startPinging() {
    const message: HelloMessage = {
      type: 'hello',
      peerId: this.myPeerId.uuid,
    };

    const ping = () => this.sendSignalingMessage(message);

    this.interval = setInterval(ping, Math.floor(this.TIMEOUT / 2));
    ping();
  }

  stopPinging() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  async sendSignalingMessage(message: SignalingMessage, encryptTo?: NDKUser) {
    const signer = ndk().signer;
    if (!signer) return;

    let messageStr = JSON.stringify(message);

    console.log('Sending message:', messageStr);

    if (encryptTo) {
      messageStr = await signer.encrypt(encryptTo, JSON.stringify(message));
    }

    await publicState(this.follows)
      .get('network/webrtc/msg')
      .get(uuidv4())
      .put(messageStr, undefined, Date.now() + this.TIMEOUT);
  }

  isPeerConnectionOpen(peerId: PeerId) {
    const connection = this.peerConnections.get(peerId.toString());
    return connection && connection.peerConnection.connectionState === 'connected';
  }

  handleSignalingMessage(data: SignalingMessage, senderNpub: string) {
    const peerId = new PeerId(senderNpub, data.peerId);
    const peerIdStr = peerId.toString();
    switch (data.type) {
      case 'hello':
        if (
          peerIdStr !== this.myPeerId.toString() &&
          this.peerConnections.size < this.maxConnections &&
          !this.isPeerConnectionOpen(peerId)
        ) {
          // Use a tie-breaking mechanism to decide who creates the offer
          if (this.myPeerId.uuid < data.peerId) {
            this.createPeerConnection(peerId).createOffer();
          } else {
            // Set a timeout to send an offer if one isn't received within 2 seconds
            setTimeout(() => {
              if (!this.isPeerConnectionOpen(peerId)) {
                this.createPeerConnection(peerId).createOffer();
              }
            }, 2000);
          }
          console.log('Received hello message:', data);
        }
        this.updateOnlineUsers(peerId);
        break;
      case 'offer':
        if (
          peerIdStr !== this.myPeerId.toString() &&
          this.peerConnections.size < this.maxConnections &&
          data.recipient === this.myPeerId.toString()
        ) {
          console.log('Received offer message:', data);
          this.createPeerConnection(peerId).createAnswer(data.offer);
        }
        break;
      case 'answer':
        if (data.recipient === this.myPeerId.toString()) {
          console.log('Received answer message:', data);
          this.peerConnections
            .get(peerIdStr)
            ?.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
        break;
      case 'candidate':
        if (data.recipient === this.myPeerId.toString()) {
          console.log('Received candidate message:', data);
          this.peerConnections.get(peerIdStr)?.addIceCandidate(data.candidate);
        }
        break;
      default:
        console.error('Received unknown message type:', data);
    }
  }

  updateOnlineUsers(peerId: PeerId, createdAt: number = Date.now()) {
    this.onlineUsers.set(peerId.toString(), createdAt);
    this.emit('change');

    // Remove user after timeout
    setTimeout(() => {
      const lastSeen = this.onlineUsers.get(peerId.toString());
      if (lastSeen && Date.now() - lastSeen > this.TIMEOUT) {
        this.onlineUsers.delete(peerId.toString());
        this.emit('change');
      }
    }, this.TIMEOUT);
  }

  getOnlineUsers() {
    return this.onlineUsers;
  }

  createPeerConnection(peerId: PeerId) {
    const id = peerId.toString();
    if (!this.peerConnections.has(id)) {
      const peerConnection = new PeerConnection(id, (message) =>
        this.sendSignalingMessage(
          { ...message, peerId: this.myPeerId.uuid },
          ndk().getUser({ npub: peerId.npub }),
        ),
      );
      this.peerConnections.set(id, peerConnection);
      peerConnection.on('close', () => {
        this.peerConnections.delete(id);
      });
      return peerConnection;
    }
    return this.peerConnections.get(id)!;
  }

  closeConnection(peerId: string) {
    this.peerConnections.get(peerId)?.close();
  }

  async handleMessage(msg: JsonValue, key: string, createdAt: number | undefined) {
    if (!createdAt || Date.now() - createdAt > this.TIMEOUT) return;

    if (typeof msg === 'string') {
      const npub = key.split('/')[0];

      let unencrypted: string | undefined = msg;
      if (msg.indexOf('{') !== 0) {
        const ndkSender = ndk().getUser({ npub });
        try {
          unencrypted = await ndk().signer?.decrypt(ndkSender, msg);
        } catch (e) {
          // message is not for us
          return;
        }
        if (!unencrypted) {
          console.log('Could not decrypt message:', msg);
          return;
        }
      }

      try {
        const data = JSON.parse(unencrypted);
        this.handleSignalingMessage(data, npub);
      } catch (e) {
        console.error(e);
      }
    }
  }
}