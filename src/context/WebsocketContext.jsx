import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            console.warn("❌ Aucun token => WebSocket non connectée");
            return;
        }

        // 🔌 Connexion Socket.IO
        const socket = io(import.meta.env.VITE_BACKEND_WS_URL || "http://localhost:3001", {
            auth: { token },
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("🔌 WebSocket connectée !");
            setConnected(true);
        });

        socket.on("disconnect", () => {
            console.log("❌ WebSocket déconnectée");
            setConnected(false);
        });

        socket.on("connect_error", (err) => {
            console.error("⚠️ WebSocket error:", err.message);
        });

        // Cleanup à la fermeture de l'onglet ou du component
        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ socket: socketRef.current, connected }}>
            {children}
        </WebSocketContext.Provider>
    );
};
