import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    const [bandwidthRealtime, setBandwidthRealtime] = useState([]);
    const [topBandwidth, setTopBandwidth] = useState([]);
    const [protocols, setProtocols] = useState(null);
    const [securityEvents, setSecurityEvents] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchPage, setSearchPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [totalHits, setTotalHits] = useState(0);
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
    const searchTimeout = useRef(null);

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
            // Seed bandwidth realtime from initial logs
            try {
                const totalByBucket = {};
                data.logs.forEach(l => {
                    const ts = l._source?.['@timestamp'] || l._source?.timestamp || new Date().toISOString();
                    const t = Math.floor(new Date(ts).getTime() / (streamInterval * 1000)) * (streamInterval * 1000);
                    const key = new Date(t).toISOString();
                    const bytes = l._source?.network?.bytes || l._source?.source?.bytes || l._source?.destination?.bytes || 0;
                    totalByBucket[key] = (totalByBucket[key] || 0) + bytes;
                });
                const seeded = Object.keys(totalByBucket).sort().map(k => ({ time: k, bytes: totalByBucket[k] }));
                if (seeded.length > 0) setBandwidthRealtime(prev => {
                    const merged = [...prev, ...seeded];
                    // keep last 120 entries
                    return merged.slice(-120);
                });
            } catch (e) { console.debug('seed bandwidth error', e); }
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
            // Update realtime bandwidth from incoming logs
            try {
                const now = Date.now();
                const bucketMs = streamInterval * 1000;
                const bucketKey = new Date(Math.floor(now / bucketMs) * bucketMs).toISOString();
                const added = data.logs.reduce((acc, l) => acc + (l._source?.network?.bytes || l._source?.source?.bytes || l._source?.destination?.bytes || 0), 0);
                if (added > 0) {
                    setBandwidthRealtime(prev => {
                        const newPrev = [...prev];
                        if (newPrev.length > 0 && newPrev[newPrev.length - 1].time === bucketKey) {
                            newPrev[newPrev.length - 1].bytes += added;
                        } else {
                            newPrev.push({ time: bucketKey, bytes: added });
                        }
                        return newPrev.slice(-120);
                    });
                }
            } catch (e) { console.debug('realtime bandwidth update error', e); }
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
        // debounce-safe search used by UI
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: searchQuery || '*',
                    size: perPage,
                    from: (searchPage - 1) * perPage,
                    timeRange: getTimeRange()
                })
            });
            const data = await res.json();
            setSearchResults(data.hits || []);
            setTotalHits(data.total || (data.hits || []).length);
        } catch (err) {
            console.error('Erreur recherche:', err);
        }
        setLoading(false);
    };

    const debouncedSearch = useCallback((q) => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setSearchPage(1);
            handleSearch();
        }, 350);
    }, [perPage, timeRange]);

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
    const bandwidthChartData = useMemo(() => {
        // Prefer realtime derived data when available
        if (bandwidthRealtime && bandwidthRealtime.length > 0) {
            return bandwidthRealtime.map(d => ({ time: d.time, bytes: d.bytes }));
        }
        // Otherwise try the API-provided bandwidth timeline
        if (bandwidth && bandwidth.timeline && Array.isArray(bandwidth.timeline)) {
            return bandwidth.timeline.map(b => ({
                time: b.key_as_string || (b.key && new Date(b.key).toISOString()) || b.time,
                bytes: (b.total_bytes && b.total_bytes.value) || b.bytes || 0
            }));
        }
        return [];
    }, [bandwidth, bandwidthRealtime]);

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
                <div className="flex gap-2 mt-4 items-center">
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: quick metrics & search */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-slate-800 p-4 rounded-lg">
                            <h3 className="font-semibold">Recherche Elasticsearch</h3>
                            <div className="mt-3 flex gap-2">
                                <input
                                    className="flex-1 bg-slate-700 px-3 py-2 rounded outline-none"
                                    placeholder="Requête (KQL / lucene) ou *"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); debouncedSearch(e.target.value); }}
                                />
                                <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 rounded">{loading ? '...' : <Search className="w-4 h-4" />}</button>
                            </div>
                            <div className="mt-3 text-sm text-slate-400 flex items-center gap-2">
                                <span>Hits: {totalHits}</span>
                                <span>Page: {searchPage}</span>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button onClick={() => { setSearchPage(p => Math.max(1, p - 1)); handleSearch(); }} className="px-2 py-1 bg-slate-700 rounded">Prev</button>
                                <button onClick={() => { setSearchPage(p => p + 1); handleSearch(); }} className="px-2 py-1 bg-slate-700 rounded">Next</button>
                                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setSearchPage(1); }} className="ml-auto bg-slate-700 px-2 py-1 rounded">
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                            <div className="mt-3 max-h-48 overflow-auto">
                                {searchResults.map((r, i) => (
                                    <div key={i} className="p-2 bg-slate-700 rounded mb-2 text-xs">
                                        <div className="font-medium">{r._index} · {formatTimestamp(r._source?.['@timestamp'] || r._source?.timestamp)}</div>
                                        <pre className="overflow-x-auto text-[11px]">{JSON.stringify(r._source, null, 2)}</pre>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-lg">
                            <h4 className="font-semibold">Statut du cluster</h4>
                            {health ? (
                                <div className="mt-2 text-sm text-slate-300">
                                    <div>Cluster: <span className="font-bold">{health.elasticsearch?.cluster_name}</span></div>
                                    <div>Version: <span className="font-bold">{health.elasticsearch?.version}</span></div>
                                    <div>Status: <span className={`font-bold ${health.cluster?.status === 'green' ? 'text-green-400' : 'text-yellow-400'}`}>{health.cluster?.status}</span></div>
                                </div>
                            ) : <div className="text-slate-400">Aucun état</div>}
                        </div>
                    </div>

                    {/* Middle: charts */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-800 p-4 rounded-lg h-64">
                            <h4 className="font-semibold mb-2">Bande passante (temps)</h4>
                            {bandwidthChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="85%">
                                    <AreaChart data={bandwidthChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorBytes" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                        <YAxis tickFormatter={(v) => formatBytes(v)} />
                                        <Tooltip formatter={(v) => formatBytes(v)} />
                                        <Area type="monotone" dataKey="bytes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBytes)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <div className="text-slate-400">Aucune donnée</div>}
                        </div>

                        <div className="bg-slate-800 p-4 rounded-lg h-64">
                            <h4 className="font-semibold mb-2">Protocoles</h4>
                            {protocols && protocols.length > 0 ? (
                                <ResponsiveContainer width="100%" height="85%">
                                    <PieChart>
                                        <Pie data={protocols} dataKey="value" nameKey="protocol" outerRadius={80} innerRadius={30}>
                                            {protocols.map((entry, idx) => (
                                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="text-slate-400">Aucune donnée</div>}
                        </div>

                        <div className="bg-slate-800 p-4 rounded-lg md:col-span-2">
                            <h4 className="font-semibold mb-2">Top Talkers</h4>
                            <div className="max-h-48 overflow-auto">
                                {topBandwidth && topBandwidth.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead className="text-slate-400 text-left">
                                            <tr><th>IP</th><th className="text-right">Bytes</th><th className="text-right">Bps</th></tr>
                                        </thead>
                                        <tbody>
                                            {topBandwidth.map((t, i) => (
                                                <tr key={i} className="border-t border-slate-700">
                                                    <td className="py-2">{t.ip}</td>
                                                    <td className="py-2 text-right">{formatBytes(t.bytes)}</td>
                                                    <td className="py-2 text-right">{formatBps(t.bytes, 60)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <div className="text-slate-400">Aucune donnée</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'bandwidth' && (
                <div className="bg-slate-800 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">Bande passante — Temps réel</h3>
                        <div className="text-sm text-slate-400">Source: {bandwidthRealtime.length > 0 ? 'Realtime (logs)' : 'API'}</div>
                    </div>

                    <div className="h-96">
                        {bandwidthChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={bandwidthChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                    <YAxis tickFormatter={(v) => formatBytes(v)} />
                                    <Tooltip formatter={(v) => formatBytes(v)} />
                                    <Area type="monotone" dataKey="bytes" stroke="#3b82f6" fillOpacity={0.3} fill="#3b82f6" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className="text-slate-400">Aucune donnée de bande passante</div>}
                    </div>

                    <div className="mt-4">
                        <h4 className="font-semibold mb-2">Top consommateurs</h4>
                        <div className="max-h-48 overflow-auto">
                            {topBandwidth && topBandwidth.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead className="text-slate-400 text-left">
                                        <tr><th>IP</th><th className="text-right">Bytes</th><th className="text-right">Bps</th></tr>
                                    </thead>
                                    <tbody>
                                        {topBandwidth.map((t, i) => (
                                            <tr key={i} className="border-t border-slate-700">
                                                <td className="py-2">{t.key || t.ip}</td>
                                                <td className="py-2 text-right">{formatBytes(t.total_bytes?.value || t.bytes || t.doc_count)}</td>
                                                <td className="py-2 text-right">{formatBps(t.total_bytes?.value || t.bytes || 0, 60)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <div className="text-slate-400">Aucune donnée</div>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">Logs en temps réel</h3>
                        <div className="flex items-center gap-2">
                            <div className="text-slate-400">Nouveaux: {newLogsCount}</div>
                            <div className="text-slate-400">Total: {totalReceived}</div>
                            <div className="text-slate-400">Affichés: {logs.length}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 max-h-[60vh] overflow-auto">
                            {logs.length > 0 ? logs.map((log, idx) => (
                                <div key={idx} className="bg-slate-700 p-3 rounded mb-2 text-sm">
                                    <div className="text-xs text-slate-400">{formatTimestamp(log._source?.['@timestamp'] || log._source?.timestamp)}</div>
                                    <pre className="text-xs overflow-x-auto">{JSON.stringify(log._source, null, 2)}</pre>
                                </div>
                            )) : <div className="text-slate-400">Aucun log</div>}
                        </div>

                        <div className="md:col-span-1 space-y-3">
                            <div className="bg-slate-700 p-3 rounded">
                                <div className="text-sm">Intervalle stream (s)</div>
                                <input type="range" min={1} max={10} value={streamInterval} onChange={e => setStreamInterval(Number(e.target.value))} />
                                <div className="text-xs text-slate-400">{streamInterval}s</div>
                            </div>

                            <div className="bg-slate-700 p-3 rounded">
                                <div className="text-sm">Contrôles</div>
                                <div className="mt-2 flex gap-2">
                                    <button onClick={() => socketRef.current && socketRef.current.emit('pause-stream')} className="px-2 py-1 bg-slate-600 rounded">Pause</button>
                                    <button onClick={() => socketRef.current && socketRef.current.emit('resume-stream')} className="px-2 py-1 bg-slate-600 rounded">Resume</button>
                                    <button onClick={() => { setLogs([]); setTotalReceived(0); }} className="px-2 py-1 bg-red-700 rounded">Clear</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}