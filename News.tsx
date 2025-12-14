
import React, { useEffect, useState } from 'react';
import { api } from '../services/mockApi';
import { NewsItem } from '../types';
import { ImageCropper } from '../components/ImageCropper';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  Megaphone, 
  Layout, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Timer
} from 'lucide-react';

export const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Cropper
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  
  const [formData, setFormData] = useState<Partial<NewsItem>>({});
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await api.news.getAll();
      setNews(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this news item? This action cannot be undone.')) {
      await api.news.delete(id);
      loadNews();
    }
  };

  const openModal = (item?: NewsItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
      setMediaPreview(item.mediaUrl || null);
    } else {
      setEditingItem(null);
      // Default to "now" for scheduling (local time string for input)
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setFormData({ 
        type: 'popup', 
        status: 'published', 
        scheduledFor: now.toISOString().slice(0, 16),
        title: '',
        content: ''
      });
      setMediaPreview(null);
    }
    setIsModalOpen(true);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // If it's a video, upload directly (no crop)
      if (file.type.startsWith('video/')) {
          handleDirectUpload(file, 'video');
      } else {
          // It's an image, trigger cropper
          setSelectedFile(file);
          setShowCropper(true);
      }
    }
    e.target.value = '';
  };

  const handleMediaCrop = async (croppedFile: File) => {
      setShowCropper(false);
      handleDirectUpload(croppedFile, 'image');
      setSelectedFile(null);
  };

  const handleDirectUpload = async (file: File, type: 'image' | 'video') => {
      setUploading(true);
      try {
        const url = await api.uploadFile(file);
        setMediaPreview(url);
        setFormData({ 
            ...formData, 
            mediaUrl: url, 
            mediaType: type
        });
      } catch (error) {
        console.error("Media upload failed", error);
        alert("Failed to upload media");
      } finally {
        setUploading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    try {
      if (editingItem) {
        await api.news.update(editingItem.id, formData);
      } else {
        await api.news.create(formData as any);
      }
      setIsModalOpen(false);
      loadNews();
    } catch (err) {
      alert('Error saving news');
    }
  };

  const isScheduledInFuture = (dateStr: string) => {
    return new Date(dateStr) > new Date();
  };
  
  const isExpired = (expiresAt?: string) => {
    return expiresAt && new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
       {/* Image Cropper Modal */}
       {showCropper && selectedFile && (
          <ImageCropper 
            file={selectedFile}
            aspectRatio={16/9} // Popup/News image ratio
            onCrop={handleMediaCrop}
            onCancel={() => { setShowCropper(false); setSelectedFile(null); }}
          />
       )}

       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">News & Popups</h2>
          <p className="text-slate-500 dark:text-slate-400">Create site announcements, schedule popups, and manage news articles.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-lg transition-all font-medium shadow-sm neon-button"
        >
          <Plus size={18} /> Add News/Popup
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading news items...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map(item => {
                const isFuture = isScheduledInFuture(item.scheduledFor);
                const expired = isExpired(item.expiresAt);
                
                return (
                  <div key={item.id} className={`hover-3d bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden transition-all flex flex-col group ${expired ? 'border-red-200 dark:border-red-900/30 opacity-70' : 'border-slate-200 dark:border-slate-800'}`}>
                      <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                          {item.mediaUrl ? (
                              item.mediaType === 'video' ? (
                                  <video src={item.mediaUrl} className="w-full h-full object-cover" />
                              ) : (
                                  <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              )
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800">
                                  {item.type === 'popup' ? <Layout size={40} className="opacity-20" /> : <Megaphone size={40} className="opacity-20" />}
                              </div>
                          )}
                          <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                              {item.type === 'popup' ? <Layout size={12}/> : <Megaphone size={12}/>}
                              {item.type}
                          </div>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 leading-tight">{item.title}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 flex-1">{item.content}</p>
                          
                          <div className={`flex flex-col gap-2 mb-4 p-2 rounded-lg border ${
                              expired 
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400'
                                : isFuture 
                                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400' 
                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                              <div className="flex items-center gap-2 text-xs">
                                  <Clock size={14} />
                                  <div className="flex flex-col">
                                    <span className="font-semibold">{isFuture ? 'Scheduled Start:' : 'Posted On:'}</span>
                                    <span>{new Date(item.scheduledFor).toLocaleDateString()} {new Date(item.scheduledFor).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                              </div>
                              {item.expiresAt && (
                                  <div className="flex items-center gap-2 text-xs border-t border-dashed border-current pt-1 mt-1 opacity-90">
                                      <Timer size={14} />
                                      <div className="flex flex-col">
                                          <span className="font-semibold">{expired ? 'Expired On:' : 'Expires On:'}</span>
                                          <span>{new Date(item.expiresAt).toLocaleDateString()} {new Date(item.expiresAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      </div>
                                  </div>
                              )}
                          </div>
                          
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 ${
                                  expired ? 'bg-slate-200 text-slate-500 dark:bg-slate-800' :
                                  item.status === 'published' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                  {expired ? 'Expired' : (
                                      <>
                                          {item.status === 'published' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                                          {item.status}
                                      </>
                                  )}
                              </span>
                              <div className="flex gap-2">
                                  <button onClick={() => openModal(item)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 transition-colors neon-transition" title="Edit">
                                      <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-600 transition-colors neon-transition" title="Delete">
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
                );
            })}
            
            {news.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center">
                    <Megaphone size={48} className="mb-4 opacity-20" />
                    <p className="font-medium text-lg">No news items found</p>
                    <p className="text-sm">Create a popup or news article to engage your visitors.</p>
                </div>
            )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-2xl">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                       {editingItem ? 'Edit News Item' : 'Create News / Popup'}
                   </h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 neon-transition"><X size={24}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Display Type</label>
                           <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                               <button 
                                type="button" 
                                onClick={() => setFormData({...formData, type: 'popup'})}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${formData.type === 'popup' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                               >
                                   <Layout size={14} /> Popup
                               </button>
                               <button 
                                type="button" 
                                onClick={() => setFormData({...formData, type: 'article'})}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${formData.type === 'article' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                               >
                                   <Megaphone size={14} /> Article
                               </button>
                           </div>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                           <select 
                             className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input h-[42px]"
                             value={formData.status || 'published'}
                             onChange={e => setFormData({...formData, status: e.target.value as any})}
                           >
                               <option value="published">Published</option>
                               <option value="draft">Draft</option>
                               <option value="archived">Archived</option>
                           </select>
                       </div>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title / Headline</label>
                       <input 
                         required
                         type="text" 
                         className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input"
                         value={formData.title || ''}
                         onChange={e => setFormData({...formData, title: e.target.value})}
                         placeholder={formData.type === 'popup' ? "e.g. Special Holiday Announcement" : "e.g. New Project Milestone"}
                       />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content / Description</label>
                       <textarea 
                         required
                         rows={5}
                         className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input resize-none"
                         value={formData.content || ''}
                         onChange={e => setFormData({...formData, content: e.target.value})}
                         placeholder="Enter the main text content here..."
                       />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Schedule Start (Show From)</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                type="datetime-local" 
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input"
                                value={formData.scheduledFor || ''}
                                onChange={e => setFormData({...formData, scheduledFor: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiration Date (Hide After)</label>
                            <div className="relative">
                                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                type="datetime-local" 
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input"
                                value={formData.expiresAt || ''}
                                onChange={e => setFormData({...formData, expiresAt: e.target.value})}
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">Leave blank to show indefinitely.</p>
                        </div>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Media Attachment (Optional)</label>
                       <div className="flex items-start gap-4 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                           <div className="w-32 h-20 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm shrink-0 relative">
                               {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10"><Loader2 className="animate-spin text-white" /></div>}
                               {mediaPreview ? (
                                   formData.mediaType === 'video' ? (
                                       <video src={mediaPreview} className="w-full h-full object-cover" />
                                   ) : (
                                       <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                                   )
                               ) : (
                                   <ImageIcon className="text-slate-300 dark:text-slate-600" size={24} />
                               )}
                           </div>
                           <div className="flex-1">
                               <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-300 dark:border-slate-600 shadow-sm neon-button text-white">
                                   <Upload size={16} />
                                   <span className="text-sm font-medium">{uploading ? 'Uploading...' : 'Choose File'}</span>
                                   <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaSelect} disabled={uploading} />
                               </label>
                               <p className="text-xs text-slate-400 mt-2">Recommended: 16:9 aspect ratio. Max 10MB.</p>
                               {mediaPreview && (
                                  <button 
                                    type="button" 
                                    onClick={() => { setMediaPreview(null); setFormData({...formData, mediaUrl: undefined}); }}
                                    className="text-xs text-red-500 hover:text-red-600 mt-2 flex items-center gap-1"
                                  >
                                    <X size={12} /> Remove Media
                                  </button>
                               )}
                           </div>
                       </div>
                   </div>
                   
                   <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-4 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                       <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors neon-transition font-medium">Cancel</button>
                       <button type="submit" disabled={uploading} className="px-6 py-2.5 text-white font-medium rounded-lg neon-button disabled:opacity-50">Save & Schedule</button>
                   </div>
               </form>
           </div>
        </div>
      )}
    </div>
  );
};
