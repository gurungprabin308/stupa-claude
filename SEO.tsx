
import React, { useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: string;
  schema?: object;
  path?: string;
}

export const SEO = ({ title, description, image, type = 'website', schema, path = '' }: SEOProps) => {
  const { settings } = useSettings();
  
  // Defaults
  const siteName = settings?.siteName || 'SkyStupa Architect';
  const defaultDescription = "SkyStupa Architect creates sustainable, modern designs rooted in Nepali tradition. We build legacies, not just structures. Expert architectural, interior, and structural services in Nepal.";
  const metaDescription = description || defaultDescription;
  const metaImage = image || settings?.logoUrl || 'E:\downloads\skystupa-architect-website (2)\assets\logo.jpg';
  const fullTitle = `${title} | ${siteName}`;
  const url = window.location.origin + (path || '');

  useEffect(() => {
    // 1. Update Title
    document.title = fullTitle;

    // 2. Helper to set meta tags
    const setMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 3. Helper to set OG tags (Social Media & AI previews)
    const setOg = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta
    setMeta('description', metaDescription);
    setMeta('author', siteName);
    setMeta('robots', 'index, follow');

    // Open Graph / Facebook / LinkedIn
    setOg('og:title', fullTitle);
    setOg('og:description', metaDescription);
    setOg('og:image', metaImage);
    setOg('og:url', url);
    setOg('og:type', type);
    setOg('og:site_name', siteName);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', metaDescription);
    setMeta('twitter:image', metaImage);

    // 4. JSON-LD Structured Data (Crucial for AI/LLMs)
    let script = document.querySelector('#seo-schema');
    if (!script) {
        script = document.createElement('script');
        script.id = 'seo-schema';
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
    }
    
    // Merge provided schema with default Organization schema if on home, or just use provided
    const finalSchema = schema ? schema : null;

    if (finalSchema) {
        script.textContent = JSON.stringify(finalSchema);
    } else {
       // Clear if no specific schema (though we should always have one)
       script.textContent = '';
    }

  }, [fullTitle, metaDescription, metaImage, url, type, schema, siteName]);

  return null;
};
