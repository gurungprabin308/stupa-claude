// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api'; // mockApi जसले google drive upload र अन्य functions provide गर्छ
import { DashboardStats } from '../types';

import {
  BarChart3,
  Users,
  FileImage,
  TrendingUp,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Supabase client (metadata storage)
import { supabase } from '../lib/supabaseClient';

/**
 * Dashboard Component
 *
 * - यो फाइलमा analytics देखाउने मुख्य UI छ।
 * - साथै सानो File Manager section थपेको छु जसले:
 *   1) Files Google Drive मा upload गर्छ (api.uploadFile प्रयोग गरी),
 *   2) metadata (filename, url, mime) लाई Supabase table 'media_files' मा save गर्छ।
 *
 * टिप: यदि 'media_files' table छैन भने safeSupabaseWrite logic ले missing-column handle गर्न सक्छ,
 *      तर table schema create गर्न supabase dashboard बाट बनाउनु राम्रो हुन्छ:
 *      columns: id (uuid), name (text), url (text), mimeType (text), created_at (timestamp)
 */

/* -------------------------
   StatCard: कार्ड component
   - सानो reusable card जसले title, value, icon देखाउँछ
   ------------------------- */
const StatCard = ({ title, value, icon: Icon, color, linkTo, subtitle }: any) => (
  <div className="hover-3d bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between group relative overflow-hidden transition-all duration-300">
    {/* Gradient background orb */}
    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${color} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`}></div>

    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 tracking-wide">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-baseline gap-2">
          {value}
          {subtitle && <span className="text-sm font-normal text-slate-400">{subtitle}</span>}
        </h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20 text-opacity-100 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>

    {linkTo && (
      <Link to={linkTo} className="relative z-10 text-sm text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
        Manage <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

/* -------------------------
   Dashboard Component (default export)
   ------------------------- */
export const Dashboard = () => {
  // analytics state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Last 6 Months');

  // live visitors simulation
  const [liveVisitors, setLiveVisitors] = useState(24);

  /* -------------------------
     File Manager state
     - uploadedFiles: array of uploaded file metadata from Supabase
     - uploading: boolean to show upload state
     ------------------------- */
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  /* -------------------------
     fetchStats: Dashboard analytics load
     - api.dashboard.getStats(filter) बाट data ल्याउने
     ------------------------- */
useEffect(() => {
  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getGA4Stats(filter); // <-- your GA4 function
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats", error);
    } finally {
      setLoading(false);
    }
  };
  fetchStats();
}, [filter]);

  /* -------------------------
     Real-time visitor simulation:
     - प्रत्येक 3s मा api.dashboard.getRealTimeVisitors() call गर्छ
     ------------------------- */

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:5000/api/realtime-visitors');
        const data = await response.json();
        setLiveVisitors(data.count);
      } catch (e) {
        console.error(e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);


  /* -------------------------
     Load uploaded files metadata from Supabase
     - Table: 'media_files' (recommended)
     - यो optional छ: यदि table छैन भने खाली array आउला
     ------------------------- */
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const { data, error } = await supabase
          .from('media_files')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn("Could not load media_files:", error.message || error);
          setUploadedFiles([]);
        } else {
          setUploadedFiles(data || []);
        }
      } catch (err) {
        console.error("Error loading files:", err);
        setUploadedFiles([]);
      }
    };
    loadFiles();
  }, []);

  /* -------------------------
     handleFileUpload:
     - input file(s) लिएर प्रत्येक file लाई api.uploadFile(file) मार्फत Drive मा पठाउँछ
     - त्यसपछि Supabase मा metadata insert गर्छ (name, url, mimeType, created_at)
     - UI मा local state update गर्छ
     ------------------------- */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const fileArray = Array.from(files);
    const results: any[] = [];

    for (const f of fileArray) {
      try {
        // 1) Upload to Google Drive via mockApi (assumes api.uploadFile returns URL string)
        const url = await api.uploadFile(f as File); // mockApi.uploadFile

        // 2) Save metadata to Supabase table 'media_files'
        const meta = {
          name: f.name,
          url,
          mimeType: f.type || 'application/octet-stream',
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase.from('media_files').insert([meta]).select().single();

        if (error) {
          // If insert failed, still keep URL in local state but warn
          console.warn("Failed to save metadata to Supabase:", error);
          results.push({ ...meta, id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}` });
        } else {
          results.push(data);
        }
      } catch (uploadErr) {
        console.error("Upload failed for", f.name, uploadErr);
      }
    }

    // Append to UI list
    setUploadedFiles(prev => [...results, ...prev]);
    setUploading(false);

    // clean file input
    e.currentTarget.value = '';
  };

  /* -------------------------
     handleFileDelete:
     - metadata लाई Supabase बाट delete गर्छ
     - (Important) Drive file delete: यहाँमा हामी केवल metadata delete गरिरहेका छौं।
       Drive बाट physical delete गराउन चाहिन्छ भने googleBackend.deleteFile(fileId) जसलाई
       mockApi मा expose गरेर प्रयोग गर्न सकिन्छ।
     ------------------------- */
  const handleFileDelete = async (row: any) => {
    if (!row?.id) {
      // local-only entry (no id) -> just remove
      setUploadedFiles(prev => prev.filter(f => f.url !== row.url));
      return;
    }

    try {
      const { error } = await supabase.from('media_files').delete().eq('id', row.id);

      if (error) {
        console.warn("Failed to delete metadata:", error);
        // still remove from UI to keep UI responsive
        setUploadedFiles(prev => prev.filter(f => f.id !== row.id));
      } else {
        setUploadedFiles(prev => prev.filter(f => f.id !== row.id));
      }
    } catch (err) {
      console.error("Delete error:", err);
      setUploadedFiles(prev => prev.filter(f => f.id !== row.id));
    }
  };

  /* -------------------------
     Safety in rendering:
     - Fix 1: stats?.totalViews could be undefined -> use fallback 0 before toLocaleString
     - Fix 2: AreaChart data fallback to empty array to avoid chart crash
     ------------------------- */
  if (loading && !stats) return <div className="flex h-64 items-center justify-center text-slate-400"><span className="animate-pulse">Loading analytics...</span></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Overview</h2>
          <p className="text-slate-500 dark:text-slate-400">Welcome back. Here's what's happening with your website.</p>
        </div>
        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-sm font-bold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          System Online
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Live Visitors"
          value={liveVisitors}
          subtitle="on site now"
          icon={Activity}
          color="bg-emerald-500"
        />
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects ?? 0}
          icon={FileImage}
          color="bg-purple-600"
          linkTo="/admin/projects"
        />
        <StatCard
          title="Active Reels"
          value={stats?.totalReels ?? 0}
          icon={TrendingUp}
          color="bg-pink-600"
          linkTo="/admin/reels"
        />
        <StatCard
          title="Total Views"
          // FIX: ensure totalViews exists before calling toLocaleString
          value={(stats?.totalViews ?? 0).toLocaleString()}
          icon={Users}
          color="bg-blue-600"
        />
      </div>

      {/* Chart Section */}
      <div className="hover-3d bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-500" />
            Visitor Analytics
          </h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg px-3 py-2 outline-none neon-input cursor-pointer hover:border-blue-400 transition-colors"
          >
            <option>Last 6 Months</option>
            <option>Last Year</option>
          </select>
        </div>

        {/* Chart: data fallback [] to avoid crash */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.viewsHistory ?? []}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.1} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  padding: '12px'
                }}
                itemStyle={{ color: '#60a5fa' }}
                cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }} animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* -------------------------
          File Manager Section (simple)
          - सानो uploader जसले files Drive मा upload गर्छ र Supabase मा metadata राख्छ
          - admin panel बाट file list हेर्न र metadata delete गर्न मिल्छ
          ------------------------- */}
      <div className="hover-3d bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">File Manager</h3>
          <div className="text-sm text-slate-500">Upload small/medium files to Drive (max ~25MB)</div>
        </div>

        <div className="flex items-center gap-3">
          <input type="file" multiple onChange={handleFileUpload} className="border rounded p-2" />
          <button
            className={`px-3 py-2 rounded bg-blue-600 text-white text-sm ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
            onClick={() => { /* optional: manual trigger if needed */ }}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploadedFiles.length === 0 && <div className="text-slate-500">No uploaded files yet.</div>}
          {uploadedFiles.map((f: any) => (
            <div key={f.id || f.url} className="border rounded p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{f.name || (f.url && f.url.split('/').pop()) || 'file'}</div>
                <div className="text-xs text-slate-400">{new Date(f.created_at || Date.now()).toLocaleString()}</div>
              </div>
              <div className="text-xs text-slate-500 break-words">{f.url}</div>
              <div className="flex gap-2 mt-2">
                <a href={f.url} target="_blank" rel="noreferrer" className="text-sm underline">Open</a>
                <button onClick={() => handleFileDelete(f)} className="text-sm text-red-500">Delete metadata</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
