import { RiArrowLeftLine } from '@remixicon/react';
import classNames from 'classnames';
import { useAuthors, usePublicState } from 'irisdb-hooks';
import { Link, useParams } from 'react-router-dom';

import Chat from '@/shared/components/chat/Chat.tsx';

function ChatList() {
  const { id } = useParams();
  const authors = useAuthors('follows');
  const [chats] = usePublicState(authors, 'apps/chat/chats', {});

  return (
    <div className="flex flex-col bg-base-100 h-full border-r border-r-base-300">
      {Object.keys(chats).map((chatId) => (
        <Link
          key={chatId}
          to={`/chat/${chatId}`}
          className={classNames('text-lg px-4 py-2', {
            'font-bold': id === chatId,
            'bg-base-200': id === chatId,
            'hover:bg-base-200': id !== chatId,
          })}
        >
          #{chatId}
        </Link>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const { id } = useParams();

  return (
    <div className="flex flex-row flex-1">
      <div className={classNames('md:flex w-60 flex-col gap-4', { hidden: !!id })}>
        <ChatList />
      </div>
      {id && (
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex flex-row gap-2 items-center justify-between">
            <Link to={`/chat`} className="text-lg md:hidden p-2">
              <RiArrowLeftLine className="w-6 h-6" />
            </Link>
            <div className="text-2xl font-bold">#{id || ''}</div>
          </div>
          <Chat path={`apps/chat/chats/${id}/messages`} />
        </div>
      )}
    </div>
  );
}
