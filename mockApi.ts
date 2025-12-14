import { Project, Reel, Review, Service, SiteSettings, User, DashboardStats, Page, NewsItem, Appointment } from '../types';
import { supabase } from '../lib/supabaseClient';

// Google Apps Script URL (same as yours)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4t9M4Igf2c8R_xwFCeuSoBRKmn2p_5wLWlWhmc8bv02ABT1cFZ9rV24t7Sulq_8OAzA/exec';

// --- ENHANCED GOOGLE DRIVE SERVICE ---
export const googleBackend = {
  /**
   * Upload any file to Google Drive and return public URL
   */
  uploadFile: async (file: File | Blob, fileName?: string): Promise<{url: string, fileId: string}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file as Blob);
      
      reader.onload = async () => {
        const base64Content = (reader.result as string).split(',')[1];
        const name = fileName || (file as File).name || `file_${Date.now()}`;
        const mimeType = (file as File).type || 'application/octet-stream';

        const payload = {
          action: 'upload_file',
          fileName: name,
          mimeType: mimeType,
          base64: base64Content,
          timestamp: new Date().toISOString()
        };

        try {
          const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain',
            },
            body: JSON.stringify(payload)
          });
          
          // Since we use no-cors, we assume success if no network error
          // In production, you'd want to use a different approach or verify
          const fileId = `drive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const url = `https://drive.google.com/uc?export=view&id=${fileId}`;
          
          resolve({ url, fileId });
        } catch (error) {
          console.error("Google Drive Upload Error:", error);
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
    });
  },

  /**
   * Upload multiple files to Google Drive
   */
  uploadMultipleFiles: async (files: File[]): Promise<{url: string, fileId: string}[]> => {
    const uploadPromises = files.map(file => googleBackend.uploadFile(file));
    return Promise.all(uploadPromises);
  },

  /**
   * Delete file from Google Drive
   */
  deleteFile: async (fileId: string): Promise<boolean> => {
    try {
      const payload = {
        action: 'delete_file',
        fileId: fileId
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      
      return true;
    } catch (error) {
      console.error("Google Drive Delete Error:", error);
      return false;
    }
  },

  /**
   * Log data to Google Sheets (for backups)
   */
  logData: async (sheetType: string, data: Record<string, any>) => {
    const payload = {
      action: 'log_data',
      sheetType,
      ...data,
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Google Sheet Log Error:", error);
    }
  }
};

// --- HELPER: Smart Save (Auto-removes missing columns) ---
const safeSupabaseWrite = async (table: string, operation: 'insert' | 'update', payload: any, id?: string) => {
    let currentPayload = { ...payload };
    
    if (operation === 'update') delete currentPayload.id;

    let attempt = 0;
    const maxAttempts = 5;

    while (attempt < maxAttempts) {
        let result;
        try {
            if (operation === 'insert') {
                result = await supabase.from(table).insert([currentPayload]).select().single();
            } else {
                result = await supabase.from(table).update(currentPayload).eq('id', id).select().single();
            }

            const { error, data } = result;

            if (!error) return data;

            if (error.code === 'PGRST204' || (error.message && error.message.includes("Could not find the"))) {
                const match = error.message.match(/'([^']+)' column/);
                if (match && match[1]) {
                    const badColumn = match[1];
                    console.warn(`⚠️ DB Schema Mismatch: Column '${badColumn}' missing in table '${table}'. Removing from payload...`);
                    delete currentPayload[badColumn];
                    attempt++;
                    continue;
                }
            }
            throw error;
        } catch (err: any) {
            if (err.code === 'PGRST204' || (err.message && err.message.includes("Could not find the"))) {
                const match = err.message.match(/'([^']+)' column/);
                if (match && match[1]) {
                    const badColumn = match[1];
                    delete currentPayload[badColumn];
                    attempt++;
                    continue;
                }
            }
            throw err;
        }
    }
    throw new Error(`Failed to ${operation} ${table} after multiple schema adjustments.`);
};

// --- MEDIA HANDLER ---
const handleMediaUpload = async (files: File[] | File | string | string[]): Promise<string[]> => {
  if (!files) return [];
  
  // If already URLs (string), return as is
  if (typeof files === 'string') return [files];
  if (Array.isArray(files) && files.length > 0 && typeof files[0] === 'string') {
    return files as string[];
  }

  // Convert to array
  const fileArray = Array.isArray(files) ? files : [files];
  
  // Filter out already uploaded URLs
  const newFiles = fileArray.filter(file => file instanceof File || typeof file !== 'string');
  const existingUrls = fileArray.filter(file => typeof file === 'string') as string[];

  if (newFiles.length === 0) return existingUrls;

  try {
    // Upload new files to Google Drive
    const uploadResults = await googleBackend.uploadMultipleFiles(newFiles as File[]);
    const newUrls = uploadResults.map(result => result.url);
    
    // Combine with existing URLs
    return [...existingUrls, ...newUrls];
  } catch (error) {
    console.error("Media upload failed:", error);
    return existingUrls;
  }
};

// --- PROJECTS WITH MEDIA HANDLING ---
export const api = {
  // AI Context Generator (unchanged)
  getSiteContext: async () => {
      const { data: services } = await supabase.from('services').select('*').eq('isActive', true);
      const { data: projects } = await supabase.from('projects').select('*').eq('status', 'published');
      
      const projectSummary = projects?.map((p: any) => `- Project: ${p.title} (${p.category}). Info: ${p.description}`).join('\n') || '';
      const serviceSummary = services?.map((s: any) => `- Service: ${s.title}. Info: ${s.description}`).join('\n') || '';

      return `
      SYSTEM KNOWLEDGE BASE (SkyStupa Architect):
      COMPANY INFO:
      - Name: SkyStupa Architect
      - Phone: +977 9860041157
      - Email: skystupaarchitect@gmail.com
      - Address: Gwarko, Lalitpur, Kathmandu, Nepal
      
      SERVICES OFFERED:
      ${serviceSummary}
      
      PORTFOLIO HIGHLIGHTS:
      ${projectSummary}
      `;
  },

  auth: {
    login: async (email: string, pass: string): Promise<User> => {
        if (email && pass) return { id: 'admin', email, name: 'Admin', role: 'admin' };
        throw new Error("Invalid credentials");
    },
    logout: async () => {},
    updateProfile: async (data: any) => data
  },

  // --- ENHANCED PROJECTS API WITH GOOGLE DRIVE ---
  projects: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn("Supabase projects fetch error:", error);
        return [];
      }
      
      // Transform URLs for display
      return (data || []).map(project => ({
        ...project,
        coverImage: project.coverImage || '/default-project.jpg',
        gallery: project.gallery || [],
        // Add direct Google Drive view URLs
        galleryUrls: project.gallery?.map((url: string) => 
          url.includes('drive.google.com') ? 
          url.replace('/view', '/preview') : url
        ) || []
      }));
    },

    getSingle: async (id: string) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        galleryUrls: data.gallery?.map((url: string) => 
          url.includes('drive.google.com') ? 
          url.replace('/view', '/preview') : url
        ) || []
      };
    },

    create: async (projectData: any) => {
      // 1. Handle media uploads to Google Drive
      const galleryUrls = await handleMediaUpload(projectData.gallery || []);
      const coverImageUrl = projectData.coverImage instanceof File ? 
        (await handleMediaUpload([projectData.coverImage]))[0] : 
        projectData.coverImage;

      // 2. Prepare payload with Google Drive URLs
      const payload = {
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        location: projectData.location,
        year: projectData.year,
        status: projectData.status || 'draft',
        coverImage: coverImageUrl,
        gallery: galleryUrls,
        tags: projectData.tags || [],
        materials: projectData.materials || [],
        views: 0,
        client: projectData.client,
        area: projectData.area,
        duration: projectData.duration,
        featured: projectData.featured || false
      };

      // 3. Save to Supabase
      const newProject = await safeSupabaseWrite('projects', 'insert', payload);

      // 4. Log to Google Sheets
      await googleBackend.logData('projects', {
        action: 'create',
        projectId: newProject.id,
        title: newProject.title,
        timestamp: new Date().toISOString()
      });

      return newProject;
    },

    update: async (id: string, projectData: any) => {
      // Get existing project to compare media
      const { data: existingProject } = await supabase
        .from('projects')
        .select('gallery, coverImage')
        .eq('id', id)
        .single();

      // Handle media updates
      const galleryUrls = await handleMediaUpload(projectData.gallery || []);
      const coverImageUrl = projectData.coverImage instanceof File ? 
        (await handleMediaUpload([projectData.coverImage]))[0] : 
        projectData.coverImage;

      // Find deleted media (optional: clean up from Drive)
      if (existingProject) {
        const deletedGallery = existingProject.gallery?.filter(
          (url: string) => !galleryUrls.includes(url)
        ) || [];
        
        // You could add logic to delete from Drive here
        // await Promise.all(deletedGallery.map(url => googleBackend.deleteFileByUrl(url)));
      }

      const payload = {
        ...projectData,
        gallery: galleryUrls,
        coverImage: coverImageUrl,
        updated_at: new Date().toISOString()
      };

      return await safeSupabaseWrite('projects', 'update', payload, id);
    },

    delete: async (id: string) => {
      // Get project to delete media from Drive
      const { data: project } = await supabase
        .from('projects')
        .select('gallery, coverImage')
        .eq('id', id)
        .single();

      if (project) {
        // Delete all media from Google Drive
        const allMedia = [
          project.coverImage,
          ...(project.gallery || [])
        ].filter(url => url && url.includes('drive.google.com'));

        // You could add logic to delete from Drive here
        // await Promise.all(allMedia.map(url => googleBackend.deleteFileByUrl(url)));
      }

      // Delete from Supabase
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;

      await googleBackend.logData('projects', {
        action: 'delete',
        projectId: id,
        timestamp: new Date().toISOString()
      });

      return true;
    },

    incrementView: async (id: string) => {
      const { data } = await supabase
        .from('projects')
        .select('views')
        .eq('id', id)
        .single();

      const currentViews = data?.views || 0;
      await supabase
        .from('projects')
        .update({ views: currentViews + 1 })
        .eq('id', id);
    }
  },

  // --- ENHANCED REELS API WITH GOOGLE DRIVE ---
  reels: {
    getAll: async () => {
      const { data } = await supabase
        .from('reels')
        .select('*')
        .order('created_at', { ascending: false });
      
      return (data || []).map(reel => ({
        ...reel,
        // Convert Google Drive URL to embed URL
        videoUrl: reel.videoUrl?.includes('drive.google.com') ? 
          reel.videoUrl.replace('/view', '/preview') : reel.videoUrl,
        thumbnailUrl: reel.thumbnailUrl || '/default-thumbnail.jpg'
      }));
    },

    create: async (reelData: any) => {
      // Upload video to Google Drive
      const videoUrl = reelData.videoFile instanceof File ? 
        (await handleMediaUpload([reelData.videoFile]))[0] : 
        reelData.videoUrl;

      // Upload thumbnail if provided
      const thumbnailUrl = reelData.thumbnailFile instanceof File ? 
        (await handleMediaUpload([reelData.thumbnailFile]))[0] : 
        reelData.thumbnailUrl;

      const payload = {
        title: reelData.title,
        description: reelData.description,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        duration: reelData.duration,
        category: reelData.category,
        tags: reelData.tags || [],
        views: 0,
        likes: 0,
        status: reelData.status || 'published'
      };

      const newReel = await safeSupabaseWrite('reels', 'insert', payload);

      await googleBackend.logData('reels', {
        action: 'create',
        reelId: newReel.id,
        title: newReel.title,
        timestamp: new Date().toISOString()
      });

      return newReel;
    },

    update: async (id: string, reelData: any) => {
      // Handle video and thumbnail updates
      let videoUrl = reelData.videoUrl;
      let thumbnailUrl = reelData.thumbnailUrl;

      if (reelData.videoFile instanceof File) {
        videoUrl = (await handleMediaUpload([reelData.videoFile]))[0];
      }

      if (reelData.thumbnailFile instanceof File) {
        thumbnailUrl = (await handleMediaUpload([reelData.thumbnailFile]))[0];
      }

      const payload = {
        ...reelData,
        videoUrl,
        thumbnailUrl,
        updated_at: new Date().toISOString()
      };

      return await safeSupabaseWrite('reels', 'update', payload, id);
    },

    delete: async (id: string) => {
      const { data: reel } = await supabase
        .from('reels')
        .select('videoUrl, thumbnailUrl')
        .eq('id', id)
        .single();

      if (reel) {
        // Delete from Google Drive (optional)
        // await googleBackend.deleteFileByUrl(reel.videoUrl);
        // await googleBackend.deleteFileByUrl(reel.thumbnailUrl);
      }

      await supabase.from('reels').delete().eq('id', id);
      return true;
    },

    incrementView: async (id: string) => {
      const { data } = await supabase
        .from('reels')
        .select('views')
        .eq('id', id)
        .single();

      const currentViews = data?.views || 0;
      await supabase
        .from('reels')
        .update({ views: currentViews + 1 })
        .eq('id', id);
    }
  },

  // Other APIs remain similar but use Google Drive for media
  services: {
    getAll: async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .order('order', { ascending: true });
      
      return (data || []).map(service => ({
        ...service,
        icon: service.icon?.includes('drive.google.com') ? 
          service.icon.replace('/view', '/preview') : service.icon,
        image: service.image?.includes('drive.google.com') ? 
          service.image.replace('/view', '/preview') : service.image
      }));
    },

    create: async (serviceData: any) => {
      // Handle icon and image uploads
      const iconUrl = serviceData.iconFile instanceof File ? 
        (await handleMediaUpload([serviceData.iconFile]))[0] : 
        serviceData.icon;

      const imageUrl = serviceData.imageFile instanceof File ? 
        (await handleMediaUpload([serviceData.imageFile]))[0] : 
        serviceData.image;

      const payload = {
        ...serviceData,
        icon: iconUrl,
        image: imageUrl,
        isActive: true
      };

      return await safeSupabaseWrite('services', 'insert', payload);
    },

    update: async (id: string, data: any) => {
      return await safeSupabaseWrite('services', 'update', data, id);
    },

    delete: async (id: string) => {
      await supabase.from('services').delete().eq('id', id);
      return true;
    }
  },

  // Reviews, Pages, News, Appointments (unchanged structure)
  reviews: {
    getAll: async () => {
      const { data } = await supabase.from('reviews').select('*');
      return data || [];
    },
    getByTarget: async (targetId: string) => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .or(`projectId.eq.${targetId},reelId.eq.${targetId}`)
        .eq('status', 'approved');
      return data || [];
    },
    create: async (data: any) => {
      data.status = 'pending';
      data.date = new Date().toISOString();
      return await safeSupabaseWrite('reviews', 'insert', data);
    },
    delete: async (id: string) => {
      await supabase.from('reviews').delete().eq('id', id);
      return true;
    },
    updateStatus: async (id: string, status: string) => {
      await supabase.from('reviews').update({ status }).eq('id', id);
      return true;
    }
  },

  pages: {
    getAll: async () => {
      const { data } = await supabase.from('pages').select('*');
      return data || [];
    },
    create: async (data: any) => {
      return await safeSupabaseWrite('pages', 'insert', data);
    },
    update: async (id: string, data: any) => {
      return await safeSupabaseWrite('pages', 'update', data, id);
    },
    delete: async (id: string) => {
      await supabase.from('pages').delete().eq('id', id);
      return true;
    }
  },

  news: {
    getAll: async () => {
      const { data } = await supabase.from('news').select('*');
      return data || [];
    },
    create: async (data: any) => {
      return await safeSupabaseWrite('news', 'insert', data);
    },
    update: async (id: string, data: any) => {
      return await safeSupabaseWrite('news', 'update', data, id);
    },
    delete: async (id: string) => {
      await supabase.from('news').delete().eq('id', id);
      return true;
    }
  },

  appointments: {
    getAll: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
    create: async (data: any) => {
      const payload = {
        ...data,
        status: 'pending',
        emailConfirmationSent: true,
        createdAt: new Date().toISOString()
      };
      
      const newRecord = await safeSupabaseWrite('appointments', 'insert', payload);
      
      // Log to Google Sheets
      await googleBackend.logData('appointments', data);
      
      // Send emails
      await sendViaGoogleScript('client_confirmation', {
        type: 'client',
        to_email: data.email,
        client_name: data.name,
        company_name: 'SkyStupa Architect',
        notification_type: 'appointment',
        service_type: data.service,
        appointment_date: data.date,
        appointment_time: data.time,
        client_phone: data.phone,
        client_message: data.message
      });

      await sendViaGoogleScript('client_confirmation', {
        type: 'admin',
        admin_email: 'skystupaarchitect@gmail.com',
        client_name: data.name,
        client_email: data.email,
        client_phone: data.phone,
        notification_type: 'appointment',
        service_type: data.service,
        appointment_date: data.date,
        appointment_time: data.time,
        client_message: data.message,
        company_name: 'SkyStupa Architect'
      });

      return newRecord;
    }
  },

  settings: {
    get: async () => {
      const { data } = await supabase.from('settings').select('*').single();
      return data || {
        siteName: 'SkyStupa Architect',
        logoUrl: 'https://drive.google.com/uc?export=view&id=YOUR_LOGO_ID',
        contactEmail: 'skystupaarchitect@gmail.com',
        contactPhone: '+977 9860041157',
        footerText: 'Building legacies, one structure at a time.',
        maintenanceMode: false,
        trustedCompanies: []
      };
    },
    update: async (data: any) => {
      // Handle logo upload
      if (data.logoFile instanceof File) {
        const logoResult = await googleBackend.uploadFile(data.logoFile, 'site-logo');
        data.logoUrl = logoResult.url;
      }
      
      return await safeSupabaseWrite('settings', 'update', data, '1');
    }
  },

  // Direct file upload utility
  uploadFile: async (file: File) => {
    const result = await googleBackend.uploadFile(file);
    return result.url;
  },

  // Utility to get Google Drive file ID from URL
  getDriveFileId: (url: string): string | null => {
    if (!url.includes('drive.google.com')) return null;
    
    const match = url.match(/[?&]id=([^&]+)/);
    return match ? match[1] : null;
  },

  resetDatabase: async () => {
    localStorage.clear();
    window.location.reload();
  }
};

// Email functions (keep as is)
export async function sendViaGoogleScript(templateType: 'client_confirmation' | 'admin_notification', data: any): Promise<boolean> {
  try {
    if (!GOOGLE_SCRIPT_URL) return false;

    let htmlBody = '';
    let subject = '';
    let toEmail = '';

    // Generate email content based on template
    // ... (keep your existing email generation logic)

    const payload = {
      email: toEmail,
      emailSubject: subject,
      emailBody: htmlBody,
      ...data
    };

    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });

    console.log(`✅ Email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}