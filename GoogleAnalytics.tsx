
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/mockApi';

// REPLACE THIS WITH YOUR ACTUAL GOOGLE ANALYTICS MEASUREMENT ID
const GA_MEASUREMENT_ID = 'G-6MR95RMKR0'; 

export const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // 1. Send data to Google Analytics (Real GA)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
    }

    // 2. Increment internal View Counter (For Admin Dashboard)
    // This allows the "Total Views" in your admin panel to increase in real-time
    api.dashboard.incrementVisit();

  }, [location]);

  return null;
};
