import React, { useState, useEffect, useRef } from 'react';
import { Search, Activity, Shield, AlertCircle, RefreshCw, Clock, Zap, Wifi, WifiOff, Volume2, VolumeX, TrendingUp, Network, Lock, Globe, BarChart3, Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import io from 'socket.io-client';

// --- Configuration ---
const API_URL = 'http://localhost:3001/api';
const WS_URL = 'http://localhost:3001';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// --- Fonctions Utilitaires ---

// Helper pour formater les octets (utilisé dans les graphiques et stats)
const formatBytes = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return 'N/A';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper pour formater les bits par seconde (utilisé dans les graphiques)
const formatBps = (bytes, seconds = 60) => {
    const bps = bytes / seconds;
    if (bps === 0 || isNaN(bps)) return '0 bps';
    const k = 1000;
    const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
    const i = Math.floor(Math.log(bps * 8) / Math.log(k));
    return parseFloat(((bps * 8) / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper pour formater les timestamps (utilisé dans les graphiques)
const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const diff = new Date() - date;

    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString('fr-FR');
};

// Helper pour le statut Elasticsearch
const getHealthStatus = (status) => {
    switch (status) {
        case 'green': return 'bg-green-900/50 text-green-400';
        case 'yellow': return 'bg-yellow-900/50 text-yellow-400';
        case 'red': return 'bg-red-900/50 text-red-400';
        default: return 'bg-slate-700/50 text-slate-400';
    }
};

// --- Composant principal ---
export default function FortigateMonitor() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [bandwidth, setBandwidth] = useState([]); // Assumer un tableau pour le graphique
    const [topBandwidth, setTopBandwidth] = useState([]);
    const [protocols, setProtocols] = useState([]);
    const [securityEvents, setSecurityEvents] = useState([]);
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
    const containerRef = useRef(null); // Pour le défilement automatique

    // Effet pour le WebSocket et les Logs en temps réel
    useEffect(() => {
        // ... (Votre logique WebSocket existante)
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
            setLogs(data.logs);
        });

        socket.on('new-logs', (data) => {
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

    // Effet pour l'intervalle de streaming
    useEffect(() => {
        if (socketRef.current && wsConnected) {
            socketRef.current.emit('change-interval', streamInterval);
        }
    }, [streamInterval, wsConnected]);

    // Logique pour le défilement automatique des logs (si logs est actif)
    useEffect(() => {
        if (activeTab === 'logs' && containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [logs, activeTab]);

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
        setLoading(true);

        try {
            const [healthRes, statsRes, bandwidthRes, topBwRes, protocolsRes, securityRes] = await Promise.all([
                fetch(`${API_URL}/health`),
                fetch(`${API_URL}/stats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: range }) }),
                fetch(`${API_URL}/bandwidth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: range, interval: '5m' }) }),
                fetch(`${API_URL}/top-bandwidth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: range, size: 10 }) }),
                fetch(`${API_URL}/protocols`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: range }) }),
                fetch(`${API_URL}/security-events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: range }) })
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
            setBandwidth(bandwidthData.buckets || []); // Assurer que c'est un tableau de buckets
            setTopBandwidth(topBwData.buckets || []);
            setProtocols(protocolsData.buckets || []);
            setSecurityEvents(securityData.buckets || []);
        } catch (error) {
            console.error('Erreur fetch metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllMetrics();
        const interval = setInterval(fetchAllMetrics, 30000);
        return () => clearInterval(interval);
    }, [timeRange]);

    const handleSearch = async () => {
        setLoading(true);
        // ... (Logique de recherche)
        setLoading(false);
    };

    // Composant de carte KPI réutilisable
    const KPICard = ({ title, value, icon: Icon, colorClass, subText }) => (
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-2xl transition-all duration-300 hover:border-blue-500/50">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <p className={`text-3xl font-extrabold mt-1 ${colorClass}`}>{value}</p>
                </div>
                <Icon className={`w-8 h-8 ${colorClass} opacity-30`} />
            </div>
            {subText && <p className="text-xs text-slate-500 mt-2 truncate">{subText}</p>}
        </div>
    );

    // Composant pour l'affichage des logs
    const LogItem = ({ log }) => {
        const source = log._source;
        const level = source.logtype || 'unknown';

        let color, icon = Activity;

        if (level.includes('attack')) {
            color = 'text-red-400 bg-red-900/20 border-red-800/50';
            icon = AlertCircle;
        } else if (level.includes('event')) {
            color = 'text-yellow-400 bg-yellow-900/20 border-yellow-800/50';
            icon = Zap;
        } else {
            color = 'text-blue-400 bg-blue-900/20 border-blue-800/50';
            icon = Activity;
        }

        return (
            <div className={`p-3 rounded-lg border flex items-start space-x-3 ${color} hover:bg-slate-700/50 transition-colors`}>
                <icon className="w-4 h-4 mt-1 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="font-semibold truncate">{source.msg || source.logid}</span>
                        <span className="flex-shrink-0">{formatTimestamp(source['@timestamp'])}</span>
                    </div>
                    <div className="text-xs font-mono mt-1 text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                        Src: <span className="text-cyan-300">{source.srcip}</span> Dst: <span className="text-pink-300">{source.dstip}</span> | Policy: {source.policyid}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
            <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmi87eifTRAMUKfj8LZjHAY4ktjyx3krBSl+zPLaizsIG2W57OqiUBELTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBQ==" />

            {/* HEADER ET CONTROLES */}
            <header className="mb-8 border-b border-slate-700 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Shield className="w-12 h-12 text-blue-500 flex-shrink-0" />
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Fortigate Monitor <span className="text-blue-500">Analytics</span></h1>
                            <p className="text-slate-400 text-sm">Tableau de bord de sécurité et de performance en temps réel</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Status WS */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                            wsConnected ? 'bg-green-700/30 text-green-300' : 'bg-red-700/30 text-red-300'
                        }`}>
                            {wsConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                            {wsConnected ? 'LIVE' : 'OFFLINE'}
                        </div>

                        {/* Status Health Elasticsearch */}
                        {health && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${getHealthStatus(health.cluster?.status)}`}>
                                <Activity className="w-4 h-4" />
                                ES: {health.cluster?.status?.toUpperCase() || 'N/A'}
                            </div>
                        )}

                        {/* Notification Sound Toggle */}
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2 rounded-full transition-colors ${soundEnabled ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                            title="Toggle notification sound"
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Time Range & Refresh */}
                <div className="flex items-center gap-4 mt-4">
                    <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    {['15m', '1h', '6h', '24h', '7d'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                timeRange === range ? 'bg-blue-600 font-semibold' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                    <button onClick={fetchAllMetrics} disabled={loading} className="ml-auto px-4 py-1 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center gap-2 transition-opacity disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {loading ? 'Chargement...' : 'Actualiser'}
                    </button>
                </div>
            </header>

            {/* TABS DE NAVIGATION */}
            <div className="flex gap-2 mb-8 overflow-x-auto border-b border-slate-700">
                {[
                    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
                    { id: 'bandwidth', label: 'Bande Passante', icon: TrendingUp },
                    { id: 'security', label: 'Sécurité', icon: Lock },
                    { id: 'network', label: 'Réseau & Top Talkers', icon: Network },
                    { id: 'logs', label: 'Logs Live', icon: Activity }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-t-lg whitespace-nowrap text-sm font-semibold transition-colors ${
                            activeTab === tab.id
                                ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500'
                                : 'text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENU BASÉ SUR L'ONGLET ACTIF */}

            {/* Onglet: Vue d'ensemble (Overview) */}
            {activeTab === 'overview' && stats && (
                <div className="space-y-8">
                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KPICard
                            title="Logs Totaux"
                            value={stats.totalLogs?.toLocaleString() || 'N/A'}
                            icon={Activity}
                            colorClass="text-blue-400"
                            subText={`Logs reçus durant les ${timeRange}`}
                        />
                        <KPICard
                            title="Trafic Bloqué"
                            value={stats.blockedTraffic?.toLocaleString() || 'N/A'}
                            icon={AlertCircle}
                            colorClass="text-red-400"
                            subText={`Trafic bloqué par le Fortigate`}
                        />
                        <KPICard
                            title="Top Source"
                            value={stats.topSources?.[0]?.key || 'N/A'}
                            icon={Globe}
                            colorClass="text-green-400"
                            subText={`Volume: ${stats.topSources?.[0]?.doc_count.toLocaleString() || 'N/A'}`}
                        />
                        <KPICard
                            title="Top Destination"
                            value={stats.topDestinations?.[0]?.key || 'N/A'}
                            icon={Globe}
                            colorClass="text-indigo-400"
                            subText={`Volume: ${stats.topDestinations?.[0]?.doc_count.toLocaleString() || 'N/A'}`}
                        />
                    </div>

                    {/* GRAPHIQUES OVERVIEW */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Graphique 1: Événements de Sécurité (Pie Chart) */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                            <h3 className="text-xl font-semibold mb-4 text-blue-300">Événements de Sécurité</h3>
                            {securityEvents.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={securityEvents.map(d => ({ key: d.key, doc_count: d.doc_count || 0 }))}
                                            dataKey="doc_count"
                                            nameKey="key"
                                            cx="50%" cy="50%" outerRadius={100} fill="#8884d8"
                                            labelLine={false}
                                            label={({ key, percent }) => `${key} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {securityEvents.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => value.toLocaleString()} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-slate-500 text-center py-10">Chargement ou aucune donnée de sécurité disponible.</p>
                            )}
                        </div>

                        {/* Graphique 2: Protocoles Dominants (Bar Chart) */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                            <h3 className="text-xl font-semibold mb-4 text-green-300">Protocoles par Volume</h3>
                            {protocols.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={protocols.map(d => ({ key: d.key, doc_count: d.doc_count || 0 }))} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis type="number" stroke="#94a3b8" tickFormatter={formatBytes} />
                                        <YAxis dataKey="key" type="category" stroke="#94a3b8" width={80} />
                                        <Tooltip formatter={(value) => formatBytes(value)} />
                                        <Legend />
                                        <Bar dataKey="doc_count" fill="#10b981" name="Volume Total" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-slate-500 text-center py-10">Chargement ou aucune donnée de protocole disponible.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Onglet: Bande Passante (Bandwidth) */}
            {activeTab === 'bandwidth' && (
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold mb-4 text-blue-400 flex items-center gap-2"><TrendingUp className="w-6 h-6" /> Évolution de la Bande Passante</h2>

                    {/* Graphique de l'évolution du trafic */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
                        <h3 className="text-xl font-semibold mb-4">Trafic global (Traffic/s)</h3>
                        {bandwidth.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={bandwidth.map(d => ({ time: d.key_as_string, total_bytes: d.doc_count / 300 }))} // Doc_count / 5min (300s) pour obtenir un taux/seconde
                                           margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="time" stroke="#94a3b8" tickFormatter={formatTimestamp} />
                                    <YAxis stroke="#94a3b8" tickFormatter={(value) => formatBps(value)} />
                                    <Tooltip labelFormatter={formatTimestamp} formatter={(value) => [formatBps(value), 'Trafic estimé']} />
                                    <Area type="monotone" dataKey="total_bytes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTraffic)" name="Trafic (bytes/s)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-slate-500 text-center py-10">Chargement ou aucune donnée de bande passante disponible.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Onglet: Logs Live */}
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="flex gap-4">
                        <div className="flex flex-grow items-center bg-slate-800 rounded-lg border border-slate-700 p-3">
                            <Search className="w-5 h-5 text-slate-400 mr-3" />
                            <input
                                type="text"
                                placeholder="Rechercher des logs (par ex: srcip:192.168.1.1)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent flex-grow outline-none text-white placeholder-slate-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-opacity disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rechercher'}
                        </button>
                    </div>

                    <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-bold text-blue-300 flex items-center gap-2">
                            Logs en Temps Réel <Activity className="w-5 h-5" />
                        </h3>
                        <div className="text-sm text-slate-400">
                            Total reçus: <span className="font-bold text-white">{totalReceived}</span> | Affichés: <span className="font-bold text-white">{logs.length}</span>
                            {newLogsCount > 0 && <span className="ml-3 px-2 py-0.5 bg-green-600/50 rounded text-green-300 text-xs font-bold animate-pulse">+{newLogsCount} Nouveaux</span>}
                        </div>
                    </div>

                    {/* Log List */}
                    <div ref={containerRef} className="bg-slate-900 border border-slate-700 rounded-xl overflow-y-scroll h-[70vh] p-4">
                        <div className="space-y-3">
                            {logs.length > 0 ? (
                                logs.map((log, idx) => (
                                    <LogItem key={log._id || idx} log={log} />
                                ))
                            ) : (
                                <div className="text-center py-20 text-slate-500">
                                    {loading ? <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" /> : <p>Aucun log trouvé ou la connexion n'est pas établie.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Onglets Vides (Placeholders) */}
            {['security', 'network'].includes(activeTab) && (
                <div className="text-center py-20 bg-slate-800 rounded-xl border border-slate-700">
                    <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Onglet {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                    <p className="text-slate-400">Contenu à implémenter : Graphiques de top talkers, géolocalisation ou cartes de menaces.</p>
                </div>
            )}
        </div>
    );
}