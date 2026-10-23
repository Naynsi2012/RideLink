import { useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io();

function App() {
  useEffect(() => {
    const handleMessage = (msg) => {
      console.log("Message received:", msg);
    };

    const handleConnect = () => {
      console.log("Connected:", socket.id);
    };

    socket.on("chat message", handleMessage);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("chat message", handleMessage);
      socket.off("connect", handleConnect);
    };
  }, []);

  const sendMessage = () => {
    socket.emit("chat message", "Hello");
  };

  return (
    <div className="bg-[#111] h-screen">
      <button
        className="bg-[#aaa] rounded-md px-2 py-1 text-sm mt-5 ml-5"
        onClick={sendMessage}
      >
        Send Message
      </button>
    </div>
  );
}

export default App;
