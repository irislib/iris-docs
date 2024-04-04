import { NDKRelay } from '@nostr-dev-kit/ndk';
import { RiDeleteBinLine } from '@remixicon/react';
import { ndk as getNdk } from 'irisdb-nostr';
import { FormEvent, useEffect, useState } from 'react';

export function Network() {
  const ndk = getNdk();
  const [relays, setRelays] = useState(new Map(ndk.pool.relays));
  const [newRelayUrl, setNewRelayUrl] = useState('');

  useEffect(() => {
    const updateRelays = () => {
      setRelays(new Map(ndk.pool.relays));
    };
    updateRelays();
    const interval = setInterval(updateRelays, 1000);
    return () => clearInterval(interval);
  }, []);

  const addRelay = (e: FormEvent) => {
    e.preventDefault();
    let url = newRelayUrl.trim();
    if (!url) return;
    if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
      url = `wss://${url}`;
    }
    ndk.pool.addRelay(new NDKRelay(url), true);
    setNewRelayUrl('');
  };

  const removeRelay = (url: string) => {
    ndk.pool.removeRelay(url);
  };

  return (
    <div className="mb-4">
      <h2 className="text-2xl mb-4">Network</h2>
      <div className="divide-y divide-base-300">
        {Array.from(relays).map(([url, relay]) => (
          <div key={url} className="py-2 flex justify-between items-center">
            <span className="text-lg font-medium">{url.replace('wss://', '')}</span>
            <div className="flex items-center gap-4">
              <RiDeleteBinLine className="cursor-pointer" onClick={() => removeRelay(url)} />
              <span
                className={`badge ${relay.status === 1 ? 'badge-success' : 'badge-error'}`}
              ></span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <form onSubmit={addRelay}>
          <input
            type="text"
            placeholder="Add relay"
            className="input input-bordered w-full max-w-xs"
            value={newRelayUrl}
            onChange={(e) => setNewRelayUrl(e.target.value)}
          />
          <button className="btn btn-primary ml-2">Add Relay</button>
        </form>
      </div>
    </div>
  );
}
