import { NDKSubscription } from '@nostr-dev-kit/ndk';
import { localState } from 'irisdb';
import { ndk, SocialGraph } from 'irisdb-nostr';

const instance = new SocialGraph('');

let sub: NDKSubscription | undefined;

localState.get('user/publicKey').on((publicKey?: string) => {
  if (publicKey) {
    instance.setRoot(publicKey);
    sub?.stop();
    sub = ndk().subscribe({
      kinds: [3],
      authors: [publicKey],
    });
    sub?.on('event', (ev) => {
      instance.handleEvent(ev);
    });
  } else {
    instance.setRoot('');
  }
});

export default instance;
