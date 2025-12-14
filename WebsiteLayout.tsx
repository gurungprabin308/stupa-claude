
import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Facebook, Mail, MapPin, Phone, Instagram, Menu, X, Sun, Moon, Palette, Linkedin, Youtube, Twitter, Lock, LayoutDashboard, Layout, Megaphone } from 'lucide-react';
import { api } from '../../services/mockApi';
import { NewsItem } from '../../types';

// Explicit Hex Colors for the Picker UI to ensure visibility
const PICKER_COLORS = {
    blue: '#3b82f6',
    amber: '#f59e0b',
    emerald: '#10b981',
    rose: '#f43f5e',
    violet: '#8b5cf6'
};

// Custom TikTok Icon since Lucide doesn't have it
const TikTokIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
  </svg>
);

export const WebsiteLayout = () => {
    const { settings } = useSettings();
    const { isAuthenticated } = useAuth();
    const { themeMode, setThemeMode, accentColor, setAccentColor, isDark, colorClasses } = useTheme();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [activePopup, setActivePopup] = useState<NewsItem | null>(null);

    // Refs for click outside detection
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const mobileBtnRef = useRef<HTMLButtonElement>(null);
    const settingsBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        
        // Load popup
        const loadPopup = async () => {
            // NOTE: Session check disabled for preview/demo purposes so you can always see the popup
            // const hasSeenPopup = sessionStorage.getItem('hasSeenPopup');
            // if (hasSeenPopup) return;

            const nData = await api.news.getAll();
            const popups = nData.filter(n => n.status === 'published' && n.type === 'popup');
            const now = new Date();
            
            // Filter logic: Must be scheduled in past AND not expired
            const validPopups = popups.filter(p => {
                const startDate = new Date(p.scheduledFor);
                const endDate = p.expiresAt ? new Date(p.expiresAt) : null;
                const hasStarted = startDate <= now;
                const hasNotExpired = !endDate || endDate > now;
                return hasStarted && hasNotExpired;
            });
            
            validPopups.sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime());
            
            if (validPopups.length > 0) {
                 setTimeout(() => {
                    setActivePopup(validPopups[0]);
                    sessionStorage.setItem('hasSeenPopup', 'true');
                 }, 2000);
            }
        };
        loadPopup();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menus on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setSettingsOpen(false);
        window.scrollTo(0, 0);
    }, [location]);

    // Handle Click Outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close Settings Menu
            if (
                settingsOpen &&
                settingsMenuRef.current &&
                !settingsMenuRef.current.contains(event.target as Node) &&
                !settingsBtnRef.current?.contains(event.target as Node)
            ) {
                setSettingsOpen(false);
            }

            // Close Mobile Menu
            if (
                mobileMenuOpen &&
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target as Node) &&
                !mobileBtnRef.current?.contains(event.target as Node)
            ) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [settingsOpen, mobileMenuOpen]);

    const closePopup = () => {
        setActivePopup(null);
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Portfolios', path: '/portfolio' },
        { name: 'Services', path: '/services' },
        { name: 'Videos', path: '/videos' },
        { name: 'News', path: '/news' },
        { name: 'Get Appointment', path: '/appointment' },
    ];

    // Detect pages that have a Hero section (full image at top)
    const isProjectDetail = /^\/portfolio\/[^/]+$/.test(location.pathname);
    const isNewsDetail = /^\/news\/[^/]+$/.test(location.pathname);
    const isHome = location.pathname === '/';
    
    // On these pages, we want a transparent header initially
    const hasHero = isHome || isProjectDetail || isNewsDetail;

    // Determine if nav should be transparent
    const isTransparentNav = hasHero && !scrolled;
    const currentYear = new Date().getFullYear();

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 flex flex-col ${colorClasses.mainBg}`}>
            
            {/* Admin Back Button - Only visible if logged in */}
            {isAuthenticated && (
                <Link 
                    to="/admin" 
                    className="fixed bottom-6 left-6 z-[100] flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl border border-slate-700 hover:scale-105 transition-transform font-bold animate-fade-in-up"
                    title="Return to Admin Dashboard"
                >
                    <LayoutDashboard size={20} className="text-blue-400" />
                    <span>Back to Admin Panel</span>
                </Link>
            )}

            {/* Navbar */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isTransparentNav 
                ? 'bg-gradient-to-b from-black/90 to-transparent py-4 border-b border-transparent'
                : (isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200') + ' backdrop-blur-md py-3 shadow-lg border-b' 
            }`}>
                <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center overflow-hidden relative shadow-lg group-hover:scale-105 transition-transform ${
                             isTransparentNav 
                             ? 'bg-white border-transparent' 
                             : (isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white')
                        }`}>
                             <img src={settings?.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="flex flex-col">
                            <span className={`block text-xl font-bold leading-none tracking-tight ${
                                isTransparentNav ? 'text-white drop-shadow-md text-shadow' : (isDark ? 'text-white' : 'text-slate-900')
                            }`}>
                                {settings?.siteName}
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map(link => {
                            const isActive = location.pathname === link.path;
                            // Determine text color based on state
                            let textColorClass = '';
                            if (isTransparentNav) {
                                textColorClass = isActive ? 'text-white font-bold' : 'text-white/90 hover:text-white font-medium';
                            } else {
                                textColorClass = isActive 
                                    ? (isDark ? 'text-white' : 'text-slate-900')
                                    : (isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900');
                            }

                            return (
                                <Link 
                                    key={link.path} 
                                    to={link.path}
                                    className={`px-4 py-2 rounded-full text-sm transition-all duration-300 relative group overflow-hidden ${textColorClass} ${isTransparentNav ? 'shadow-sm text-shadow-sm' : ''}`}
                                >
                                    <span className="relative z-10">{link.name}</span>
                                    {/* Active Link Highlight */}
                                    {isActive && (
                                        <span className={`absolute inset-0 opacity-20 rounded-full ${isTransparentNav ? 'bg-white' : colorClasses.bg}`}></span>
                                    )}
                                    {/* Hover Effect */}
                                    <span className={`absolute inset-0 opacity-0 group-hover:opacity-1 rounded-full transition-opacity ${isTransparentNav ? 'bg-white/20' : colorClasses.bg}`}></span>
                                </Link>
                            );
                        })}
                        
                        <Link 
                            to="/contact" 
                            className={`ml-4 px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${colorClasses.contrastBg} ${colorClasses.contrastBgHover}`}
                        >
                            Contact Us
                        </Link>
                        
                        {/* Theme & Color Toggle */}
                        <div className={`relative ml-4 pl-4 border-l ${isTransparentNav ? 'border-white/30' : 'border-slate-200 dark:border-slate-800'}`}>
                             <button 
                                ref={settingsBtnRef}
                                onClick={() => setSettingsOpen(!settingsOpen)}
                                className={`p-2 rounded-full transition-colors ${
                                    isTransparentNav 
                                    ? 'bg-white/20 text-white hover:bg-white/30' 
                                    : (isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-black')
                                }`}
                             >
                                 <Palette size={18} />
                             </button>

                             {settingsOpen && (
                                 <div 
                                    ref={settingsMenuRef}
                                    className={`absolute top-full right-0 mt-4 w-64 p-5 rounded-2xl shadow-2xl border animate-fade-in-up ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                                 >
                                     
                                     {/* Mode Switcher */}
                                     <div className="mb-5">
                                         <p className={`text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Theme Mode</p>
                                         <div className={`flex rounded-lg p-1 gap-1 ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
                                             {['light', 'dark'].map((mode) => (
                                                 <button
                                                    key={mode}
                                                    onClick={() => setThemeMode(mode as any)}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all font-medium text-sm ${
                                                        themeMode === mode 
                                                        ? (isDark ? 'bg-slate-800 text-white shadow' : 'bg-white text-slate-900 shadow') 
                                                        : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
                                                    }`}
                                                 >
                                                     {mode === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                                                     <span className="capitalize">{mode}</span>
                                                 </button>
                                             ))}
                                         </div>
                                     </div>

                                     {/* Color Switcher */}
                                     <div>
                                         <p className={`text-xs font-bold uppercase mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Accent Tint</p>
                                         <div className="flex justify-between gap-2">
                                             {(['blue', 'amber', 'emerald', 'rose', 'violet'] as const).map(color => (
                                                 <button
                                                    key={color}
                                                    onClick={() => setAccentColor(color)}
                                                    className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 shadow-sm ${
                                                        accentColor === color 
                                                        ? (isDark ? 'border-white scale-110' : 'border-slate-900 scale-110') 
                                                        : 'border-transparent'
                                                    }`}
                                                    style={{ backgroundColor: PICKER_COLORS[color] }} 
                                                    title={color}
                                                 >
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="flex items-center gap-4 lg:hidden">
                        <Link 
                            to="/contact" 
                            className={`px-4 py-2 rounded-lg text-white text-xs font-bold ${colorClasses.contrastBg}`}
                        >
                            Contact
                        </Link>
                        <button 
                            ref={mobileBtnRef}
                            className={isTransparentNav ? "text-white" : (isDark ? "text-white" : "text-slate-900")} 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav Overlay */}
                {mobileMenuOpen && (
                    <div 
                        ref={mobileMenuRef}
                        className={`absolute top-full left-0 right-0 border-b p-6 flex flex-col gap-4 lg:hidden shadow-2xl animate-fade-in-up ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}
                    >
                        {navLinks.map(link => (
                            <Link 
                                key={link.path} 
                                to={link.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`text-lg font-medium py-2 border-b border-dashed ${
                                    isDark ? 'border-slate-800' : 'border-slate-100'
                                } ${location.pathname === link.path ? colorClasses.text : (isDark ? 'text-slate-300' : 'text-slate-600')}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        
                        <div className="pt-4 border-t border-slate-800">
                             <p className="text-xs font-bold uppercase mb-3 text-slate-500">Theme Preference</p>
                             <div className="flex gap-4 mb-4">
                                <button onClick={() => setThemeMode('light')} className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-2 ${themeMode === 'light' ? colorClasses.border : 'border-slate-700'}`}>
                                    <Sun size={18}/> Light
                                </button>
                                <button onClick={() => setThemeMode('dark')} className={`flex-1 p-2 rounded-lg border flex items-center justify-center gap-2 ${themeMode === 'dark' ? colorClasses.border : 'border-slate-700'}`}>
                                    <Moon size={18}/> Dark
                                </button>
                             </div>
                             
                             <p className="text-xs font-bold uppercase mb-3 text-slate-500">Accent Tint</p>
                             <div className="flex gap-3 justify-between">
                                 {(['blue', 'amber', 'emerald', 'rose', 'violet'] as const).map(color => (
                                     <button
                                        key={color}
                                        onClick={() => setAccentColor(color)}
                                        className={`w-8 h-8 rounded-full ${accentColor === color ? 'ring-2 ring-white' : ''}`}
                                        style={{ backgroundColor: PICKER_COLORS[color] }}
                                     >
                                     </button>
                                 ))}
                             </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Page Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className={`border-t pt-20 pb-10 relative overflow-hidden backdrop-blur-sm ${isDark ? 'bg-slate-950/80 border-slate-900' : 'bg-slate-50/80 border-slate-200'}`}>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        {/* Brand Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full border flex items-center justify-center overflow-hidden p-1 ${isDark ? 'border-white/10 bg-slate-900' : 'border-slate-300 bg-white'}`}>
                                    <img src={settings?.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                </div>
                                <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{settings?.siteName}</span>
                            </div>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Where earth meets the sky in architecture. Creating sustainable, timeless designs that honor tradition while embracing modernity.
                            </p>
                            
                            {/* Social Icons */}
                            <div className="flex gap-3 flex-wrap">
                                <a href="https://www.facebook.com/SkyStupaArchitect" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover-3d ${isDark ? 'bg-slate-900 text-blue-500 hover:bg-blue-600 hover:text-white' : 'bg-white text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm'}`}>
                                    <Facebook size={20} />
                                </a>
                                <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover-3d ${isDark ? 'bg-slate-900 text-pink-500 hover:bg-pink-600 hover:text-white' : 'bg-white text-pink-600 hover:bg-pink-600 hover:text-white shadow-sm'}`}>
                                    <Instagram size={20} />
                                </a>
                                <a href="https://www.tiktok.com/@skystupaarchitect?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover-3d ${isDark ? 'bg-slate-900 text-black hover:bg-black hover:text-white border border-slate-700' : 'bg-white text-black hover:bg-black hover:text-white shadow-sm'}`}>
                                    <TikTokIcon size={18} />
                                </a>
                                <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover-3d ${isDark ? 'bg-slate-900 text-blue-400 hover:bg-blue-500 hover:text-white' : 'bg-white text-blue-400 hover:bg-blue-500 hover:text-white shadow-sm'}`}>
                                    <Twitter size={20} />
                                </a>
                                <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover-3d ${isDark ? 'bg-slate-900 text-red-500 hover:bg-red-600 hover:text-white' : 'bg-white text-red-500 hover:bg-red-600 hover:text-white shadow-sm'}`}>
                                    <Youtube size={20} />
                                </a>
                                <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover-3d ${isDark ? 'bg-slate-900 text-blue-700 hover:bg-blue-800 hover:text-white' : 'bg-white text-blue-700 hover:bg-blue-800 hover:text-white shadow-sm'}`}>
                                    <Linkedin size={20} />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links (All Navigation) */}
                        <div>
                            <h4 className={`font-bold mb-6 text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Links</h4>
                            <ul className={`space-y-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                <li><Link to="/" className={`${colorClasses.textHover} transition-colors`}>Home</Link></li>
                                <li><Link to="/portfolio" className={`${colorClasses.textHover} transition-colors`}>Portfolios</Link></li>
                                <li><Link to="/services" className={`${colorClasses.textHover} transition-colors`}>Services</Link></li>
                                <li><Link to="/videos" className={`${colorClasses.textHover} transition-colors`}>Videos</Link></li>
                                <li><Link to="/news" className={`${colorClasses.textHover} transition-colors`}>News & Announcements</Link></li>
                                <li><Link to="/appointment" className={`${colorClasses.textHover} transition-colors`}>Get Appointment</Link></li>
                                <li><Link to="/contact" className={`${colorClasses.textHover} transition-colors`}>Contact Us</Link></li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h4 className={`font-bold mb-6 text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Contact Info</h4>
                            <ul className={`space-y-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                <li className="flex items-start gap-3">
                                    <MapPin className={`shrink-0 mt-1 ${colorClasses.text}`} size={18} />
                                    <span>Gwarko, Lalitpur<br/>Kathmandu, Nepal</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className={`shrink-0 ${colorClasses.text}`} size={18} />
                                    <span>{settings?.contactPhone}</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className={`shrink-0 ${colorClasses.text}`} size={18} />
                                    <span>{settings?.contactEmail}</span>
                                </li>
                            </ul>
                        </div>

                        {/* Google Map */}
                        <div className="h-64 rounded-xl overflow-hidden shadow-lg hover-3d border border-slate-200 dark:border-slate-800 relative group">
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3533.046347478636!2d85.3340436!3d27.6683191!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1962302531d3%3A0x77cc0f1890007021!2sSkyStupa%20Architect!5e0!3m2!1sen!2snp!4v1711234567890!5m2!1sen!2snp" 
                                width="100%" 
                                height="100%" 
                                style={{ border: 0 }} 
                                allowFullScreen 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                                title="SkyStupa Location"
                            ></iframe>
                            <a 
                                href="https://www.google.com/maps/dir//Gwarko,+Lalitpur"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`absolute bottom-2 right-2 text-white text-xs px-3 py-1.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity ${colorClasses.contrastBg}`}
                            >
                                Get Directions
                            </a>
                        </div>
                    </div>
                    
                    {/* Trusted Companies Section */}
                    {settings?.trustedCompanies && settings.trustedCompanies.length > 0 && (
                        <div className={`mb-12 py-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            <h4 className={`font-bold mb-6 text-xs uppercase tracking-wider text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Trusted By</h4>
                            <div className="flex flex-wrap justify-center gap-6 md:gap-10 items-center">
                                {settings.trustedCompanies.map((company) => (
                                    <a 
                                        key={company.id} 
                                        href={company.websiteUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="group flex flex-col items-center gap-2 transition-all hover:-translate-y-1 opacity-60 hover:opacity-100"
                                    >
                                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center p-2 shadow-sm border ${isDark ? 'bg-white border-slate-700' : 'bg-white border-slate-200'}`}>
                                            <img 
                                                src={company.logoUrl} 
                                                alt={company.name} 
                                                className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                                            />
                                        </div>
                                        <span className={`text-[10px] font-bold text-center max-w-[100px] leading-tight ${isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-800'}`}>
                                            {company.name}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={`pt-8 border-t flex flex-col md:flex-row justify-center items-center gap-4 text-sm ${isDark ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-500'}`}>
                        <span>{settings?.footerText}</span>
                        <span className="hidden md:inline">•</span>
                        <span>Copyright © {currentYear} {settings?.siteName}. All rights reserved.</span>
                        <Link to="/login" className="opacity-30 hover:opacity-100 transition-opacity p-2 ml-auto md:ml-0" title="Admin Login">
                            <Lock size={14} />
                        </Link>
                    </div>
                </div>
            </footer>

            {/* Popup Modal */}
            {activePopup && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                   <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative border animate-scale-up ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                       <button 
                         onClick={closePopup}
                         className="absolute top-3 right-3 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-md"
                       >
                           <X size={20} />
                       </button>
                       
                       {activePopup.mediaUrl && (
                           <div className={`h-48 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                               {activePopup.mediaType === 'video' ? (
                                   <video src={activePopup.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop />
                               ) : (
                                   <img src={activePopup.mediaUrl} alt={activePopup.title} className="w-full h-full object-cover" />
                               )}
                           </div>
                       )}
                       
                       <div className="p-8">
                           <div className="flex items-center gap-2 mb-3">
                               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white ${colorClasses.bg}`}>
                                  {activePopup.type === 'popup' ? 'Announcement' : 'News'}
                               </span>
                           </div>
                           <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{activePopup.title}</h3>
                           <p className={`mb-6 leading-relaxed whitespace-pre-line text-sm line-clamp-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{activePopup.content}</p>
                           
                           <Link 
                                to={`/news/${activePopup.id}`}
                                onClick={closePopup}
                                className={`block w-full text-center py-3 font-bold rounded-lg transition-colors ${isDark ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                           >
                               See Details
                           </Link>
                       </div>
                   </div>
               </div>
            )}
        </div>
    );
};
