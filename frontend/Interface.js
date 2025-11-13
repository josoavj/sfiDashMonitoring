import React, { useState, useEffect, useRef } from 'react';
import { Search, Activity, Shield, AlertCircle, RefreshCw, Clock, Zap, Wifi, WifiOff, Volume2, VolumeX, TrendingUp, Network, Lock, Globe, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { io } from 'socket.io-client';

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
            setWsConnected(true);
            socket.emit('request-initial-logs', { timeRange, size: 50 });
        });

        socket.on('disconnect', () => setWsConnected(false));

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
            <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmi87eifTRAMUKfj8LZjHAY4ktjyx3krBSl+zPLaizsIG2W57OqiUBELTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBSh+zPDaizsIG2S57OmiUxEKTKXh8bllHgU2jdXzzn0vBQ==" />

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

                {/* Time Range Selector */}
                <div className="flex gap-2 mt-4">
                    <Clock className="w-5 h-5 text-slate-400 mt-1" />
                    {['15m', '1h', '6h', '24h', '7d'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1 rounded ${
                                timeRange === range ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                    <button
                        onClick={fetchAllMetrics}
                        className="ml-auto flex items-center gap-2 px-4 py-1 bg-slate-700 hover:bg-slate-600 rounded"
                    >
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
                            activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-slate-400">Total Traffic</h3>
                                <Globe className="w-5 h-5 text-blue-400" />
                            </div>
                            <p className="text-2xl font-bold">{formatBytes(bandwidth?.total || 0)}</p>
                            <p className="text-xs text-slate-500 mt-1">{formatBps(bandwidth?.total || 0, 3600)}</p>
                        </div>

                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-slate-400">Logs Actifs</h3>
                                <Activity className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-2xl font-bold">{logs.length}</p>
                            <p className="text-xs text-slate-500 mt-1">{totalReceived} reçus</p>
                        </div>

                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-slate-400">Connexions Bloquées</h3>
                                <Lock className="w-5 h-5 text-red-400" />
                            </div>
                            <p className="text-2xl font-bold">{securityEvents?.denied || 0}</p>
                            <p className="text-xs text-slate-500 mt-1">Menaces détectées</p>
                        </div>

                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-slate-400">Connexions Autorisées</h3>
                                <Shield className="w-5 h-5 text-green-400" />
                            </div>
                            <p className="text-2xl font-bold">{securityEvents?.allowed || 0}</p>
                            <p className="text-xs text-slate-500 mt-1">Trafic légitime</p>
                        </div>
                    </div>

                    {/* Actions Chart */}
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Actions Firewall</h3>
                        {securityEvents?.actions && securityEvents.actions.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={securityEvents.actions}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="key" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                    <Bar dataKey="doc_count" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-400">
                                Aucune donnée disponible
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bandwidth Tab */}
            {activeTab === 'bandwidth' && (
                <div className="space-y-6">
                    {/* Bandwidth Timeline */}
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Bande Passante dans le Temps</h3>
                        {bandwidth?.timeline && bandwidth.timeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={bandwidth.timeline.map(b => ({
                                    time: new Date(b.key).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                    bytes: (b.total_bytes?.value || 0) / 1024 / 1024
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="time" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" label={{ value: 'MB', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                    <Area type="monotone" dataKey="bytes" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-400">
                                Aucune donnée de bande passante
                            </div>
                        )}
                    </div>

                    {/* Top Bandwidth Consumers */}
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Top 10 Consommateurs de Bande Passante</h3>
                        {topBandwidth && topBandwidth.length > 0 ? (
                            <div className="space-y-3">
                                {topBandwidth.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-bold text-slate-500">{idx + 1}</span>
                                            <div>
                                                <p className="font-mono text-blue-400">{item.key}</p>
                                                <p className="text-xs text-slate-400">{item.connection_count?.value || 0} connexions</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">{formatBytes(item.total_bytes?.value || 0)}</p>
                                            <p className="text-xs text-slate-400">{formatBps((item.total_bytes?.value || 0), 3600)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-8">Aucune donnée disponible</div>
                        )}
                    </div>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Denied IPs */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                Top IPs Bloquées
                            </h3>
                            {securityEvents?.top_denied_ips && securityEvents.top_denied_ips.length > 0 ? (
                                <div className="space-y-2">
                                    {securityEvents.top_denied_ips.map((ip, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                                            <span className="font-mono text-red-400">{ip.key}</span>
                                            <span className="font-bold text-red-300">{ip.doc_count} tentatives</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 py-8">Aucune menace détectée</div>
                            )}
                        </div>

                        {/* Actions Pie Chart */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Distribution des Actions</h3>
                            {securityEvents?.actions && securityEvents.actions.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={securityEvents.actions}
                                            dataKey="doc_count"
                                            nameKey="key"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {securityEvents.actions.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    Aucune donnée
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Network Tab */}
            {activeTab === 'network' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Protocols */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Protocoles</h3>
                            {protocols?.protocols && protocols.protocols.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={protocols.protocols}
                                            dataKey="doc_count"
                                            nameKey="key"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {protocols.protocols.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    Aucune donnée de protocole
                                </div>
                            )}
                        </div>

                        {/* Top Ports */}
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">Ports les Plus Utilisés</h3>
                            {protocols?.ports && protocols.ports.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={protocols.ports.slice(0, 10)}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="key" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                        <Bar dataKey="doc_count" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-slate-400">
                                    Aucune donnée de port
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Rechercher dans les logs"
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

                    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold">Logs en Direct</h2>
                                {wsConnected && (
                                    <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                                )}
                            </div>
                            {newLogsCount > 0 && (
                                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold animate-pulse">
                  +{newLogsCount} nouveaux
                </span>
                            )}
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
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Port</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Protocole</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Action</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Bytes</th>
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
                                                <td className="px-4 py-3 text-sm text-slate-300">
                                                    {source.destination?.port || source.dstport || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-slate-700 rounded text-xs">
                              {source.network?.protocol || source.proto || '-'}
                            </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                (source.action === 'deny' || source.action === 'block' || source.action === 'drop')
                                    ? 'bg-red-900/50 text-red-300'
                                    : 'bg-green-900/50 text-green-300'
                            }`}>
                              {source.action || source.event?.action || '-'}
                            </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-400">
                                                    {formatBytes(source.network?.bytes || source.bytes || 0)}
                                                </td>
                                            </tr>
                                        );
                                    })}
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
            )}
        </div>
    );
}