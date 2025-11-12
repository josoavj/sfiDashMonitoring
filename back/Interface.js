import React, { useState, useEffect, useRef } from 'react';
import { Search, Activity, Shield, AlertCircle, RefreshCw, Clock, Zap, Wifi, WifiOff, Volume2, VolumeX } from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
const WS_URL = 'http://localhost:3001';

export default function FortigateMonitor() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [topSources, setTopSources] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('15m');
    const [health, setHealth] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [newLogsCount, setNewLogsCount] = useState(0);
    const [totalReceived, setTotalReceived] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [streamInterval, setStreamInterval] = useState(2);

    const socketRef = useRef(null);
    const audioRef = useRef(null);
    const logsEndRef = useRef(null);

    // Initialisation WebSocket
    useEffect(() => {
        const socket = io(WS_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        });

        socketRef.current = socket;

        // Événements WebSocket
        socket.on('connect', () => {
            console.log('✅ WebSocket connecté');
            setWsConnected(true);
            socket.emit('request-initial-logs', { timeRange, size: 100 });
        });

        socket.on('disconnect', () => {
            console.log('❌ WebSocket déconnecté');
            setWsConnected(false);
        });

        socket.on('connected', (data) => {
            console.log('📡', data.message);
        });

        socket.on('initial-logs', (data) => {
            console.log(`📥 ${data.logs.length} logs initiaux reçus`);
            setLogs(data.logs);
        });

        socket.on('new-logs', (data) => {
            console.log(`🆕 ${data.count} nouveaux logs`);
            setLogs(prevLogs => {
                const newLogs = [...data.logs, ...prevLogs].slice(0, 200);
                return newLogs;
            });
            setNewLogsCount(data.count);
            setTotalReceived(prev => prev + data.count);

            // Son de notification
            if (soundEnabled && audioRef.current) {
                audioRef.current.play().catch(e => console.log('Audio play error:', e));
            }

            // Reset animation
            setTimeout(() => setNewLogsCount(0), 2000);
        });

        socket.on('error', (error) => {
            console.error('Erreur WebSocket:', error);
        });

        // Cleanup
        return () => {
            socket.disconnect();
        };
    }, [timeRange, soundEnabled]);

    // Changer l'intervalle de streaming
    useEffect(() => {
        if (socketRef.current && wsConnected) {
            socketRef.current.emit('change-interval', streamInterval);
        }
    }, [streamInterval, wsConnected]);

    const fetchHealth = async () => {
        try {
            const res = await fetch(`${API_URL}/health`);
            const data = await res.json();
            setHealth(data);
        } catch (err) {
            console.error('Erreur health:', err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeRange: getTimeRange(timeRange)
                })
            });
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Erreur stats:', err);
        }
    };

    const fetchTopSources = async () => {
        try {
            const res = await fetch(`${API_URL}/top-sources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeRange: getTimeRange(timeRange),
                    size: 5
                })
            });
            const data = await res.json();
            setTopSources(data);
        } catch (err) {
            console.error('Erreur top sources:', err);
        }
    };

    const getTimeRange = (range) => {
        const now = new Date();
        const ranges = {
            '15m': 15 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000
        };
        return {
            from: new Date(now - ranges[range]).toISOString(),
            to: now.toISOString()
        };
    };

    useEffect(() => {
        fetchHealth();
        fetchStats();
        fetchTopSources();

        const interval = setInterval(() => {
            fetchHealth();
            fetchStats();
            fetchTopSources();
        }, 30000);

        return () => clearInterval(interval);
    }, [timeRange]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: searchQuery || '*',
                    size: 100,
                    timeRange: getTimeRange(timeRange)
                })
            });
            const data = await res.json();
            setLogs(data.hits || []);
        } catch (err) {
            console.error('Erreur recherche:', err);
        }
        setLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return date.toLocaleString('fr-FR');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            {/* Audio pour notifications */}
            <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmi87eifTRAMUKfj8LZjHAY4ktjyx3krBSl+zPLaizsIG2W57OqiUBELTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBQ==" />

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Shield className="w-10 h-10 text-blue-400" />
                        <div>
                            <h1 className="text-3xl font-bold">Fortigate Monitor</h1>
                            <p className="text-slate-400">Surveillance WebSocket en temps réel</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Statut WebSocket */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                            wsConnected
                                ? 'bg-green-900/50 text-green-400'
                                : 'bg-red-900/50 text-red-400'
                        }`}>
                            {wsConnected ? (
                                <>
                                    <Wifi className="w-5 h-5" />
                                    <span className="font-semibold">CONNECTÉ</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-5 h-5" />
                                    <span className="font-semibold">DÉCONNECTÉ</span>
                                </>
                            )}
                        </div>

                        {/* Contrôle du son */}
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-3 rounded-lg ${
                                soundEnabled
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                            title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
                        >
                            {soundEnabled ? (
                                <Volume2 className="w-5 h-5" />
                            ) : (
                                <VolumeX className="w-5 h-5" />
                            )}
                        </button>

                        {/* Santé du cluster */}
                        {health && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                                health.cluster?.status === 'green'
                                    ? 'bg-green-900/50 text-green-400'
                                    : 'bg-red-900/50 text-red-400'
                            }`}>
                                <Activity className="w-5 h-5" />
                                <span className="font-semibold">{health.cluster?.status}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Indicateurs temps réel */}
                {wsConnected && (
                    <div className="mt-4 flex gap-4 flex-wrap">
                        <div className="flex items-center gap-2 text-sm">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
                            <span className="text-slate-300">Streaming actif</span>
                        </div>

                        <div className="text-sm text-slate-400">
                            <span className="font-semibold text-blue-400">{totalReceived}</span> logs reçus
                        </div>

                        {newLogsCount > 0 && (
                            <div className="text-sm">
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full font-semibold animate-pulse">
                  +{newLogsCount} nouveaux
                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-400">Intervalle:</span>
                            <select
                                value={streamInterval}
                                onChange={(e) => setStreamInterval(Number(e.target.value))}
                                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                            >
                                <option value={1}>1s</option>
                                <option value={2}>2s</option>
                                <option value={5}>5s</option>
                                <option value={10}>10s</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Barre de recherche */}
            <div className="mb-6">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Rechercher (désactive le WebSocket temporairement)"
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                        <Search className="w-5 h-5" />
                        Rechercher
                    </button>
                </div>

                <div className="flex gap-2 mt-3">
                    <Clock className="w-5 h-5 text-slate-400 mt-1" />
                    {['15m', '1h', '24h', '7d'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1 rounded ${
                                timeRange === range
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-300">Logs actifs</h3>
                        <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold">{logs.length}</p>
                    <p className="text-xs text-slate-400 mt-2">Mis à jour en temps réel</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-300">Actions</h3>
                        <AlertCircle className="w-6 h-6 text-yellow-400" />
                    </div>
                    {stats?.stats?.event_action && stats.stats.event_action.length > 0 && (
                        <div className="space-y-2">
                            {stats.stats.event_action.slice(0, 3).map((item) => (
                                <div key={item.key} className="flex justify-between text-sm">
                                    <span className="text-slate-400">{item.key}</span>
                                    <span className="font-semibold">{item.doc_count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-300">Top Sources</h3>
                        <Shield className="w-6 h-6 text-red-400" />
                    </div>
                    {topSources.length > 0 && (
                        <div className="space-y-2">
                            {topSources.slice(0, 3).map((item) => (
                                <div key={item.key} className="flex justify-between text-sm">
                                    <span className="text-slate-400 truncate">{item.key}</span>
                                    <span className="font-semibold">{item.doc_count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Table des logs */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">Logs en direct</h2>
                        {wsConnected && (
                            <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
                        )}
                    </div>
                    <button
                        onClick={scrollToBottom}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                    >
                        Aller au bas
                    </button>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                            Chargement...
                        </div>
                    ) : logs.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-slate-900 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Timestamp</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Source</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Destination</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Action</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Message</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                            {logs.map((log, idx) => {
                                const source = log._source || {};
                                const isNew = idx < newLogsCount;
                                return (
                                    <tr
                                        key={log._id || idx}
                                        className={`hover:bg-slate-700/50 transition-all ${
                                            isNew ? 'bg-green-900/20 animate-pulse' : ''
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                                            {formatTimestamp(source['@timestamp'])}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-mono text-blue-400">
                                            {source.source?.ip || source.srcip || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-mono text-green-400">
                                            {source.destination?.ip || source.dstip || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            (source.action === 'deny' || source.action === 'block')
                                ? 'bg-red-900/50 text-red-300'
                                : 'bg-green-900/50 text-green-300'
                        }`}>
                          {source.action || source.event?.action || '-'}
                        </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-400 truncate max-w-md">
                                            {source.message || JSON.stringify(source).substring(0, 100)}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr ref={logsEndRef} />
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            {wsConnected ? 'En attente de logs...' : 'Connexion WebSocket en cours...'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}