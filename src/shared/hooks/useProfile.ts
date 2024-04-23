import { NDKUserProfile } from '@nostr-dev-kit/ndk';
import { ndk, PublicKey } from 'irisdb-nostr';
import { useEffect, useMemo, useState } from 'react';

export default function useProfile(pubKey?: string) {
  const [profile, setProfile] = useState<NDKUserProfile | null>(null);

  const pubKeyHex = useMemo(() => {
    if (!pubKey) {
      return '';
    }
    return new PublicKey(pubKey).toString();
  }, [pubKey]);

  useEffect(() => {
    if (!pubKeyHex) {
      return;
    }
    const user = ndk().getUser({ pubkey: pubKeyHex });
    user.fetchProfile().then((profile) => {
      if (profile) {
        setProfile(profile);
      }
    });
  }, [pubKeyHex]);

  return profile;
}
