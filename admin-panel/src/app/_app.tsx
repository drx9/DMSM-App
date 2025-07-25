import { useEffect } from 'react';
import { connectSocket, joinRoom, disconnectSocket } from '../services/socketService';

function MyApp({ Component, pageProps }: { Component: any; pageProps: any }) {
  useEffect(() => {
    connectSocket();
    joinRoom('role_admin');
    return () => {
      disconnectSocket();
    };
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp; 