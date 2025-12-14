
import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/mockApi';
import { Reel } from '../types';
import { Play, Trash2, Video, Upload, X, Eye, EyeOff, Edit3, CheckCircle2, Loader2, Search } from 'lucide-react';

const CATEGORIES = [
  'Construction',
  'Interior Design',
  'Project Showcase',
  'Architectural Walkthrough',
  'Client Testimonial',
  'Site Visit'
];

// Helper to generate thumbnail from video file
const generateVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    
    // Safety timeout in case video loading hangs
    const timeout = setTimeout(() => resolve(''), 3000);

    video.onloadeddata = () => {
        // Seek to 2 seconds to capture a frame (avoiding initial black screen)
        video.currentTime = 2;
    };

    video.onseeked = () => {
        clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        // Set dimensions - optimized for storage (9:16 aspect ratio)
        canvas.width = 270; 
        canvas.height = 480;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Compress to JPEG at 50% quality to save storage space
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            resolve(dataUrl);
        } else {
            resolve('');
        }
        // Cleanup
        URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
        clearTimeout(timeout);
        resolve('');
    };
  });
};

export const Reels = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailGenerating, setThumbnailGenerating] = useState(false);
  
  // New Reel Form State
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelCategory, setNewReelCategory] = useState(CATEGORIES[0]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit State
  const [editingReel, setEditingReel] = useState<Reel | null>(null);
  const [editForm, setEditForm] = useState<{title: string, category: string}>({ title: '', category: '' });

  // Play Modal State
  const [playingReel, setPlayingReel] = useState<Reel | null>(null);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    const data = await api.reels.getAll();
    setReels(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const clearUploadForm = () => {
      setNewReelTitle('');
      setVideoFile(null);
      setVideoPreview(null);
      setNewReelCategory(CATEGORIES[0]);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReelTitle.trim() || !videoFile) return;
    
    setLoading(true);
    setUploadProgress(5); // Start progress

    try {
        // 1. Generate Thumbnail from Video
        setThumbnailGenerating(true);
        let thumbUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'; // Fallback
        
        try {
            const generatedThumb = await generateVideoThumbnail(videoFile);
            if (generatedThumb) thumbUrl = generatedThumb;
        } catch (e) {
            console.warn("Thumbnail generation failed, using fallback");
        }
        setThumbnailGenerating(false);
        setUploadProgress(30);

        // 2. Upload video file to Supabase (Mock)
        const videoUrl = await api.uploadFile(videoFile);
        setUploadProgress(80);
        
        // 3. Create database record
        await api.reels.create({
          title: newReelTitle,
          videoUrl: videoUrl,
          thumbnailUrl: thumbUrl,
          status: 'published',
          views: 0,
          category: newReelCategory
        });
        
        setUploadProgress(100);
        clearUploadForm();
        loadReels();
    } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload reel.");
    } finally {
        setLoading(false);
        setThumbnailGenerating(false);
        setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this reel? This cannot be undone.')) {
      await api.reels.delete(id);
      loadReels(); 
    }
  };

  const handleToggleStatus = async (reel: Reel) => {
    const newStatus = reel.status === 'published' ? 'draft' : 'published';
    // Optimistic update
    setReels(prev => prev.map(r => r.id === reel.id ? { ...r, status: newStatus } : r));
    await api.reels.update(reel.id, { status: newStatus });
  };

  const openEditModal = (reel: Reel) => {
      setEditingReel(reel);
      setEditForm({ title: reel.title, category: reel.category || CATEGORIES[0] });
  };

  const handleUpdateReel = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!editingReel) return;

      await api.reels.update(editingReel.id, {
          title: editForm.title,
          category: editForm.category
      });
      
      setEditingReel(null);
      loadReels();
  };

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reels & Videos</h2>
            <p className="text-slate-500 dark:text-slate-400">Manage your vertical video content.</p>
          </div>
        </div>

        {/* Upload Area - Hover effect removed from container */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
           <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase mb-4 flex items-center gap-2">
             <Video size={18} /> Upload New Reel
           </h3>
           <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-4">
                      <input 
                        type="text" 
                        placeholder="Enter Reel Title (e.g., Construction Progress)" 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                        value={newReelTitle}
                        onChange={e => setNewReelTitle(e.target.value)}
                        required
                        disabled={loading}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                            value={newReelCategory}
                            onChange={e => setNewReelCategory(e.target.value)}
                            disabled={loading}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2">
                            <label className={`flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border border-dashed rounded-lg transition-all neon-transition ${videoFile ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-500'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <Upload size={18} />
                                <span className="font-medium text-sm truncate">{videoFile ? videoFile.name : 'Select Video File'}</span>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="video/*" 
                                    className="hidden" 
                                    onChange={handleFileChange} 
                                    disabled={loading}
                                />
                            </label>
                            {videoFile && !loading && (
                                <button type="button" onClick={clearUploadForm} className="p-3 text-red-500 hover:bg-red-50 rounded-lg neon-transition">
                                    <X size={18}/>
                                </button>
                            )}
                        </div>
                      </div>
                  </div>

                  {/* Publish Button with Hover Effect */}
                  <button 
                    type="submit" 
                    disabled={loading || !videoFile || !newReelTitle.trim()}
                    className="w-full md:w-48 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 neon-button hover-3d relative overflow-hidden"
                  >
                    {loading ? (
                        <>
                           <span className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-200" style={{ width: `${uploadProgress}%` }}></span>
                           <Loader2 className="animate-spin relative z-10" size={18} /> 
                           <span className="relative z-10 text-xs">
                               {thumbnailGenerating ? 'Analyzing...' : `${uploadProgress}%`}
                           </span>
                        </>
                    ) : (
                        <>
                            <Upload size={18} /> Publish Reel
                        </>
                    )}
                  </button>
              </div>
           </form>
           
           {/* Upload Preview */}
           {videoPreview && (
               <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 animate-fade-in-up">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Video Preview</p>
                    {loading && <p className="text-xs text-blue-500 animate-pulse">Processing video...</p>}
                  </div>
                  <video src={videoPreview} controls className="h-64 rounded-lg bg-black mx-auto shadow-lg" />
               </div>
           )}
        </div>

        {/* Filters / Search Bar (Visual Only for now) */}
        <div className="flex gap-4">
             <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Search reels..." 
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 neon-input"
                 />
             </div>
        </div>

        {/* Reels Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
           {reels.map(reel => (
             <div key={reel.id} className="hover-3d group relative aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden transition-all duration-300 border border-slate-800 flex flex-col shadow-lg">
                {/* Thumbnail / Play Area */}
                <div 
                    className="flex-1 relative cursor-pointer overflow-hidden"
                    onClick={() => setPlayingReel(reel)}
                >
                    <img 
                        src={reel.thumbnailUrl} 
                        alt={reel.title} 
                        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${reel.status === 'draft' ? 'opacity-40 grayscale' : 'opacity-80 group-hover:opacity-60'}`} 
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x700/1e293b/FFF?text=Video';
                        }}
                    />
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                         <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/30 hover:scale-110 transition-transform">
                             <Play fill="white" className="text-white ml-1" size={24} />
                         </div>
                     </div>
                     
                     {/* Category Badge */}
                     {reel.category && (
                         <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded font-medium border border-white/10">
                             {reel.category}
                         </span>
                     )}
                     
                     {/* Status Badge */}
                     <span className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm border ${
                         reel.status === 'published' 
                         ? 'bg-blue-500/90 text-white border-blue-400' 
                         : 'bg-slate-800/90 text-slate-300 border-slate-600'
                     }`}>
                         {reel.status}
                     </span>
                </div>

                {/* Info & Actions */}
                <div className="bg-slate-900 p-3 border-t border-slate-800 z-30 relative">
                     <div className="text-white font-bold truncate text-sm mb-1 leading-snug" title={reel.title}>{reel.title}</div>
                     
                     <div className="flex justify-between items-center mt-3">
                         <div className="text-slate-400 text-[10px] flex items-center gap-1">
                            <Play size={10} fill="currentColor" /> {reel.views.toLocaleString()}
                         </div>
                         
                         <div className="flex gap-1.5">
                             <button 
                                onClick={(e) => { e.stopPropagation(); openEditModal(reel); }}
                                className="p-1.5 bg-slate-800 text-slate-300 rounded hover:bg-blue-600 hover:text-white transition-colors"
                                title="Edit Info"
                              >
                                <Edit3 size={14} />
                              </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(reel); }}
                                className={`p-1.5 rounded transition-colors ${
                                    reel.status === 'published' 
                                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white' 
                                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                                }`}
                                title={reel.status === 'published' ? "Unpublish" : "Publish"}
                              >
                                {reel.status === 'published' ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(reel.id); }}
                                className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"
                                title="Delete Reel"
                              >
                                <Trash2 size={14} />
                              </button>
                         </div>
                     </div>
                </div>
             </div>
           ))}
           
           {reels.length === 0 && (
               <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center">
                   <Video size={48} className="mb-4 opacity-20" />
                   <p className="font-medium text-lg">No reels uploaded yet</p>
                   <p className="text-sm">Upload your first vertical video to get started.</p>
               </div>
           )}
        </div>

        {/* Video Player Modal */}
        {playingReel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setPlayingReel(null)}>
                <div className="relative w-full max-w-sm bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 animate-scale-up" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setPlayingReel(null)}
                        className="absolute top-4 right-4 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-red-600 transition-colors backdrop-blur-sm"
                    >
                        <X size={20} />
                    </button>
                    <div className="aspect-[9/16] bg-slate-900">
                        <video 
                            key={playingReel.id}
                            src={playingReel.videoUrl} 
                            className="w-full h-full object-contain" 
                            controls 
                            autoPlay 
                        />
                    </div>
                    <div className="p-5 bg-slate-900 border-t border-slate-800">
                        <h3 className="text-white font-bold text-lg leading-tight">{playingReel.title}</h3>
                        <p className="text-slate-400 text-sm mt-1">{playingReel.views.toLocaleString()} views • {playingReel.category || 'Uncategorized'}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Edit Reel Modal */}
        {editingReel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Edit Reel Details</h3>
                        <button onClick={() => setEditingReel(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24}/></button>
                    </div>
                    <form onSubmit={handleUpdateReel} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reel Title</label>
                            <input 
                                required
                                type="text" 
                                className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input"
                                value={editForm.title}
                                onChange={e => setEditForm({...editForm, title: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                            <select
                                className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input"
                                value={editForm.category}
                                onChange={e => setEditForm({...editForm, category: e.target.value})}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="pt-2 flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingReel(null)} className="px-5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors neon-transition">Cancel</button>
                            <button type="submit" className="px-5 py-2 text-white rounded-lg neon-button">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};