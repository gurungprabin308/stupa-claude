
import React, { useEffect, useState } from 'react';
import { api } from '../services/mockApi';
import { Page } from '../types';
import { Plus, Edit2, Trash2, X, FileText, Globe } from 'lucide-react';

export const Pages = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  
  // Form
  const [formData, setFormData] = useState<Partial<Page>>({});

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await api.pages.getAll();
      setPages(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this page?')) {
      await api.pages.delete(id);
      loadPages();
    }
  };

  const openModal = (page?: Page) => {
    if (page) {
      setEditingPage(page);
      setFormData({ ...page });
    } else {
      setEditingPage(null);
      setFormData({ status: 'published', content: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPage) {
        await api.pages.update(editingPage.id, formData);
      } else {
        await api.pages.create(formData as any);
      }
      setIsModalOpen(false);
      loadPages();
    } catch (err) {
      alert('Error saving page');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Pages</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage dynamic content pages for your website.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-lg transition-all font-medium shadow-sm neon-button"
        >
          <Plus size={18} /> Add New Page
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading pages...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div key={page.id} className="hover-3d bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                  <FileText size={24} />
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${page.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600'}`}>
                  {page.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{page.title}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-4">
                 <Globe size={12} /> /{page.slug}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">{page.content}</p>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <span className="text-xs text-slate-400">Updated: {page.lastUpdated}</span>
                 <div className="flex gap-2">
                    <button onClick={() => openModal(page)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 transition-colors neon-transition">
                       <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(page.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-600 transition-colors neon-transition">
                       <Trash2 size={16} />
                    </button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    {editingPage ? 'Edit Page' : 'Create New Page'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Page Title</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input"
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL Slug</label>
                        <div className="flex items-center">
                            <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-lg text-slate-500 text-sm">/</span>
                            <input 
                            required
                            type="text" 
                            className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-r-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input"
                            value={formData.slug || ''}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                        <select 
                            className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input"
                            value={formData.status || 'published'}
                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                        >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Page Content (HTML/Markdown)</label>
                    <textarea 
                      required
                      rows={8}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input font-mono text-sm"
                      value={formData.content || ''}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                    />
                 </div>
                 <div className="pt-2 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors neon-transition">Cancel</button>
                    <button type="submit" className="px-5 py-2 text-white rounded-lg neon-button">Save Page</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
