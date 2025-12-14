
import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { api } from '../services/mockApi';
import { Save, Loader2, Upload, ImageIcon, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { TrustedCompany } from '../types';
import { ImageCropper } from '../components/ImageCropper';

export const Settings = () => {
  const { settings, updateSettings, isLoading } = useSettings();
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Cropper State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Trusted Company Form State
  const [newCompany, setNewCompany] = useState<Partial<TrustedCompany>>({ name: '', websiteUrl: '', logoUrl: '' });
  const [uploadingCompanyLogo, setUploadingCompanyLogo] = useState(false);

  // Sync form data when settings load
  useEffect(() => {
    if (settings) {
        setFormData(settings);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setSaving(true);
    try {
      await updateSettings(formData);
      alert('Settings saved successfully!');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowCropper(true);
    }
    // Reset input
    e.target.value = '';
  };

  const handleLogoCrop = async (croppedFile: File) => {
    setShowCropper(false);
    if (!formData) return;
    
    setUploadingLogo(true);
    try {
      const url = await api.uploadFile(croppedFile);
      setFormData({ ...formData, logoUrl: url });
    } catch (error) {
      console.error("Logo upload failed", error);
      alert("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      setSelectedFile(null);
    }
  };

  // Trusted Companies Logic (No cropper needed for client logos usually, but can be added if requested)
  const handleCompanyLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingCompanyLogo(true);
      try {
        const url = await api.uploadFile(file);
        setNewCompany({ ...newCompany, logoUrl: url });
      } catch (error) {
        console.error("Company logo upload failed", error);
        alert("Failed to upload company logo");
      } finally {
        setUploadingCompanyLogo(false);
      }
    }
  };

  const addCompany = () => {
    if (newCompany.name && newCompany.logoUrl) {
      const company: TrustedCompany = {
        id: Math.random().toString(),
        name: newCompany.name,
        logoUrl: newCompany.logoUrl,
        websiteUrl: newCompany.websiteUrl || '#'
      };
      
      const updatedCompanies = [...(formData?.trustedCompanies || []), company];
      setFormData({ ...formData!, trustedCompanies: updatedCompanies });
      
      // Reset form
      setNewCompany({ name: '', websiteUrl: '', logoUrl: '' });
    } else {
        alert("Company Name and Logo are required");
    }
  };

  const removeCompany = (id: string) => {
    const updatedCompanies = formData?.trustedCompanies?.filter(c => c.id !== id) || [];
    setFormData({ ...formData!, trustedCompanies: updatedCompanies });
  };

  if (isLoading || !formData) return <div className="p-12 text-center text-slate-400">Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-8">
       {showCropper && selectedFile && (
          <ImageCropper 
            file={selectedFile}
            aspectRatio={1}
            isRound={true} // Round mask for logo
            onCrop={handleLogoCrop}
            onCancel={() => { setShowCropper(false); setSelectedFile(null); }}
          />
       )}

       <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Website Settings</h2>
          <p className="text-slate-500 dark:text-slate-400">Global configuration for your public website.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* General Section */}
          <div className="hover-3d bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">General Info & Branding</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Site Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                  value={formData.siteName}
                  onChange={e => setFormData({...formData, siteName: e.target.value})}
                />
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Website Logo (Round Crop)</label>
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden relative shadow-sm neon-icon">
                       {uploadingLogo && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10"><Loader2 className="animate-spin text-white" /></div>}
                       {formData.logoUrl ? (
                         <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                       ) : (
                         <ImageIcon className="text-slate-400" />
                       )}
                    </div>
                    <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover-3d flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                        <Upload size={16} /> {uploadingLogo ? 'Processing...' : 'Change Logo'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} disabled={uploadingLogo} />
                    </label>
                 </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="hover-3d bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Public Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                  value={formData.contactEmail}
                  onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                  value={formData.contactPhone}
                  onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Footer Text</label>
                 <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                  value={formData.footerText}
                  onChange={e => setFormData({...formData, footerText: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Trusted Clients Section */}
          <div className="hover-3d bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Trusted Clients / Companies</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Manage the list of companies shown in the "Trusted By" section of the footer.</p>
              
              {/* Add New Company */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase">Add New Client</h4>
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative">
                          {uploadingCompanyLogo && <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10"><Loader2 className="animate-spin text-white" size={16} /></div>}
                          {newCompany.logoUrl ? (
                              <img src={newCompany.logoUrl} alt="Preview" className="w-full h-full object-contain p-1" />
                          ) : (
                              <ImageIcon className="text-slate-300" />
                          )}
                      </div>
                      <div className="flex-1 space-y-3 w-full">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input 
                                  type="text" 
                                  placeholder="Company Name"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm neon-input"
                                  value={newCompany.name}
                                  onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                              />
                              <input 
                                  type="text" 
                                  placeholder="Official Website Link (e.g. https://company.com)"
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm neon-input"
                                  value={newCompany.websiteUrl}
                                  onChange={e => setNewCompany({...newCompany, websiteUrl: e.target.value})}
                              />
                          </div>
                          <div className="flex gap-2">
                              <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
                                  <Upload size={14} /> {uploadingCompanyLogo ? 'Uploading...' : 'Upload Logo'}
                                  <input type="file" accept="image/*" className="hidden" onChange={handleCompanyLogoUpload} disabled={uploadingCompanyLogo} />
                              </label>
                              <button 
                                  type="button" 
                                  onClick={addCompany}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1 neon-button"
                              >
                                  <Plus size={14} /> Add Company
                              </button>
                          </div>
                      </div>
                  </div>
              </div>

              {/* List Companies */}
              <div className="space-y-3">
                  {formData.trustedCompanies?.map((company) => (
                      <div key={company.id} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg group hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                          <div className="w-12 h-12 bg-white rounded border border-slate-100 flex items-center justify-center p-1">
                              <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1">
                              <h5 className="font-bold text-slate-800 dark:text-white text-sm">{company.name}</h5>
                              <a href={company.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                  {company.websiteUrl} <LinkIcon size={10} />
                              </a>
                          </div>
                          <button 
                              type="button" 
                              onClick={() => removeCompany(company.id)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove Company"
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                  ))}
                  {(!formData.trustedCompanies || formData.trustedCompanies.length === 0) && (
                      <div className="text-center py-6 text-slate-400 text-sm italic">
                          No trusted companies added yet.
                      </div>
                  )}
              </div>
          </div>

          <div className="flex justify-end pt-4 sticky bottom-0 bg-slate-50 dark:bg-slate-950 py-4 border-t border-slate-200 dark:border-slate-800 z-10">
             <button 
               type="submit" 
               disabled={saving}
               className="px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 disabled:opacity-70 neon-button text-white shadow-lg"
             >
               {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
               {saving ? 'Saving Changes...' : 'Save All Settings'}
             </button>
          </div>
        </form>
    </div>
  );
};
