import config from '@/config.json';
import Chat from '@/shared/components/chat/Chat.tsx';

export default function () {
  return (
    <div className="prose p-4 md:p-8 max-w-[768px] mx-auto">
      <h1>
        Welcome to <code>{config.appTitle}</code>
      </h1>
      <p>
        This template is a foundation for your Iris application, providing some essential features
        and configurations to get started quickly. Decentralize everything!
      </p>
      <p>
        In the navigation menu you can find some example Iris apps. You can use them as a template
        or remove them.
      </p>
      <p>Files to edit:</p>
      <ul className="list-disc">
        <li>
          This page: <code>src/pages/create-iris/index.tsx</code>
        </li>
        <li>
          Navigation sidebar: <code>src/shared/components/NavSideBar.tsx</code>
        </li>
        <li>
          Router:
          <code>src/pages/index.tsx</code>
        </li>
      </ul>
      <p>Reference of included libraries:</p>
      <ul className="list-disc">
        <li>
          <a href="https://irisdb.iris.to" target="_blank" rel="noopener noreferrer">
            IrisDB
          </a>
          : distributed database
        </li>
        <li>
          <a href="https://github.com/nostr-dev-kit/ndk" target="_blank" rel="noopener noreferrer">
            NDK
          </a>
          : syncing data over{' '}
          <a href="https://nostr.com" target="_blank" rel="noopener noreferrer">
            Nostr
          </a>
        </li>
        <li>
          <a
            href="https://github.com/nbd-wtf/nostr-tools"
            target="_blank"
            rel="noopener noreferrer"
          >
            nostr-tools
          </a>
          : mostly used for public key formatting (nip19)
        </li>
        <li>
          <a
            href="https://tailwindcss.com/docs/installation"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tailwind
          </a>
          : CSS framework
        </li>
        <li>
          <a href="https://daisyui.com/" target="_blank" rel="noopener noreferrer">
            DaisyUI
          </a>
          : UI components & colors
        </li>
        <li>
          <a href="https://github.com/yjs/yjs" target="_blank" rel="noopener noreferrer">
            yjs
          </a>
          : collaborative text documents
        </li>
        <li>
          <a href="https://github.com/ueberdosis/tiptap" target="_blank" rel="noopener noreferrer">
            TipTap
          </a>
          : collaborative rich text documents
        </li>
        <li>
          <a href="https://remixicon.com/" target="_blank" rel="noopener noreferrer">
            Remix Icon
          </a>
          : icons
        </li>
        <li>
          <a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer">
            Vite
          </a>
          : build & development environment
        </li>
        <li>
          <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">
            React
          </a>
          : web application framework
        </li>
      </ul>
      <p>
        <a href="https://github.com/irislib/iris-docs" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </p>
      <h2>Simple chat example</h2>
      <p>
        Shows messages by you and your followed users.{' '}
        <code>src/shared/components/chat/Chat.tsx</code>
      </p>
      <p>
        <h3>#create-iris</h3>
      </p>
      <Chat path="apps/chat/chats/create-iris/messages" />
    </div>
  );
}
