import { JsonValue } from 'irisdb';
import { useAuthors, useLocalState } from 'irisdb-hooks';
import { publicState } from 'irisdb-nostr';
import { nip19 } from 'nostr-tools';
import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { WebRtcPool } from '@/pages/webrtc/pool.ts';
import { PeerId } from '@/pages/webrtc/types.ts';
import { UserRow } from '@/shared/components/user/UserRow.tsx';
import AnimalName from '@/utils/AnimalName.ts';

export default function WebRtcPage() {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, number>>(new Map());
  const [myPubKey] = useLocalState('user/publicKey', '');
  const follows = useAuthors('follows');

  const uuid = useMemo(() => uuidv4(), []);

  const myNpub = useMemo(() => nip19.npubEncode(myPubKey), [myPubKey]);

  useEffect(() => {
    if (!myPubKey) {
      return;
    }

    const newPool = new WebRtcPool(follows, new PeerId(myNpub, uuid));

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
  }, [follows, myNpub]);

  return (
    <div className="flex flex-1 w-full max-w-[768px] flex-col p-4 md:p-8 prose mx-auto">
      <h1>WebRTC online users</h1>
      <div className="flex flex-col gap-4">
        {Array.from(onlineUsers.keys()).map((user) => {
          const peerId = PeerId.fromString(user);
          const animalName = AnimalName(peerId.toString());
          const description =
            user === new PeerId(myNpub, uuid).toString() ? `${animalName} (this session)` : `${animalName}`;
          return <UserRow key={user} pubKey={peerId.npub} description={description} />;
        })}
      </div>
      {onlineUsers.size === 0 && <div>No online users</div>}
    </div>
  );
}
