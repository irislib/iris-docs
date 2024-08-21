import { JsonValue } from 'irisdb';
import { useAuthors, useLocalState } from 'irisdb-hooks';
import { publicState } from 'irisdb-nostr';
import { nip19 } from 'nostr-tools';
import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { WebRtcPool } from '@/pages/online/pool.ts';
import { PeerId } from '@/pages/online/types.ts';
import { UserRow } from '@/pages/online/UserRow.tsx';
import AnimalName from '@/utils/AnimalName.ts';

export default function OnlinePage() {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, number>>(new Map());
  const [myPubKey] = useLocalState('user/publicKey', '');
  const follows = useAuthors('follows');

  const uuid = useMemo(() => uuidv4(), []);
  const myNpub = useMemo(() => (myPubKey ? nip19.npubEncode(myPubKey) : ''), [myPubKey]);

  const newPoolRef = useRef<WebRtcPool | null>(null);

  useEffect(() => {
    if (!myPubKey) {
      return;
    }

    const newPool = new WebRtcPool(follows, new PeerId(myNpub, uuid));
    newPoolRef.current = newPool;

    newPool.on('change', () => {
      setOnlineUsers(new Map(newPool.getOnlineUsers()));
    });

    const handleMessage = (msg: JsonValue, key: string, createdAt: number | undefined) => {
      newPool.handleMessage(msg, key, createdAt);
    };

    const unsub = publicState(follows).get('network/webrtc/msg').forEach(handleMessage);

    return () => {
      unsub();
      newPool.stopPinging();
    };
  }, [follows, myNpub, myPubKey, uuid]);

  if (!myPubKey) {
    return <div>Loading...</div>;
  }

  const mySession = new PeerId(myNpub, uuid).toString();
  const otherUsers = Array.from(onlineUsers.keys())
    .filter((user) => user !== mySession)
    .sort((a, b) => {
      const peerIdA = PeerId.fromString(a).toString();
      const peerIdB = PeerId.fromString(b).toString();
      return peerIdA.localeCompare(peerIdB);
    });

  const sortedUsers = [mySession, ...otherUsers];

  const npubCount = new Map<string, number>();
  sortedUsers.forEach((user) => {
    const peerId = PeerId.fromString(user);
    const pubKey = peerId.npub;
    npubCount.set(pubKey, (npubCount.get(pubKey) || 0) + 1);
  });

  return (
    <div className="flex flex-1 w-full max-w-[768px] flex-col p-4 md:p-8 mx-auto">
      <p className="text-sm mb-4">
        This page shows your friends who are also viewing the current page. It attempts to
        direct-connect to them over WebRTC, so you can communicate privately without going through
        relays. In this demo you can send files to each other.
      </p>
      <p className="text-sm mb-4">
        You can also log in with the same account on different devices and send files between them.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {sortedUsers.map((user) => {
          const peerId = PeerId.fromString(user);
          const pubKey = peerId.npub;
          const animalName = AnimalName(peerId.toString());

          // Set description only if there are two users with the same npub
          const description =
            npubCount.get(pubKey)! > 1
              ? user === mySession
                ? `${animalName} (this session)`
                : `${animalName}`
              : '';

          const connection = newPoolRef.current?.peerConnections.get(user); // Get the connection
          return (
            <UserRow
              key={user}
              pubKey={peerId.npub}
              description={description}
              connection={connection}
              isCurrentUser={user === mySession} // Pass isCurrentUser prop
            />
          );
        })}
      </div>
    </div>
  );
}
