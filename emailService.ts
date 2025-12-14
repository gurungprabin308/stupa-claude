
import emailjs from '@emailjs/browser';
import { api } from './mockApi';
import { sendViaGoogleScript } from './googleIntegration';

/**
 * Settings interface for type safety.
 */
interface Settings {
  siteName?: string;
  seoDescription?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  logoUrl?: string;
}

/**
 * EmailJS Configuration
 */
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_g0fgu53', 
  PUBLIC_KEY: '1OQQbf8jn2falZqVR', 
  TEMPLATES: {
    // Single template used for both, distinguished by data variables
    CLIENT_CONFIRMATION: 'template_1skc1ed', 
    ADMIN_NOTIFICATION: 'template_qcpni8d'    
  }
} as const;

/**
 * Wrapper around EmailJS
 * Returns true ONLY if explicitly successful. Any error triggers false.
 */
const emailManager = {
  async sendWithEmailJS(templateId: string, templateParams: Record<string, any>): Promise<boolean> {
    try {
      if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.PUBLIC_KEY) {
        console.warn("⚠️ EmailJS Config missing, skipping to backup.");
        return false;
      }

      const resp = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        templateId,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      const ok = resp && (resp.status === 200 || resp.status === 202 || resp.text === 'OK');
      if(ok) {
        console.log(`✅ EmailJS sent successfully (Template: ${templateId})`);
      } else {
        console.warn(`⚠️ EmailJS responded with status: ${resp.status} - ${resp.text}`);
      }
      return ok;
    } catch (err) {
      console.warn('⚠️ EmailJS encountered an error:', err);
      return false;
    }
  }
};

function formatAppointmentDate(dateInput: string | undefined) {
  try {
    if (!dateInput) return 'TBD';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput || 'TBD';
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateInput || 'TBD';
  }
}

/**
 * Send appointment confirmation 
 * STRATEGY: EMAILJS FIRST (Primary) -> GOOGLE SCRIPT SECOND (Backup)
 */
export async function sendAppointmentEmail(data: Record<string, any>, sendToAdmin = true) {
  const results = {
    client: false,
    admin: false,
    method: 'emailjs'
  };

  try {
    const settings = await api.settings.get();
    
    const siteName = settings.siteName || 'SkyStupa Architect';
    const contactPhone = settings.contactPhone || '+977 9860041157';
    const contactEmail = settings.contactEmail || 'skystupaarchitect@gmail.com';
    const address = 'Gwarko, Lalitpur, Kathmandu, Nepal';
    const logoUrl = settings.logoUrl || 'https://cdn-icons-png.flaticon.com/512/2665/2665511.png';
    const websiteUrl = window.location.origin;

    const appointmentDate = formatAppointmentDate(data?.date);

    // Prepare data payload compatible with BOTH EmailJS and Google Script
    const commonParams = {
      notification_type: 'appointment', // Critical for template logic
      
      client_name: data?.name || 'Valued Client',
      client_email: data?.email || '',
      client_phone: data?.phone || 'Not provided',
      service_type: data?.service || 'General Consultation',
      appointment_date: appointmentDate,
      appointment_time: data?.time || 'Anytime',
      mode: data?.mode || 'Physical',
      message: data?.message || 'No details.',
      client_message: data?.message || 'No details.', 
      
      company_name: siteName,
      company_phone: contactPhone,
      company_email: contactEmail,
      company_address: address,
      company_logo: logoUrl,
      company_website: websiteUrl,
      company_tagline: "Make your Dream with SkyStupa Architect",
      
      current_year: new Date().getFullYear().toString(),
      timestamp: new Date().toLocaleString(),
      
      // Redundant email fields to ensure template compatibility
      to_email: data?.email, 
      email: data?.email,
      reply_to: data?.email
    };

    // --- 1. ADMIN NOTIFICATION ---
    if (sendToAdmin) {
      console.log("🚀 Sending Appointment Notification to Admin...");
      
      // Try EmailJS
      let adminSuccess = await emailManager.sendWithEmailJS(
        EMAILJS_CONFIG.TEMPLATES.ADMIN_NOTIFICATION,
        { 
            ...commonParams, 
            to_email: contactEmail, // Override: Send to Admin
            email: contactEmail,
            client_email: data?.email // Used for 'Reply-To' in template
        }
      );

      if (adminSuccess) {
        results.admin = true;
      } else {
        // FALLBACK: Google Script
        console.warn("⚠️ Switching to Google Backup for Admin Notification...");
        adminSuccess = await sendViaGoogleScript('admin_notification', {
            ...commonParams,
            notification_title: `📅 New Appointment: ${data?.name}`,
            admin_email: contactEmail
        });
        if (adminSuccess) {
            results.admin = true;
            results.method = 'google';
        }
      }
    }

    // --- 2. CLIENT CONFIRMATION ---
    console.log("🚀 Sending Appointment Confirmation to Client...");
    
    // Try EmailJS
    let clientSuccess = await emailManager.sendWithEmailJS(
      EMAILJS_CONFIG.TEMPLATES.CLIENT_CONFIRMATION,
      commonParams
    );

    if (clientSuccess) {
        results.client = true;
    } else {
        // FALLBACK: Google Script
        console.warn("⚠️ Switching to Google Backup for Client Confirmation...");
        clientSuccess = await sendViaGoogleScript('client_confirmation', {
            ...commonParams,
            type: 'client',
            to_email: data?.email
        });
        if (clientSuccess) results.client = true;
    }

    return results;
  } catch (error) {
    console.error('Critical error in email service:', error);
    return results;
  }
}

/**
 * Send contact form confirmation 
 * NOTE: ONLY SENDS TO ADMIN (As requested)
 */
export async function sendContactEmail(data: Record<string, any>, sendToAdmin = true) {
  const results = {
    client: false, // We do not send to client for contact form as per request
    admin: false,
    method: 'emailjs'
  };

  try {
    const settings = await api.settings.get();
    const contactEmail = settings.contactEmail || 'skystupaarchitect@gmail.com';
    const logoUrl = settings.logoUrl || 'https://cdn-icons-png.flaticon.com/512/2665/2665511.png';
    const websiteUrl = window.location.origin;

    const commonParams = {
      notification_type: 'contact', // Critical: tells template this is NOT an appointment
      
      client_name: data?.name || 'Visitor',
      client_email: data?.email || '',
      client_phone: data?.phone || 'Not provided',
      client_subject: data?.subject || 'New Contact Request',
      message: data?.message || '',
      client_message: data?.message || '',
      
      // Empty appointment fields to prevent template from showing placeholders
      service_type: '',
      appointment_date: '',
      appointment_time: '',
      mode: '',
      
      company_name: settings.siteName || 'SkyStupa Architect',
      company_phone: settings.contactPhone || '+977 9860041157',
      company_email: contactEmail,
      company_logo: logoUrl,
      company_website: websiteUrl,
      company_tagline: "Make your Dream with SkyStupa Architect",
      
      current_year: new Date().getFullYear().toString(),
      timestamp: new Date().toLocaleString(),
      
      // Fields for EmailJS Template
      to_email: contactEmail, // Send TO Admin
      email: contactEmail,
      reply_to: data?.email // Admin replies to Visitor
    };

    // --- 1. ADMIN NOTIFICATION ONLY ---
    if (sendToAdmin) {
        console.log("🚀 Sending Contact Notification to Admin...");
        
        // Try EmailJS
        let adminSuccess = await emailManager.sendWithEmailJS(
            EMAILJS_CONFIG.TEMPLATES.ADMIN_NOTIFICATION,
            commonParams
        );

        if (adminSuccess) {
            results.admin = true;
        } else {
            // FALLBACK: Google Script
            console.warn("⚠️ Switching to Google Backup for Admin Contact Notification...");
            adminSuccess = await sendViaGoogleScript('admin_notification', {
                ...commonParams,
                notification_title: `📧 New Message: ${data?.name}`,
                admin_email: contactEmail
            });
            if (adminSuccess) {
                results.admin = true;
                results.method = 'google';
            }
        }
    }

    return results;
  } catch (error) {
    console.error('Critical error in contact email service:', error);
    return results;
  }
}
