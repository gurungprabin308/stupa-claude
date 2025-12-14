
export type Status = 'published' | 'draft' | 'archived';
export type ReviewStatus = 'approved' | 'pending' | 'hidden';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor';
  avatar?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string; // Project Overview
  thumbnailUrl: string;
  gallery?: string[]; // New: Additional images (max 10)
  status: Status;
  category: string;
  date: string; 
  tags: string[];
  
  // New fields based on Screenshot
  timeline?: string;
  challenge?: string;
  solution?: string;
  materials?: string[];
  clientTestimonial?: string;
  
  // Analytics
  views?: number;
}

export interface Reel {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string; // Optional cover image
  status: Status;
  views: number;
  category?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
  features: string[]; // Key Features bullet points
}

export interface Review {
  id: string;
  customerName: string;
  rating?: number; // Optional for replies
  comment: string;
  date: string;
  status: ReviewStatus;
  
  // Context fields
  projectId?: string;
  reelId?: string;
  parentId?: string; // For nested replies
  likes?: number;
  avatar?: string; // Optional avatar color or url
}

export interface TrustedCompany {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
}

export interface Appointment {
  id: string;
  fullName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  serviceType: string;
  appointmentType: 'Physical' | 'Online';
  preferredDate: string;
  preferredTime: string;
  projectDetails?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  emailConfirmationSent: boolean; // Tracks if the auto-email was triggered
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  footerText: string;
  maintenanceMode: boolean;
  trustedCompanies?: TrustedCompany[];
}

export interface DashboardStats {
  totalProjects: number;
  totalReels: number;
  pendingReviews: number;
  totalViews: number;
  viewsHistory: { name: string; views: number }[];
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML or Markdown
  status: Status;
  lastUpdated: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: 'popup' | 'article';
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  scheduledFor: string; // ISO Date string (Start Time)
  expiresAt?: string; // ISO Date string (End Time)
  status: Status;
}

export interface Popup {
id: string;
title: string;
content: string; // HTML allowed or sanitized text
imageUrl?: string | null; // optional display image
fileUrl?: string | null; // optional downloadable file
scheduledFor: string; // ISO datetime string (start)
expiresAt?: string | null; // ISO datetime string (end)
published: boolean; // visible to public when true
audience?: 'all' | 'logged-in' | 'guests';
createdAt: string;
updatedAt?: string;
}