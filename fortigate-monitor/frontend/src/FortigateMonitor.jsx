import React, { useState, useEffect, useRef } from 'react';
import { Search, Activity, Shield, AlertCircle, RefreshCw, Clock, Zap, Wifi, WifiOff, Volume2, VolumeX, TrendingUp, Network, Lock, Globe, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
const WS_URL = 'http://localhost:3001';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function FortigateMonitor() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [bandwidth, setBandwidth] = useState(null);
    const [topBandwidth, setTopBandwidth] = useState([]);
    const [protocols, setProtocols] = useState(null);
    const [securityEvents, setSecurityEvents] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('1h');
    const [health, setHealth] = useState(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [newLogsCount, setNewLogsCount] = useState(0);
    const [totalReceived, setTotalReceived] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [streamInterval, setStreamInterval] = useState(2);
    const [activeTab, setActiveTab] = useState('overview');

    const socketRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        const socket = io(WS_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ WebSocket connecté');
            setWsConnected(true);
            socket.emit('request-initial-logs', { timeRange, size: 50 });
        });

        socket.on('disconnect', () => {
            console.log('❌ WebSocket déconnecté');
            setWsConnected(false);
        });

        socket.on('initial-logs', (data) => {
            console.log(`📥 ${data.logs.length} logs initiaux`);
            setLogs(data.logs);
        });

        socket.on('new-logs', (data) => {
            console.log(`🆕 ${data.count} nouveaux logs`);
            setLogs(prevLogs => [...data.logs, ...prevLogs].slice(0, 200));
            setNewLogsCount(data.count);
            setTotalReceived(prev => prev + data.count);

            if (soundEnabled && audioRef.current) {
                audioRef.current.play().catch(e => console.log('Audio error:', e));
            }

            setTimeout(() => setNewLogsCount(0), 2000);
        });

        return () => socket.disconnect();
    }, [timeRange, soundEnabled]);

    useEffect(() => {
        if (socketRef.current && wsConnected) {
            socketRef.current.emit('change-interval', streamInterval);
        }
    }, [streamInterval, wsConnected]);

    const getTimeRange = () => {
        const now = new Date();
        const ranges = {
            '15m': 15 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000
        };
        return {
            from: new Date(now - ranges[timeRange]).toISOString(),
            to: now.toISOString()
        };
    };

    const fetchAllMetrics = async () => {
        const range = getTimeRange();

        try {
            const [healthRes, statsRes, bandwidthRes, topBwRes, protocolsRes, securityRes] = await Promise.all([
                fetch(`${API_URL}/health`),
                fetch(`${API_URL}/stats`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timeRange: range })
                }),
                fetch(`${API_URL}/bandwidth`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timeRange: range, interval: '5m' })
                }),
                fetch(`${API_URL}/top-bandwidth`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timeRange: range, size: 10 })
                }),
                fetch(`${API_URL}/protocols`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timeRange: range })
                }),
                fetch(`${API_URL}/security-events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ timeRange: range })
                })
            ]);

            const [healthData, statsData, bandwidthData, topBwData, protocolsData, securityData] = await Promise.all([
                healthRes.json(),
                statsRes.json(),
                bandwidthRes.json(),
                topBwRes.json(),
                protocolsRes.json(),
                securityRes.json()
            ]);

            setHealth(healthData);
            setStats(statsData);
            setBandwidth(bandwidthData);
            setTopBandwidth(topBwData);
            setProtocols(protocolsData);
            setSecurityEvents(securityData);
        } catch (error) {
            console.error('Erreur fetch metrics:', error);
        }
    };

    useEffect(() => {
        fetchAllMetrics();
        const interval = setInterval(fetchAllMetrics, 30000);
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
                    timeRange: getTimeRange()
                })
            });
            const data = await res.json();
            setLogs(data.hits || []);
        } catch (err) {
            console.error('Erreur recherche:', err);
        }
        setLoading(false);
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatBps = (bytes, seconds = 60) => {
        const bps = bytes / seconds;
        if (bps === 0) return '0 bps';
        const k = 1000;
        const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
        const i = Math.floor(Math.log(bps * 8) / Math.log(k));
        return parseFloat(((bps * 8) / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        return date.toLocaleTimeString('fr-FR');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmi87eifTRAMUKfj8LZjHAY4ktjyx3krBSl+zPLaizsIG2W57OqiUBELTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBQ==" />

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Shield className="w-10 h-10 text-blue-400" />
                        <div>
                            <h1 className="text-3xl font-bold">Fortigate Analytics</h1>
                            <p className="text-slate-400">Monitoring avancé en temps réel</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                            wsConnected ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                        }`}>
                            {wsConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                            <span className="font-semibold text-sm">{wsConnected ? 'LIVE' : 'OFF'}</span>
                        </div>

                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2 rounded-lg ${soundEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>

                        {health && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                                health.cluster?.status === 'green' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                            }`}>
                                <Activity className="w-5 h-5" />
                                <span className="font-semibold text-sm">{health.cluster?.status?.toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Time Range */}
                <div className="flex gap-2 mt-4">
                    <Clock className="w-5 h-5 text-slate-400 mt-1" />
                    {['15m', '1h', '6h', '24h', '7d'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1 rounded ${
                                timeRange === range ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                    <button onClick={fetchAllMetrics} className="ml-auto px-4 py-1 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
                    { id: 'bandwidth', label: 'Bande Passante', icon: TrendingUp },
                    { id: 'security', label: 'Sécurité', icon: Lock },
                    { id: 'network', label: 'Réseau', icon: Network },
                    { id: 'logs', label: 'Logs Live', icon: Activity }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                            activeTab === tab.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content basé sur l'onglet actif */}
            {activeTab === 'overview' && (
                <div className="text-center py-20">
                    <Shield className="w-20 h-20 mx-auto text-blue-400 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Interface de test Fortigate</h2>
                    <p className="text-slate-400">Connecté à Elasticsearch</p>
                    {health && (
                        <div className="mt-4 inline-block bg-slate-800 p-4 rounded-lg">
                            <p className="text-sm text-slate-300">Cluster: <span className="font-bold">{health.elasticsearch?.cluster_name}</span></p>
                            <p className="text-sm text-slate-300">Version: <span className="font-bold">{health.elasticsearch?.version}</span></p>
                            <p className="text-sm text-slate-300">Status: <span className="font-bold text-green-400">{health.cluster?.status}</span></p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4">Logs en temps réel</h3>
                    <p className="text-slate-400">Total reçus: {totalReceived}</p>
                    <p className="text-slate-400">Affichés: {logs.length}</p>
                    {logs.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {logs.slice(0, 10).map((log, idx) => (
                                <div key={idx} className="bg-slate-700 p-3 rounded text-sm">
                                    <pre className="text-xs overflow-x-auto">{JSON.stringify(log._source, null, 2)}</pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}