
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Project } from '../types';
import { ImageCropper } from '../components/ImageCropper.tsx';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Images, 
  Loader2 
} from 'lucide-react';

const PROJECT_CATEGORIES = [
  'Residential',
  'Commercial',
  'Palace / Heritage',
  'Interior Design',
  'Landscape',
  'Public Infrastructure',
  'Renovation'
];

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Cropper State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [materialInput, setMaterialInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await api.projects.getAll();
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await api.projects.delete(id);
      loadProjects();
    }
  };

  const handleToggleStatus = async (project: Project) => {
    const newStatus = project.status === 'published' ? 'draft' : 'published';
    await api.projects.update(project.id, { status: newStatus });
    loadProjects();
  };

  const openModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({ ...project });
    } else {
      setEditingProject(null);
      setFormData({ 
          status: 'draft', 
          materials: [], 
          tags: [], 
          gallery: [],
          category: PROJECT_CATEGORIES[0] // Default category
      });
    }
    setIsModalOpen(true);
  };

  // Image Upload with Cropper
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowCropper(true);
    }
    e.target.value = ''; // Reset
  };

  const handleImageCrop = async (croppedFile: File) => {
    setShowCropper(false);
    setUploading(true);
    try {
      const url = await api.uploadFile(croppedFile);
      setFormData({ ...formData, thumbnailUrl: url });
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  // Gallery Upload (Max 10) - Direct upload, no crop for bulk
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploading(true);
      try {
        // Fix: Explicitly cast file to File to avoid unknown type error
        const uploadPromises = Array.from(files).map(file => api.uploadFile(file as File));
        const newImages = await Promise.all(uploadPromises);
        const currentGallery = formData.gallery || [];
        const combinedGallery = [...currentGallery, ...newImages].slice(0, 10);
        setFormData({ ...formData, gallery: combinedGallery });
      } catch (error) {
        console.error("Gallery upload failed", error);
        alert("Failed to upload some gallery images");
      } finally {
        setUploading(false);
      }
    }
  };

  const removeGalleryImage = (index: number) => {
    const currentGallery = [...(formData.gallery || [])];
    currentGallery.splice(index, 1);
    setFormData({ ...formData, gallery: currentGallery });
  };

  const addMaterial = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && materialInput.trim()) {
      e.preventDefault();
      setFormData({ ...formData, materials: [...(formData.materials || []), materialInput.trim()] });
      setMaterialInput('');
    }
  };

  const removeMaterial = (index: number) => {
    const newMaterials = [...(formData.materials || [])];
    newMaterials.splice(index, 1);
    setFormData({ ...formData, materials: newMaterials });
  };
  
  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    const newTags = [...(formData.tags || [])];
    newTags.splice(index, 1);
    setFormData({ ...formData, tags: newTags });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    try {
      if (editingProject) {
        await api.projects.update(editingProject.id, formData);
      } else {
        await api.projects.create(formData as any);
      }
      setIsModalOpen(false);
      loadProjects();
    } catch (err: any) {
      console.error(err);
      alert(`Error saving project: ${err.message || err.toString()}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Image Cropper Modal */}
      {showCropper && selectedFile && (
          <ImageCropper 
            file={selectedFile}
            aspectRatio={16/9} // Standard landscape aspect ratio for project thumbnails
            onCrop={handleImageCrop}
            onCancel={() => { setShowCropper(false); setSelectedFile(null); }}
          />
       )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Projects</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage your architectural portfolio.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-lg transition-all font-medium shadow-sm neon-button"
        >
          <Plus size={18} /> Add New Project
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="hover-3d bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300 flex flex-col group">
              <div className="relative h-56 bg-slate-100 dark:bg-slate-800 group-inner">
                <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => openModal(project)} className="p-2 bg-white rounded-full text-slate-900 hover:scale-110 transition-transform shadow-lg">
                    <Edit3 size={18} />
                  </button>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
                    project.status === 'published' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {project.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                {/* Gallery Indicator */}
                {project.gallery && project.gallery.length > 0 && (
                   <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Images size={12} /> +{project.gallery.length}
                   </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-2">
                   <div className="flex flex-wrap gap-1 mb-2">
                      {project.tags?.map((tag, i) => (
                        <span key={i} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          {tag}
                        </span>
                      ))}
                   </div>
                   <h3 className="font-bold text-slate-800 dark:text-white text-xl leading-tight">{project.title}</h3>
                   <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">{project.category}</div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4 flex-1">{project.description}</p>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="text-xs text-slate-400">{project.date}</div>
                   <div className="flex items-center gap-2">
                     <button 
                       onClick={() => handleToggleStatus(project)}
                       className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors neon-transition"
                       title={project.status === 'published' ? "Unpublish" : "Publish"}
                     >
                        {project.status === 'published' ? <Eye size={18} /> : <EyeOff size={18} />}
                     </button>
                     <button 
                       onClick={() => handleDelete(project.id)}
                       className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors neon-transition"
                       title="Delete"
                     >
                        <Trash2 size={18} />
                     </button>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingProject ? 'Edit Project' : 'New Project'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 neon-transition">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Main Info */}
              <section className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Basic Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Title</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                      value={formData.title || ''}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                      value={formData.category || ''}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                        {PROJECT_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                  </div>
                   <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (Press Enter to add)</label>
                    <div className="flex flex-wrap gap-2 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 neon-input transition-all">
                      {formData.tags?.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-sm">
                          {tag} <button type="button" onClick={() => removeTag(i)}><X size={12} /></button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        className="flex-1 outline-none min-w-[120px] bg-transparent text-slate-900 dark:text-white placeholder-slate-400"
                        placeholder="Add tag..."
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={addTag}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Media */}
              <section className="space-y-4">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Media</h4>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Main Hero Image (Thumbnail)</label>
                    <div className="flex items-start gap-6">
                       <div className="w-40 h-28 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 relative">
                          {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10"><Loader2 className="animate-spin text-white" /></div>}
                          {formData.thumbnailUrl ? (
                            <img src={formData.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={32} />
                          )}
                       </div>
                       <div className="flex-1">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover-3d">
                            <Upload size={18} className="text-slate-600 dark:text-slate-300" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {uploading ? 'Processing...' : 'Upload & Crop Image'}
                            </span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={uploading} />
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Recommended: 16:9 aspect ratio. This will be the main cover of the project.</p>
                       </div>
                    </div>
                 </div>

                 {/* Project Gallery */}
                 <div className="pt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                       Project Gallery (Max 10 Images)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {formData.gallery?.map((img, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => removeGalleryImage(index)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        
                        {(!formData.gallery || formData.gallery.length < 10) && (
                            <label className="cursor-pointer flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-400 relative">
                                {uploading ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
                                <span className="text-xs mt-1">Add Image</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    multiple 
                                    className="hidden" 
                                    onChange={handleGalleryUpload} 
                                    disabled={uploading}
                                />
                            </label>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        {formData.gallery?.length || 0}/10 images uploaded.
                    </p>
                 </div>
              </section>

              {/* Details */}
              <section className="space-y-4">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Project Details</h4>
                 
                 <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Overview</label>
                   <textarea 
                     rows={3}
                     className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                     value={formData.description || ''}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                   />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Timeline</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 36 months"
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                        value={formData.timeline || ''}
                        onChange={e => setFormData({...formData, timeline: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Completion Date</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                        value={formData.date || ''}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">The Challenge</label>
                     <textarea 
                       rows={4}
                       className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none neon-input transition-all"
                       value={formData.challenge || ''}
                       onChange={e => setFormData({...formData, challenge: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Our Solution</label>
                     <textarea 
                       rows={4}
                       className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none neon-input transition-all"
                       value={formData.solution || ''}
                       onChange={e => setFormData({...formData, solution: e.target.value})}
                     />
                   </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Materials Used (Press Enter to add)</label>
                    <div className="flex flex-wrap gap-2 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 neon-input transition-all">
                      {formData.materials?.map((mat, i) => (
                        <span key={i} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-sm">
                          {mat} <button type="button" onClick={() => removeMaterial(i)}><X size={12} /></button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        className="flex-1 outline-none min-w-[120px] bg-transparent text-slate-900 dark:text-white placeholder-slate-400"
                        placeholder="Add material..."
                        value={materialInput}
                        onChange={e => setMaterialInput(e.target.value)}
                        onKeyDown={addMaterial}
                      />
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client Testimonial</label>
                     <textarea 
                       rows={2}
                       placeholder="Quote from the client..."
                       className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none italic neon-input transition-all"
                       value={formData.clientTestimonial || ''}
                       onChange={e => setFormData({...formData, clientTestimonial: e.target.value})}
                     />
                   </div>
              </section>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all neon-transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="px-6 py-2.5 text-white font-medium rounded-lg neon-button disabled:opacity-50"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
