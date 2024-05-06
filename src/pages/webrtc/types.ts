import { v4 as uuidv4 } from 'uuid';

export interface OfferMessage {
  type: 'offer';
  offer: RTCSessionDescriptionInit;
  recipient: string;
  peerId: string;
}

export interface AnswerMessage {
  type: 'answer';
  answer: RTCSessionDescriptionInit;
  recipient: string;
  peerId: string;
}

export interface CandidateMessage {
  type: 'candidate';
  candidate: RTCIceCandidateInit;
  recipient: string;
  peerId: string;
}

export type SignalingMessageWithoutPeerId =
  | Omit<OfferMessage, 'peerId'>
  | Omit<AnswerMessage, 'peerId'>
  | Omit<CandidateMessage, 'peerId'>;

export interface HelloMessage {
  type: 'hello';
  peerId: string;
}

export type SignalingMessage = OfferMessage | AnswerMessage | CandidateMessage | HelloMessage;

export type SignalingMessageSender = (message: SignalingMessage) => void;

export class PeerId {
  readonly npub: string;
  readonly uuid: string;
  private readonly str: string;

  constructor(npub: string, peerId = uuidv4()) {
    this.uuid = peerId;
    this.npub = npub;
    this.str = `${npub}:${peerId}`;
  }

  toString() {
    return this.str;
  }

  short() {
    return `${this.npub.slice(5, 11)}:${this.uuid.slice(0, 6)}`;
  }

  static fromString(str: string) {
    const [publicKey, peerId] = str.split(':');
    if (!publicKey || !peerId) {
      throw new Error('Invalid peer string ' + str);
    }
    return new PeerId(publicKey, peerId);
  }
}
