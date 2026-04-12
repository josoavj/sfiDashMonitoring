import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from './auth-context'
import WebSocketContext from './websocket-context'
const isDev = import.meta.env.DEV

export const WebSocketProvider = ({ children }) => {
    const { user } = useAuth()
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        const token = user?.accessToken || localStorage.getItem("accessToken");

        // Cleanup d'une ancienne connexion si le token change
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setConnected(false);
        }

        if (!token) {
            if (isDev) {
                console.warn("❌ Aucun token => WebSocket non connectée");
            }
            return;
        }

        // 🔌 Connexion Socket.IO
        const wsUrl = import.meta.env.VITE_BACKEND_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001'
        if (isDev) {
            console.log('[WebSocketContext] Tentative de connexion à:', wsUrl)
        }
        const socket = io(wsUrl, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            if (isDev) {
                console.log("✅ WebSocket connectée !", socket.id);
            }
            setConnected(true);
        });

        socket.on("disconnect", (reason) => {
            if (isDev) {
                console.warn("⚠️ WebSocket déconnectée:", reason);
            }
            setConnected(false);
        });

        socket.on("connect_error", (err) => {
            console.error("❌ WebSocket erreur de connexion:", err.message);
            // Le socket.io va automatiquement réessayer
        });

        // Cleanup à la fermeture de l'onglet ou du component
        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [user?.accessToken]);

    return (
        <WebSocketContext.Provider value={{ socket: socketRef.current, connected }}>
            {children}
        </WebSocketContext.Provider>
    );
};
