import classNames from 'classnames';
import { useLocalState } from 'irisdb-hooks';
import { PublicKey, publicState } from 'irisdb-nostr';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { UserRow } from '@/shared/components/user/UserRow';
import { searchIndex, SearchResult } from '@/utils/socialGraph';

export const AddUserForm = ({ file }: { file: string }) => {
  const [myPubKey] = useLocalState('user/publicKey', '', String);
  const [userToAdd, setUserToAdd] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const userToAddValid = useMemo(() => {
    if (userToAdd === myPubKey) return false;
    try {
      new PublicKey(userToAdd);
      return true;
    } catch {
      return false;
    }
  }, [userToAdd, myPubKey]);

  useEffect(() => {
    if (userToAdd && !userToAddValid) {
      const results = searchIndex.search(userToAdd);
      console.log('results', results);
      setSearchResults(results.map((result) => result.item));
    } else {
      setSearchResults([]);
    }
  }, [userToAdd]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (userToAddValid) {
      publicState(myPubKey)
        .get(`${file}/writers/${new PublicKey(userToAdd).toString()}`)
        .put(true);
      setUserToAdd('');
      setSearchResults([]);
    }
  };

  // Simplified click handler directly on <li> elements
  const handleItemClick = (pubKey: string) => {
    setUserToAdd(pubKey);
    setSearchResults([]); // Clear search results after selection
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="dropdown">
        <input
          type="text"
          className={classNames('input input-bordered w-full', {
            'input-success': userToAdd && userToAddValid,
            'text-xs': !!userToAdd,
            'input-primary': userToAddValid,
          })}
          placeholder="Add people (search or paste public key)"
          value={userToAdd}
          onChange={(e) => setUserToAdd(e.target.value)}
        />
        {searchResults.length > 0 && (
          <ul className="dropdown-content menu shadow bg-base-300 rounded-box w-52 z-10 w-full">
            {searchResults.map((result) => (
              <li
                key={result.pubKey}
                className="cursor-pointer" // Add visual feedback for clickable items
                onClick={() => handleItemClick(result.pubKey)} // Simplified handler
              >
                <UserRow pubKey={result.pubKey} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {userToAdd && userToAddValid && <UserRow pubKey={userToAdd} description="Write access" />}
      <button className={classNames('btn btn-primary', { hidden: !userToAddValid })} type="submit">
        Add write access
      </button>
    </form>
  );
};
