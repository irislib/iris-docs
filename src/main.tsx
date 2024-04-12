import ReactDOM from 'react-dom/client';

import { App } from '@/app';
import config from '@/config.json';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

document.title = config.appTitle;
