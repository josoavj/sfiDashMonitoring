import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:3001/api';

function getToday630Range() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(6, 30, 0, 0);
  if (start > now) start.setDate(start.getDate() - 1);
  return { from: start.toISOString(), to: now.toISOString(), start, now };
}

function humanBytes(n) {
  if (!n) return '0 B';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0; let v = n;
  while (v >= 1024 && i < units.length-1) { v /= 1024; i++; }
  return `${v.toFixed(2)} ${units[i]}`;
}

export default function InterfaceTestData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bandwidth, setBandwidth] = useState(null);
  const [topConsumers, setTopConsumers] = useState([]);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let mounted = true;
    const range = getToday630Range();

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [bwRes, topRes, healthRes] = await Promise.all([
          fetch(`${API_URL}/bandwidth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: { from: range.from, to: range.to }, interval: '1m' }) }),
          fetch(`${API_URL}/top-bandwidth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeRange: { from: range.from, to: range.to }, size: 10 }) }),
          fetch(`${API_URL}/health`)
        ]);

        const [bwData, topData, healthData] = await Promise.all([bwRes.json(), topRes.json(), healthRes.json()]);

        if (!mounted) return;
        setBandwidth(bwData);
        setTopConsumers(topData || []);
        setHealth(healthData);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => { mounted = false; };
  }, []);

  const chartData = useMemo(() => {
    if (!bandwidth) return [];
    const tl = bandwidth.timeline || bandwidth;
    if (!Array.isArray(tl)) return [];
    return tl.map(b => ({ time: b.key_as_string || b.time, bytes: (b.total_bytes && b.total_bytes.value) || b.bytes || 0 }));
  }, [bandwidth]);

  const totalBytes = bandwidth?.total || (bandwidth?.aggregations?.total_bytes?.value) || 0;

  return (
    <div className="p-6 min-h-screen bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Interface Test Data — Bande passante {"(06:30 → maintenant)"}</h2>
        {loading && <div className="text-slate-400">Chargement...</div>}
        {error && <div className="text-red-400">Erreur: {error}</div>}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-800 rounded">
                <div className="text-sm text-slate-400">Total octets</div>
                <div className="text-xl font-semibold">{humanBytes(totalBytes)}</div>
                <div className="text-xs text-slate-400 mt-1">({totalBytes} bytes)</div>
              </div>
              <div className="p-4 bg-slate-800 rounded">
                <div className="text-sm text-slate-400">Points de données</div>
                <div className="text-xl font-semibold">{(bandwidth?.timeline || bandwidth)?.length || 0}</div>
              </div>
              <div className="p-4 bg-slate-800 rounded">
                <div className="text-sm text-slate-400">Cluster</div>
                <div className="text-lg">{health?.elasticsearch?.cluster_name || '—'}</div>
                <div className="text-xs text-slate-400">Status: {health?.cluster?.status || '—'}</div>
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded mb-6 h-96">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => humanBytes(v)} />
                    <Tooltip formatter={v => humanBytes(v)} />
                    <Area type="monotone" dataKey="bytes" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="text-slate-400">Aucune donnée disponible</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800 p-4 rounded">
                <h3 className="font-semibold mb-2">Top consommateurs</h3>
                {topConsumers && topConsumers.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="text-slate-400 text-left"><tr><th>IP</th><th className="text-right">Bytes</th></tr></thead>
                    <tbody>
                      {topConsumers.map((t,i) => (
                        <tr key={i} className="border-t border-slate-700"><td className="py-2">{t.key || t.ip}</td><td className="py-2 text-right">{humanBytes(t.total_bytes?.value || t.bytes || t.doc_count || 0)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : <div className="text-slate-400">Aucune donnée</div>}
              </div>

              <div className="bg-slate-800 p-4 rounded">
                <h3 className="font-semibold mb-2">Détails bruts</h3>
                <pre className="text-xs max-h-64 overflow-auto text-slate-300">{JSON.stringify({ bandwidth, topConsumers, health }, null, 2)}</pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
