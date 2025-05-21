import { io } from "socket.io-client";

export const initSocket = async () => {
  // console.log('socket init');
  const options = {
    "force new connection": true,
    reconnectionAttempt: Infinity,
    timeout: 100000000,
    transports: ["websocket"],
  };
  
  return io(process.env.REACT_APP_BACKEND_URL, options);
};
