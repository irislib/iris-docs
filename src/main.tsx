import { ndk } from 'irisdb-nostr';
import ReactDOM from 'react-dom/client';

import { App } from '@/app';
import config from '@/config.json';

ndk(); // init NDK & irisdb login flow

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

document.title = config.appTitle;
