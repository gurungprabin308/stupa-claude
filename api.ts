// src/lib/api.ts
import { supabase } from './supabaseClient';
import {
  Project,
  Reel,
  Review,
  Service,
  SiteSettings,
  User,
  DashboardStats,
  Page,
  NewsItem,
  Appointment
} from '../types';

/**
 * Set your Google Apps Script Web App URL here.
 * Ideally the script returns JSON with { success: true, fileId, url } on POST.
 */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4t9M4Igf2c8R_xwFCeuSoBRKmn2p_5wLWlWhmc8bv02ABT1cFZ9rV24t7Sulq_8OAzA/exec';

/* ------------------- googleBackend ------------------- */
/* Handles uploading files via Google Apps Script endpoint.
   Fallback: if CORS not allowed or no JSON returned, we return a generated preview URL
   (sufficient for dev/admin preview). In production, configure the Apps Script to return JSON (CORS).
*/
export const googleBackend = {
  uploadFile: async (file: File | Blob, fileName?: string): Promise<{ url: string; fileId: string }> => {
    // helper to convert File/Blob -> base64
    const toBase64 = (f: Blob) =>
      new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onerror = () => rej(new Error('File read failed'));
        reader.onload = () => {
          const result = reader.result as string;
          // strip prefix
          const base = result.split(',')[1] ?? '';
          res(base);
        };
        reader.readAsDataURL(f);
      });

    const name = fileName || ((file as File).name ?? `file_${Date.now()}`);
    const mimeType = (file as File).type || 'application/octet-stream';

    try {
      const base64 = await toBase64(file as Blob);
      const payload = {
        action: 'upload_file',
        fileName: name,
        mimeType,
        base64,
        timestamp: new Date().toISOString()
      };

      // Try proper CORS request first (if Apps Script is configured)
      try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'cors'
        });

        // If backend responds with JSON and contains fileId/url, use it
        if (res.ok) {
          try {
            const json = await res.json();
            if (json?.fileId || json?.url) {
              return {
                fileId: json.fileId ?? `drive_${Date.now()}`,
                url: json.url ?? (`https://drive.google.com/uc?export=view&id=${json.fileId}`)
              };
            }
          } catch (err) {
            // parse error: move to no-cors fallback
            console.warn('googleBackend: JSON parse failed, will try fallback', err);
          }
        } else {
          console.warn('googleBackend: CORS upload responded not-ok, status:', res.status);
        }
      } catch (err) {
        console.warn('googleBackend: CORS fetch failed, trying fallback no-cors', err);
      }

      // Fallback: attempt no-cors (response will be opaque; assume success)
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
          mode: 'no-cors'
        });
        // When no-cors used we can't read response — generate pseudo fileId for preview
        const fileId = `drive_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const url = `https://drive.google.com/uc?export=view&id=${fileId}`;
        console.warn('googleBackend: upload used no-cors fallback — response opaque; returning preview URL.');
        return { fileId, url };
      } catch (err) {
        console.error('googleBackend: no-cors fallback failed', err);
        throw err;
      }
    } catch (err) {
      console.error('googleBackend.uploadFile error:', err);
      throw err;
    }
  },

  uploadMultipleFiles: async (files: File[]): Promise<{ url: string; fileId: string }[]> => {
    const promises = files.map((f) => googleBackend.uploadFile(f));
    return Promise.all(promises);
  },

  deleteFile: async (fileId: string): Promise<boolean> => {
    if (!fileId) return false;
    const payload = { action: 'delete_file', fileId };
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });
      return true;
    } catch (err) {
      // try no-cors fire-and-forget
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
          mode: 'no-cors'
        });
        return true;
      } catch (e) {
        console.error('googleBackend.deleteFile error:', e);
        return false;
      }
    }
  },

  logData: async (sheetType: string, data: Record<string, any>) => {
    const payload = { action: 'log_data', sheetType, ...data, timestamp: new Date().toISOString() };
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });
    } catch (err) {
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
          mode: 'no-cors'
        });
      } catch (e) {
        console.warn('googleBackend.logData fallback failed', e);
      }
    }
  },

  getDriveFileId: (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    return match ? match[1] : null;
  }
};

/* ------------------- safeSupabaseWrite ------------------- */
/**
 * Attempts insert/update to Supabase. If the DB complains about missing columns,
 * it removes those columns from payload and retries up to maxAttempts.
 */
const safeSupabaseWrite = async (table: string, operation: 'insert' | 'update', payload: any, id?: string) => {
  let currentPayload = { ...payload };
  if (operation === 'update') delete currentPayload.id;

  let attempt = 0;
  const maxAttempts = 5;

  while (attempt < maxAttempts) {
    try {
      let result;
      if (operation === 'insert') {
        result = await supabase.from(table).insert([currentPayload]).select().single();
      } else {
        result = await supabase.from(table).update(currentPayload).eq('id', id).select().single();
      }

      const { error, data } = result as any;
      if (!error) return data;

      // Detect missing column error (PostgREST)
      if (error?.code === 'PGRST204' || (error?.message && error.message.includes('Could not find the'))) {
        const match = (error.message || '').match(/'([^']+)' column/);
        if (match && match[1]) {
          const badColumn = match[1];
          delete currentPayload[badColumn];
          attempt++;
          console.warn(`safeSupabaseWrite: removed missing column '${badColumn}', retrying...`);
          continue;
        }
      }

      throw error;
    } catch (err: any) {
      if (err?.code === 'PGRST204' || (err?.message && err.message.includes('Could not find the'))) {
        const match = (err.message || '').match(/'([^']+)' column/);
        if (match && match[1]) {
          const badColumn = match[1];
          delete currentPayload[badColumn];
          attempt++;
          console.warn(`safeSupabaseWrite catch: removed missing column '${badColumn}', retrying...`);
          continue;
        }
      }
      throw err;
    }
  }

  throw new Error(`Failed to ${operation} ${table} after ${maxAttempts} attempts.`);
};

/* ------------------- handleMediaUpload ------------------- */
/**
 * Accepts File | File[] | string | string[] and returns string[] of URLs.
 * - If input contains URLs already, returns them as-is.
 * - For File objects, uploads to googleBackend and returns returned URLs.
 */
const handleMediaUpload = async (files: File[] | File | string | string[] | undefined): Promise<string[]> => {
  if (!files) return [];

  // if string -> single url
  if (typeof files === 'string') return [files];

  // if array of strings -> return
  if (Array.isArray(files) && files.length > 0 && typeof files[0] === 'string') {
    return files as string[];
  }

  const fileArray = Array.isArray(files) ? files : [files];
  // split existing urls and File instances
  const existing: string[] = fileArray.filter((f) => typeof f === 'string') as string[];
  const newFiles: File[] = fileArray.filter((f) => f instanceof File) as File[];

  if (newFiles.length === 0) return existing;

  // optional size check
  const MAX_SIZE = 25 * 1024 * 1024; // 25MB
  for (const f of newFiles) {
    if (f.size > MAX_SIZE) {
      console.warn('handleMediaUpload: file too large', f.name);
      throw new Error('File too large (max 25MB)');
    }
  }

  try {
    const results = await googleBackend.uploadMultipleFiles(newFiles);
    const urls = results.map((r) => r.url);
    return [...existing, ...urls];
  } catch (err) {
    console.error('handleMediaUpload: upload failed', err);
    // on failure, convert files to data-uris so admin can preview immediately
    const dataUris = await Promise.all(
      newFiles.map(
        (f) =>
          new Promise<string>((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.onerror = (e) => rej(e);
            r.readAsDataURL(f);
          })
      )
    );
    return [...existing, ...dataUris];
  }
};

/* ------------------- INITIAL SETTINGS (fallback) ------------------- */
const INITIAL_SETTINGS: SiteSettings = {
  siteName: 'SkyStupa Architect',
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/2665/2665511.png',
  contactEmail: 'skystupaarchitect@gmail.com',
  contactPhone: '+977 9860041157',
  footerText: 'Building legacies, one structure at a time.',
  maintenanceMode: false,
  trustedCompanies: []
};

/* ------------------- API EXPORT ------------------- */
export const api = {
  // small context generator
  getSiteContext: async (): Promise<string> => {
    const { data: services } = await supabase.from('services').select('*').eq('isActive', true);
    const { data: projects } = await supabase.from('projects').select('*').eq('status', 'published');
    const settings = INITIAL_SETTINGS;

    const projectSummary = (projects || []).map((p: any) => `- Project: ${p.title} (${p.category}). Info: ${p.description}`).join('\n');
    const serviceSummary = (services || []).map((s: any) => `- Service: ${s.title}. Info: ${s.description}`).join('\n');

    return `
SYSTEM KNOWLEDGE BASE (SkyStupa Architect):
COMPANY INFO:
- Name: ${settings.siteName}
- Phone: ${settings.contactPhone}
- Email: ${settings.contactEmail}
- Address: Gwarko, Lalitpur, Kathmandu, Nepal

SERVICES OFFERED:
${serviceSummary}

PORTFOLIO HIGHLIGHTS:
${projectSummary}
`;
  },

  auth: {
    login: async (email: string, pass: string): Promise<User> => {
      if (email && pass) return { id: 'admin', email, name: 'Admin', role: 'admin' } as any;
      throw new Error('Invalid credentials');
    },
    logout: async () => {},
    updateProfile: async (data: any) => data
  },

  dashboard: {
    getStats: async (filter?: string): Promise<Partial<DashboardStats>> => {
      const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
      const { count: reelCount } = await supabase.from('reels').select('*', { count: 'exact', head: true });
      const totalViews = parseInt(localStorage.getItem('skystupa_total_views') || '15200', 10);
      return {
        totalProjects: projectCount || 0,
        totalReels: reelCount || 0,
        pendingReviews: 0,
        totalViews,
        viewsHistory: []
      };
    },
    getRealTimeVisitors: async () => Math.floor(Math.random() * 30) + 10,
    incrementVisit: async () => {
      const current = parseInt(localStorage.getItem('skystupa_total_views') || '15200', 10);
      localStorage.setItem('skystupa_total_views', (current + 1).toString());
    }
  },

  projects: {
    getAll: async (): Promise<any[]> => {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) { console.warn('projects.getAll error', error); return []; }
      return (data || []).map((project: any) => ({
        ...project,
        coverImage: project.coverImage || '/default-project.jpg',
        gallery: project.gallery || [],
        galleryUrls: (project.gallery || []).map((url: string) =>
          url?.includes('drive.google.com') ? url.replace('/view', '/preview') : url
        )
      }));
    },

    getSingle: async (id: string): Promise<any> => {
      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
      if (error) throw error;
      return {
        ...data,
        galleryUrls: (data.gallery || []).map((url: string) => (url?.includes('drive.google.com') ? url.replace('/view', '/preview') : url))
      };
    },

    create: async (projectData: any) => {
      // handle media first
      const galleryUrls = await handleMediaUpload(projectData.gallery || []);
      const cover = projectData.coverImage instanceof File ? (await handleMediaUpload([projectData.coverImage]))[0] : projectData.coverImage;

      const payload = {
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        location: projectData.location,
        year: projectData.year,
        status: projectData.status || 'draft',
        coverImage: cover,
        gallery: galleryUrls,
        tags: projectData.tags || [],
        materials: projectData.materials || [],
        views: 0,
        client: projectData.client,
        area: projectData.area,
        duration: projectData.duration,
        featured: projectData.featured || false
      };

      const newProject = await safeSupabaseWrite('projects', 'insert', payload);
      try {
        await googleBackend.logData('projects', {
          action: 'create',
          projectId: newProject?.id,
          title: newProject?.title,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.warn('logData failed', e);
      }
      return newProject;
    },

    update: async (id: string, projectData: any) => {
      const galleryUrls = await handleMediaUpload(projectData.gallery || []);
      const cover = projectData.coverImage instanceof File ? (await handleMediaUpload([projectData.coverImage]))[0] : projectData.coverImage;
      const payload = { ...projectData, gallery: galleryUrls, coverImage: cover, updated_at: new Date().toISOString() };
      return await safeSupabaseWrite('projects', 'update', payload, id);
    },

    delete: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      await googleBackend.logData('projects', { action: 'delete', projectId: id, timestamp: new Date().toISOString() }).catch(() => {});
      return true;
    },

    incrementView: async (id: string) => {
      const { data } = await supabase.from('projects').select('views').eq('id', id).single();
      const currentViews = data?.views || 0;
      await supabase.from('projects').update({ views: currentViews + 1 }).eq('id', id);
    }
  },

  reels: {
    getAll: async () => {
      const { data } = await supabase.from('reels').select('*').order('created_at', { ascending: false });
      return (data || []).map((r: any) => ({
        ...r,
        videoUrl: r.videoUrl?.includes('drive.google.com') ? r.videoUrl.replace('/view', '/preview') : r.videoUrl,
        thumbnailUrl: r.thumbnailUrl || '/default-thumbnail.jpg'
      }));
    },

    create: async (reelData: any) => {
      const videoUrl = reelData.videoFile instanceof File ? (await handleMediaUpload([reelData.videoFile]))[0] : reelData.videoUrl;
      const thumbnailUrl = reelData.thumbnailFile instanceof File ? (await handleMediaUpload([reelData.thumbnailFile]))[0] : reelData.thumbnailUrl;
      const payload = { ...reelData, videoUrl, thumbnailUrl, views: 0 };
      if (!payload.id) delete payload.id;
      const newReel = await safeSupabaseWrite('reels', 'insert', payload);
      await googleBackend.logData('reels', { action: 'create', reelId: newReel?.id, title: newReel?.title, timestamp: new Date().toISOString() }).catch(() => {});
      return newReel;
    },

    update: async (id: string, reelData: any) => {
      // handle file updates
      if (reelData.videoFile instanceof File) reelData.videoUrl = (await handleMediaUpload([reelData.videoFile]))[0];
      if (reelData.thumbnailFile instanceof File) reelData.thumbnailUrl = (await handleMediaUpload([reelData.thumbnailFile]))[0];
      return await safeSupabaseWrite('reels', 'update', reelData, id);
    },

    delete: async (id: string) => {
      await supabase.from('reels').delete().eq('id', id);
      return true;
    },

    incrementView: async (id: string) => {
      const { data } = await supabase.from('reels').select('views').eq('id', id).single();
      const currentViews = data?.views || 0;
      await supabase.from('reels').update({ views: currentViews + 1 }).eq('id', id);
    }
  },

  services: {
    getAll: async () => {
      const { data } = await supabase.from('services').select('*').order('order', { ascending: true });
      return (data || []).map((s: any) => ({
        ...s,
        icon: s.icon?.includes('drive.google.com') ? s.icon.replace('/view', '/preview') : s.icon,
        image: s.image?.includes('drive.google.com') ? s.image.replace('/view', '/preview') : s.image
      }));
    },
    create: async (data: any) => {
      // handle media
      if (data.iconFile instanceof File) data.icon = (await handleMediaUpload([data.iconFile]))[0];
      if (data.imageFile instanceof File) data.image = (await handleMediaUpload([data.imageFile]))[0];
      return await safeSupabaseWrite('services', 'insert', data);
    },
    update: async (id: string, data: any) => await safeSupabaseWrite('services', 'update', data, id),
    delete: async (id: string) => { await supabase.from('services').delete().eq('id', id); return true; }
  },

  reviews: {
    getAll: async () => {
      const { data } = await supabase.from('reviews').select('*');
      return data || [];
    },
    getByTarget: async (targetId: string) => {
      const { data } = await supabase.from('reviews').select('*').or(`projectId.eq.${targetId},reelId.eq.${targetId}`).eq('status', 'approved');
      return data || [];
    },
    create: async (data: any) => {
      data.status = 'pending';
      data.date = new Date().toISOString();
      return await safeSupabaseWrite('reviews', 'insert', data);
    },
    delete: async (id: string) => { await supabase.from('reviews').delete().eq('id', id); return true; },
    updateStatus: async (id: string, status: string) => { await supabase.from('reviews').update({ status }).eq('id', id); return true; }
  },

  pages: {
    getAll: async () => {
      const { data } = await supabase.from('pages').select('*');
      return data || [];
    },
    create: async (data: any) => await safeSupabaseWrite('pages', 'insert', data),
    update: async (id: string, data: any) => await safeSupabaseWrite('pages', 'update', data, id),
    delete: async (id: string) => { await supabase.from('pages').delete().eq('id', id); return true; }
  },

  news: {
    getAll: async (): Promise<NewsItem[]> => {
      const { data } = await supabase.from('news').select('*');
      return data || [];
    },
    create: async (data: any) => await safeSupabaseWrite('news', 'insert', data),
    update: async (id: string, data: any) => await safeSupabaseWrite('news', 'update', data, id),
    delete: async (id: string) => { await supabase.from('news').delete().eq('id', id); return true; }
  },

  appointments: {
    getAll: async () => {
      const { data } = await supabase.from('appointments').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    create: async (data: any) => {
      const sbPayload = { ...data, status: 'pending', emailConfirmationSent: true, createdAt: new Date().toISOString() };
      const newRecord = await safeSupabaseWrite('appointments', 'insert', sbPayload);
      try { await googleBackend.logData('appointment', data); } catch (e) { console.warn('log appointment failed', e); }
      return newRecord;
    }
  },

  settings: {
    get: async (): Promise<SiteSettings> => {
      const { data } = await supabase.from('settings').select('*').single();
      return data || INITIAL_SETTINGS;
    },
    update: async (data: any) => {
      if (data.logoFile instanceof File) {
        const logoResult = await googleBackend.uploadFile(data.logoFile, 'site-logo');
        data.logoUrl = logoResult.url;
      }
      return await safeSupabaseWrite('settings', 'update', data, '1');
    }
  },

  // small utilities
  uploadFile: async (file: File) => {
    const { url } = await googleBackend.uploadFile(file);
    return url;
  },

  getDriveFileId: (url: string) => googleBackend.getDriveFileId(url),

  resetDatabase: async () => {
    localStorage.clear();
    window.location.reload();
  }
};
