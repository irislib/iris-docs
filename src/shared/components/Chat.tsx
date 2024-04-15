import { useAuthors, useLocalState } from 'irisdb-hooks';
import { publicState } from 'irisdb-nostr';
import { useEffect, useState } from 'react';

import { RelativeTime } from '@/shared/components/RelativeTime.tsx';
import { UserRow } from '@/shared/components/user/UserRow.tsx';

type Message = {
  author: string;
  time: number;
  content: string;
};

function MessageComponent({ msg, key }: { msg: Message; key: string }) {
  function onDelete() {
    publicState([]).get(key).put(null);
  }

  return (
    <div className="flex flex-col mb-4 p-2 bg-neutral rounded-md">
      <div className="flex items-start justify-between">
        <div className="text-sm font-bold">
          <UserRow pubKey={msg.author} />
        </div>
        <div className="text-xs">
          <RelativeTime time={msg.time} />
        </div>
      </div>
      <div className="hidden" onClick={onDelete}></div>
      <div className="text-sm">{msg.content}</div>
    </div>
  );
}

export default function Chat({ path }: { path: string }) {
  const [myPubKey] = useLocalState('user/publicKey', '');
  const [messages, setMessages] = useState<Map<string, Message>>(new Map());
  const [newMessage, setNewMessage] = useState('');

  const authors = useAuthors('follows');

  useEffect(() => {
    if (!myPubKey) return;
    return publicState(authors)
      .get(path)
      .forEach((msg, key, updatedAt) => {
        if (!updatedAt) return;
        const author = key.split('/')[0];
        const content = String(msg);
        console.log('key', key, 'msg', msg);
        setMessages((prev) => new Map(prev.set(key, { author, time: updatedAt, content })));
      });
  }, [myPubKey, authors, path]);

  if (!myPubKey) {
    return <div className="flex items-center justify-center h-full">Please sign in to chat.</div>;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage) return;
    publicState(authors).get(`${path}/${Date.now()}`).put(newMessage);
    setNewMessage('');
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <form className="flex items-center" onSubmit={onSubmit}>
        <input
          type="text"
          className="input input-primary flex-grow mr-2"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button className="btn btn-primary">Send</button>
      </form>
      <div className="flex-grow overflow-y-auto gap-2">
        {Array.from(messages.entries())
          .sort((a, b) => b[1].time - a[1].time)
          .map((msg) => (
            <MessageComponent key={msg[0]} msg={msg[1]} />
          ))}
      </div>
    </div>
  );
}
