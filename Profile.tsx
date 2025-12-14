
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/mockApi';
import { Save, Loader2, Upload, User as UserIcon } from 'lucide-react';
import { ImageCropper } from '../components/ImageCropper';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Cropper State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowCropper(true);
    }
    e.target.value = ''; // Reset input
  };

  const handleAvatarCrop = async (croppedFile: File) => {
      setShowCropper(false);
      setUploading(true);
      try {
        const url = await api.uploadFile(croppedFile);
        setAvatar(url);
      } catch (error) {
        console.error("Avatar upload failed", error);
        alert("Failed to upload avatar");
      } finally {
        setUploading(false);
        setSelectedFile(null);
      }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    setSaving(true);
    try {
      await updateProfile({ name, avatar });
      alert('Profile updated successfully!');
    } catch (error) {
        alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
       {showCropper && selectedFile && (
          <ImageCropper 
            file={selectedFile}
            aspectRatio={1}
            isRound={true}
            onCrop={handleAvatarCrop}
            onCancel={() => { setShowCropper(false); setSelectedFile(null); }}
          />
       )}
       
       <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Profile</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage your admin identity and appearance.</p>
        </div>

        <form onSubmit={handleSave} className="hover-3d bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex flex-col items-center mb-8">
                <div className="relative group cursor-pointer">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-lg neon-icon relative">
                        {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10"><Loader2 className="animate-spin text-white" /></div>}
                        {avatar ? (
                            <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <UserIcon size={48} />
                            </div>
                        )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer text-white font-medium text-xs z-20">
                        <Upload size={20} className="mr-1" /> {uploading ? '...' : 'Change'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} disabled={uploading} />
                    </label>
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Allowed *.jpeg, *.jpg, *.png</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none neon-input transition-all"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      disabled
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      value={user?.email || ''}
                    />
                    <p className="text-xs text-slate-400 mt-1">Email cannot be changed as it is linked to company access.</p>
                </div>
            </div>

            <div className="flex justify-end pt-8">
                <button 
                  type="submit" 
                  disabled={saving || uploading}
                  className="px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 disabled:opacity-70 neon-button text-white"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {saving ? 'Updating...' : 'Update Profile'}
                </button>
            </div>
        </form>
    </div>
  );
};
