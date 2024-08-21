import { useEffect, useState } from 'react';

import PeerConnection from '@/pages/online/connection';
import { Avatar } from '@/shared/components/user/Avatar';
import { Name } from '@/shared/components/user/Name';

export function UserRow({
  pubKey,
  description,
  connection,
  isCurrentUser,
}: {
  pubKey: string;
  description?: string;
  connection?: PeerConnection;
  isCurrentUser: boolean;
}) {
  const [connectionStatus, setConnectionStatus] = useState(
    connection?.peerConnection.connectionState || 'No connection',
  );

  useEffect(() => {
    const handleConnectionStateChange = () => {
      setConnectionStatus(connection?.peerConnection.connectionState || 'No connection');
    };

    connection?.peerConnection.addEventListener(
      'connectionstatechange',
      handleConnectionStateChange,
    );

    // Cleanup event listener on unmount
    return () => {
      connection?.peerConnection.removeEventListener(
        'connectionstatechange',
        handleConnectionStateChange,
      );
    };
  }, [connection]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
      case 'failed':
        return 'bg-red-500';
      case 'connecting':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File:', file);
    if (file && connection) {
      console.log('Sending file:', file);
      connection.sendFile(file);
    } else {
      console.error('No file or connection');
    }
  };

  return (
    <div className="flex flex-row items-center gap-2 justify-between">
      <div className="flex items-center gap-2 flex-row">
        <Avatar pubKey={pubKey} />
        <Name pubKey={pubKey} />
      </div>
      <span className="text-base-content">{description}</span>
      {connectionStatus === 'connected' && (
        <>
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id={`file-input-${pubKey}`}
          />
          <label htmlFor={`file-input-${pubKey}`} className="btn btn-primary">
            Send File
          </label>
        </>
      )}
      {!isCurrentUser && <span className={`badge ${getStatusColor(connectionStatus)}`}></span>}
    </div>
  );
}
