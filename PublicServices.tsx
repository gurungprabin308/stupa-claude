
import React, { useEffect, useState } from 'react';
import { api } from '../../services/mockApi';
import { Service } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Star, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/website/SEO';

export const PublicServices = () => {
    const [services, setServices] = useState<Service[]>([]);
    const { isDark, colorClasses } = useTheme();

    useEffect(() => {
        const load = async () => {
            const data = await api.services.getAll();
            setServices(data.filter(s => s.isActive));
        };
        load();
    }, []);

    // Service Schema for AI
    const schema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Architectural Services in Nepal",
        "provider": {
            "@type": "ArchitectureFirm",
            "name": "SkyStupa Architect"
        },
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Architectural Design Services",
            "itemListElement": services.map(s => ({
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": s.title,
                    "description": s.description
                }
            }))
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 relative">
            <SEO 
                title="Our Services" 
                description="Professional architectural services including interior design, structural analysis, site supervision, and renovation in Nepal."
                schema={schema}
                path="/services"
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-20 animate-fade-in-up">
                    <span className={`inline-block py-1 px-4 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border shadow-sm ${isDark ? 'border-white/20 text-white/80 bg-white/5' : 'border-blue-200 text-blue-700 bg-white/50'}`}>
                        What We Do
                    </span>
                    <h1 className={`text-4xl md:text-6xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Comprehensive <br/>
                        <span className={`text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600`}>Architectural Solutions</span>
                    </h1>
                    <p className={`text-lg md:text-xl max-w-2xl mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        From initial concept to final construction, we bring expertise, creativity, and precision to every project.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <div 
                            key={service.id} 
                            className={`group relative p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 border shadow-lg ${colorClasses.cardHover} ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-white'}`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-md relative z-10 transition-transform group-hover:rotate-6 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-blue-600'}`}>
                                <Star size={28} className={isDark ? colorClasses.text : 'text-blue-600'} />
                            </div>

                            <h3 className={`text-2xl font-bold mb-4 relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {service.title}
                            </h3>
                            
                            <p className={`leading-relaxed mb-8 relative z-10 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                {service.description}
                            </p>
                            
                            <div className="space-y-3 mb-8 relative z-10">
                                {service.features.map((f, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${colorClasses.bg}`}>
                                            <Check size={10} className="text-white" />
                                        </div>
                                        <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{f}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-slate-200/50 relative z-10">
                                <Link 
                                    to="/appointment" 
                                    className={`inline-flex items-center gap-2 font-bold text-sm transition-all group-hover:gap-3 ${colorClasses.text}`}
                                >
                                    Book This Service <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center animate-fade-in-up">
                    <div className={`p-10 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-white'}`}>
                         <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Need a custom solution?</h2>
                         <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>We understand every project is unique. Let's discuss your specific requirements.</p>
                         <Link 
                            to="/contact" 
                            className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg transition-transform hover:scale-105 inline-block ${colorClasses.contrastBg} ${colorClasses.contrastBgHover}`}
                         >
                            Contact Us Today
                         </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
