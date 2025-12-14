
import React, { useEffect, useState } from 'react';
import { api } from '../../services/mockApi';
import { Project, Service } from '../../types';
import { ArrowRight, ExternalLink, X, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { SEO } from '../../components/website/SEO';
import { useSettings } from '../../context/SettingsContext';

export const Home = () => {
    const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const { isDark, colorClasses } = useTheme();
    const { settings } = useSettings();

    useEffect(() => {
        const loadData = async () => {
            const pData = await api.projects.getAll();
            const sData = await api.services.getAll();
            
            // Published projects only, max 3
            setFeaturedProjects(pData.filter(p => p.status === 'published').slice(0, 3));
            // Active services only
            setServices(sData.filter(s => s.isActive));
        };
        loadData();
    }, []);

    // Schema.org Structured Data for AI/LLMs
    const schema = {
        "@context": "https://schema.org",
        "@type": "ArchitectureFirm",
        "name": settings?.siteName || "SkyStupa Architect",
        "url": window.location.origin,
        "logo": settings?.logoUrl,
        "description": "Leading architecture firm in Nepal specializing in sustainable, modern, and traditional designs for residential and commercial projects.",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Gwarko",
            "addressLocality": "Lalitpur",
            "addressRegion": "Bagmati",
            "postalCode": "44700",
            "addressCountry": "NP"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": settings?.contactPhone,
            "contactType": "customer service",
            "email": settings?.contactEmail
        },
        "sameAs": [
            "https://www.facebook.com/SkyStupaArchitect",
            "https://www.tiktok.com/@skystupaarchitect",
            "https://www.instagram.com/skystupa"
        ],
        "offers": services.map(s => ({
            "@type": "Offer",
            "itemOffered": {
                "@type": "Service",
                "name": s.title,
                "description": s.description
            }
        }))
    };

    return (
        <div className="overflow-x-hidden">
            <SEO 
                title="Home - Best Architect in Nepal" 
                description="SkyStupa Architect offers sustainable and modern architectural design, interior design, and structural analysis in Nepal. Build your dream home with us."
                schema={schema}
            />
            
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0 [mask-image:linear-gradient(to_bottom,black_85%,transparent)]">
                    <img 
                        src="https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
                        alt="Hero Architecture" 
                        className="w-full h-full object-cover scale-105 animate-pulse-slow"
                    />
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-black/40"></div>
                    {/* Top gradient for navbar contrast only */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${isDark ? 'from-slate-950/90' : 'from-black/60'} via-transparent to-transparent`}></div>
                </div>

                <div className="relative z-20 text-center px-4 max-w-4xl mx-auto space-y-8">
                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight animate-fade-in-up drop-shadow-2xl [text-shadow:0_4px_12px_rgba(0,0,0,0.5)]" style={{ animationDelay: '0.1s' }}>
                        Make Your Dream With Us
                    </h1>
                    <p className="text-lg md:text-xl text-white/95 font-medium max-w-2xl mx-auto animate-fade-in-up drop-shadow-lg" style={{ animationDelay: '0.2s' }}>
                        SkyStupa Architect creates sustainable, modern designs rooted in Nepali tradition. We build legacies, not just structures.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <Link to="/portfolio" className={`px-8 py-4 text-white font-bold rounded-lg transition-all hover:scale-105 ${colorClasses.contrastBg} ${colorClasses.contrastBgHover} shadow-lg`}>
                            View Portfolio
                        </Link>
                        <Link to="/appointment" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-lg transition-all hover:scale-105 backdrop-blur-md shadow-lg">
                            Get Appointment
                        </Link>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className={`py-24 relative`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Our Services</h2>
                        <div className={`w-20 h-1 mx-auto rounded-full ${isDark ? 'bg-white/20' : 'bg-slate-200'}`}>
                             <div className={`w-1/2 h-full rounded-full ${colorClasses.bg}`}></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {services.map((service, index) => (
                            <div key={service.id} className={`p-8 rounded-2xl border transition-all duration-300 group hover:-translate-y-2 ${colorClasses.cardHover} ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-white shadow-lg'}`}>
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform ${isDark ? 'bg-slate-900 ' : 'bg-slate-50'} ${colorClasses.text}`}>
                                    <Star size={24} />
                                </div>
                                <h3 className={`text-xl font-bold mb-3 transition-colors ${isDark ? 'text-white group-hover:text-white' : 'text-slate-900'} ${colorClasses.textHover}`}>{service.title}</h3>
                                <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{service.description}</p>
                                <ul className="space-y-2">
                                    {service.features.slice(0, 3).map((f, i) => (
                                        <li key={i} className={`text-xs flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                            <span className={`w-1 h-1 rounded-full ${colorClasses.bg}`}></span> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Projects Section */}
            <section className={`py-24 border-t ${isDark ? 'border-slate-800/50' : 'border-slate-200/50'}`}>
                <div className="max-w-7xl mx-auto px-6">
                     <div className="flex justify-between items-end mb-16">
                        <div>
                            <h2 className={`text-3xl md:text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Featured Projects</h2>
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>A selection of our recent architectural masterpieces.</p>
                        </div>
                        <Link to="/portfolio" className={`hidden md:flex items-center gap-2 font-medium transition-colors ${colorClasses.text}`}>
                            View All Projects <ArrowRight size={18} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredProjects.map((project) => (
                            <Link to={`/portfolio/${project.id}`} key={project.id} className={`group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-transparent ${colorClasses.cardHover}`}>
                                <img 
                                    src={project.thumbnailUrl} 
                                    alt={project.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <span className={`text-xs font-bold uppercase tracking-wider mb-2 block ${colorClasses.text}`}>{project.category}</span>
                                    <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
                                    <div className="h-0 group-hover:h-auto overflow-hidden transition-all">
                                        <p className="text-slate-300 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                            {project.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    
                    <div className="mt-12 text-center md:hidden">
                        <Link to="/portfolio" className={`inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg ${colorClasses.bg}`}>
                            View All Projects <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};
