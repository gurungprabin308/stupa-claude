import React, { useEffect, useState } from 'react';
import { api } from '../services/mockApi';
import { Service } from '../types';
import { 
    GripVertical, 
    MoreHorizontal, 
    CheckCircle2, 
    Circle, 
    Plus, 
    X, 
    Edit2, 
    Trash2,
    MessageSquare,
    MapPin,
    PenTool,
    FileText,
    Box
} from 'lucide-react';

const ICONS: Record<string, any> = {
    MessageSquare,
    MapPin,
    PenTool,
    FileText,
    Box
};

export const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Service>>({});
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const data = await api.services.getAll();
    setServices(data);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this service?')) {
        await api.services.delete(id);
        loadServices();
    }
  };

  const openModal = (service?: Service) => {
      if (service) {
          setEditingService(service);
          setFormData({ ...service });
      } else {
          setEditingService(null);
          setFormData({ isActive: true, features: [], icon: 'Box' });
      }
      setIsModalOpen(true);
  };

  const addFeature = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && featureInput.trim()) {
        e.preventDefault();
        setFormData({ ...formData, features: [...(formData.features || []), featureInput.trim()] });
        setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
      const newFeatures = [...(formData.features || [])];
      newFeatures.splice(index, 1);
      setFormData({ ...formData, features: newFeatures });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (editingService) {
              await api.services.update(editingService.id, formData);
          } else {
              await api.services.create(formData as any);
          }
          setIsModalOpen(false);
          loadServices();
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Services</h2>
          <p className="text-slate-500 dark:text-slate-400">Configure the services and key features listed on your site.</p>
        </div>
        <button 
            onClick={() => openModal()}
            className="text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 neon-button"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      <div className="space-y-4">
        {services.map((service) => {
            const IconComponent = ICONS[service.icon] || Box;
            return (
                <div key={service.id} className="hover-3d bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 group transition-all duration-300">
                    <div className="flex items-start gap-4 flex-1">
                        <div className="cursor-move text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 mt-2">
                           <GripVertical size={20} />
                        </div>
                        
                        <div className="w-12 h-12 shrink-0 rounded-lg bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white shadow-lg neon-icon">
                           <IconComponent size={24} className="text-blue-400" />
                        </div>

                        <div className="flex-1">
                           <h4 className="font-bold text-slate-800 dark:text-white text-lg">{service.title}</h4>
                           <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{service.description}</p>
                           
                           {/* Feature Tags Preview */}
                           <div className="flex flex-wrap gap-2">
                               {service.features?.slice(0, 3).map((f, i) => (
                                   <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                       • {f}
                                   </span>
                               ))}
                               {(service.features?.length || 0) > 3 && (
                                   <span className="text-xs text-slate-400 dark:text-slate-500 py-1">+{service.features.length - 3} more</span>
                               )}
                           </div>
                        </div>
                    </div>

                    <div className="flex md:flex-col items-center justify-between md:justify-center md:items-end gap-3 pl-4 md:border-l border-slate-100 dark:border-slate-800 min-w-[140px]">
                       <div className="flex items-center gap-2 text-sm">
                          {service.isActive ? (
                            <span className="flex items-center gap-1 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md font-bold text-xs uppercase tracking-wider">
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md font-bold text-xs uppercase tracking-wider">
                              Inactive
                            </span>
                          )}
                       </div>
                       
                       <div className="flex items-center gap-2">
                           <button 
                             onClick={() => openModal(service)}
                             className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors neon-transition"
                             title="Edit Service"
                           >
                             <Edit2 size={18} />
                           </button>
                           <button 
                             onClick={() => handleDelete(service.id)}
                             className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors neon-transition"
                             title="Delete Service"
                           >
                             <Trash2 size={18} />
                           </button>
                       </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 neon-transition">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service Title</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                    value={formData.title || ''}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea 
                    required 
                    rows={2}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Icon</label>
                  <div className="flex gap-4">
                      {Object.keys(ICONS).map(iconKey => {
                          const Icon = ICONS[iconKey];
                          const isSelected = formData.icon === iconKey;
                          return (
                              <button
                                key={iconKey}
                                type="button"
                                onClick={() => setFormData({...formData, icon: iconKey})}
                                className={`p-3 rounded-xl border transition-all neon-transition ${
                                    isSelected 
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-100 dark:ring-blue-900' 
                                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                  <Icon size={24} />
                              </button>
                          )
                      })}
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Key Features (Bullet Points)</label>
                    <div className="flex flex-col gap-2 p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950 neon-input transition-all">
                      {formData.features?.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-blue-500">•</span>
                          <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{feat}</span>
                          <button type="button" onClick={() => removeFeature(i)} className="text-slate-400 hover:text-red-500 neon-transition"><X size={16} /></button>
                        </div>
                      ))}
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
                        placeholder="Type feature and press Enter..."
                        value={featureInput}
                        onChange={e => setFeatureInput(e.target.value)}
                        onKeyDown={addFeature}
                      />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Service is Active / Visible on site</label>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="px-5 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors neon-transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 text-white font-medium rounded-lg neon-button"
                    >
                      Save Service
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};