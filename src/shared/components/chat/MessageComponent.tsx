import { RiDeleteBinLine } from '@remixicon/react';
import { publicState } from 'irisdb-nostr';

import { ChatMessage } from '@/shared/components/chat/Chat.tsx';
import { RelativeTime } from '@/shared/components/RelativeTime.tsx';
import { UserRow } from '@/shared/components/user/UserRow.tsx';

export function MessageComponent({
  msg,
  path,
  isMine,
}: {
  msg: ChatMessage;
  path: string;
  isMine: boolean;
}) {
  console.log('msg', path);

  function onDelete() {
    const truncated = msg.content.length > 20 ? msg.content.slice(0, 20) + '...' : msg.content;
    if (confirm(`Delete message "${truncated}"?`)) {
      // TODO make put() handle paths beginning with "npub" so we don't need to split here
      publicState([]).get(path.split('/').slice(1).join('/')).put(null);
    }
  }

  if (!msg.content) return null;

  return (
    <div className="flex flex-col mb-4 p-2 bg-base-100 rounded-md gap-2">
      <div className="flex items-start justify-between">
        <div className="text-sm font-bold">
          <UserRow pubKey={msg.author} />
        </div>
        <div className="text-xs flex flex-row items-center gap-2">
          {isMine && (
            <span className="cursor-pointer" onClick={onDelete}>
              <RiDeleteBinLine className="w-4 h-4" />
            </span>
          )}
          <RelativeTime time={msg.time} />
        </div>
      </div>
      <div className="hidden" onClick={onDelete}></div>
      <div className="text-sm">{msg.content}</div>
    </div>
  );
}
