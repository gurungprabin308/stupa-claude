
import React, { useEffect, useState } from 'react';
import { api } from '../../services/mockApi';
import { Project } from '../../types';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { SEO } from '../../components/website/SEO';

export const PublicProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filter, setFilter] = useState('All');
    const [categories, setCategories] = useState<string[]>(['All']);
    const { colorClasses, isDark } = useTheme();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.projects.getAll() as Project[];
                const published = data.filter(p => p.status === 'published');
                setProjects(published);
                
                // Extract unique categories
                const cats = Array.from(new Set(published.map(p => p.category))).filter((c): c is string => typeof c === 'string' && !!c);
                setCategories(['All', ...cats]);
            } catch (error) {
                console.error("Failed to load projects", error);
            }
        };
        load();
    }, []);

    const filteredProjects = filter === 'All' 
        ? projects 
        : projects.filter(p => p.category === filter);

    // Schema for AI: List of projects
    const schema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "Architectural Portfolio - SkyStupa Architect",
        "description": "Browse our collection of residential, commercial, and heritage restoration projects across Nepal.",
        "hasPart": projects.map(p => ({
            "@type": "CreativeWork",
            "name": p.title,
            "description": p.description,
            "url": `${window.location.origin}/portfolio/${p.id}`,
            "image": p.thumbnailUrl,
            "category": p.category
        }))
    };

    return (
        <div className="pt-28 min-h-screen">
             <SEO 
                title="Portfolio & Projects" 
                description="Explore the architectural portfolio of SkyStupa Architect. View our residential, commercial, and heritage restoration projects."
                schema={schema}
                path="/portfolio"
             />
             <div className="max-w-7xl mx-auto px-6 py-12">
                 <div className="text-center mb-16">
                    <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Our Portfolio</h1>
                    <p className={`max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Discover how SkyStupa Architect transforms visions into reality across Nepal.</p>
                 </div>

                 {/* Filters */}
                 <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                filter === cat 
                                ? `${colorClasses.bg} text-white shadow-lg` 
                                : `border hover:border-transparent hover:text-white ${colorClasses.bgHover} ${isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                 </div>

                 {/* Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProjects.map(project => (
                        <Link to={`/portfolio/${project.id}`} key={project.id} className={`group border rounded-xl overflow-hidden transition-all hover:-translate-y-2 ${colorClasses.cardHover} ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                             <div className="aspect-video overflow-hidden">
                                 <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                             </div>
                             <div className="p-6">
                                 <div className="flex justify-between items-start mb-2">
                                     <span className={`text-xs font-bold uppercase tracking-wider ${colorClasses.text}`}>{project.category}</span>
                                     <span className="text-xs text-slate-500">{project.date}</span>
                                 </div>
                                 <h3 className={`text-xl font-bold mb-2 transition-colors ${colorClasses.textHover} ${isDark ? 'text-white' : 'text-slate-900'}`}>{project.title}</h3>
                                 <p className={`text-sm line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{project.description}</p>
                             </div>
                        </Link>
                    ))}
                 </div>
                 
                 {filteredProjects.length === 0 && (
                     <div className="text-center py-20 text-slate-500">
                         No projects found in this category.
                     </div>
                 )}
             </div>
        </div>
    );
};
