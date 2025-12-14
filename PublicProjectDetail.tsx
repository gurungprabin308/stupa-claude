
import React, { useEffect, useState } from 'react';
import { api } from '../../services/mockApi';
import { Project } from '../../types';
import { useParams } from 'react-router-dom';
import { Calendar, Layers, Quote, X, ZoomIn, ZoomOut, Eye } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CommentSection } from '../../components/website/Comments';
import { SEO } from '../../components/website/SEO';
import { useSettings } from '../../context/SettingsContext';

export const PublicProjectDetail = () => {
    const { id } = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const { colorClasses, isDark } = useTheme();
    const { settings } = useSettings();
    
    // Lightbox State
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const load = async () => {
            if (id) {
                // Increment view
                await api.projects.incrementView(id);
                // Load project
                const data = await api.projects.getAll();
                const found = data.find(p => p.id === id);
                setProject(found || null);
            }
        };
        load();
    }, [id]);

    const openLightbox = (img: string) => {
        setLightboxImage(img);
        setTransform({ scale: 1, x: 0, y: 0 });
    };

    const closeLightbox = () => {
        setLightboxImage(null);
        setTransform({ scale: 1, x: 0, y: 0 });
    };

    // Zoom & Pan Handlers
    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY * -0.01;
        const newScale = Math.min(Math.max(1, transform.scale + delta), 5); // Max zoom 5x
        
        // Reset position if zooming out to 1
        setTransform(prev => ({ 
            ...prev, 
            scale: newScale, 
            ...(newScale === 1 ? {x: 0, y: 0} : {}) 
        }));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (transform.scale > 1) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && transform.scale > 1) {
            e.preventDefault();
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;
            setTransform(prev => ({ ...prev, x: newX, y: newY }));
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const zoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.5, 5) }));
    };

    const zoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newScale = Math.max(transform.scale - 0.5, 1);
        setTransform(prev => ({ 
            ...prev, 
            scale: newScale, 
            ...(newScale === 1 ? {x: 0, y: 0} : {}) 
        }));
    };

    if (!project) return <div className={`min-h-screen pt-32 text-center ${isDark ? 'bg-slate-950 text-slate-400' : 'text-slate-600'}`}>Loading project...</div>;

    // Schema for Project
    const schema = {
        "@context": "https://schema.org",
        "@type": ["CreativeWork", "Architecture"],
        "name": project.title,
        "description": project.description,
        "image": project.thumbnailUrl,
        "dateCreated": project.date,
        "creator": {
            "@type": "Organization",
            "name": settings?.siteName || "SkyStupa Architect"
        },
        "material": project.materials?.join(", "),
        "genre": project.category,
        "keywords": project.tags?.join(", ")
    };

    return (
        <div className={`min-h-screen pb-20`}>
             <SEO 
                title={project.title}
                description={project.description}
                image={project.thumbnailUrl}
                type="article"
                schema={schema}
                path={`/portfolio/${project.id}`}
             />

             {/* Hero Header */}
             <div className="h-[60vh] relative">
                 <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_85%,transparent)]">
                    <img src={project.thumbnailUrl} className="w-full h-full object-cover" alt={project.title} />
                    {/* Dark Text Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                 </div>
                 
                 <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-7xl mx-auto z-10 pb-16">
                     <div className="flex flex-wrap gap-3 mb-4">
                        {project.tags?.map((tag, i) => (
                            <span key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-sm">
                                {tag}
                            </span>
                        ))}
                     </div>
                     <h1 className={`text-4xl md:text-6xl font-bold mb-4 leading-tight text-white drop-shadow-lg [text-shadow:0_4px_8px_rgba(0,0,0,0.5)]`}>{project.title}</h1>
                     <div className="flex items-center gap-2 text-white/90 font-medium drop-shadow-md">
                         <Eye size={18} /> {project.views?.toLocaleString() || 0} Views
                     </div>
                 </div>
             </div>

             <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 -mt-10 relative z-10">
                 {/* Sidebar Info */}
                 <div className="lg:col-span-1 space-y-6">
                     <div className={`rounded-xl p-6 shadow-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                         <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                             <Calendar size={18} className={colorClasses.text} /> Timeline
                         </h3>
                         <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{project.timeline || 'N/A'}</p>

                         <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                             <Layers size={18} className={colorClasses.text} /> Materials Used
                         </h3>
                         <ul className="space-y-2 mb-6">
                             {project.materials?.map((mat, i) => (
                                 <li key={i} className={`text-sm flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                     <span className={`w-1.5 h-1.5 rounded-full ${colorClasses.bg}`}></span> {mat}
                                 </li>
                             ))}
                         </ul>
                     </div>
                     
                     {project.clientTestimonial && (
                         <div className={`rounded-xl p-6 shadow-xl relative overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                             <Quote size={48} className={`absolute top-4 right-4 ${isDark ? 'text-slate-800' : 'text-slate-100'}`} />
                             <p className={`italic relative z-10 mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>"{project.clientTestimonial}"</p>
                             <span className={`text-xs font-bold uppercase tracking-wider ${colorClasses.text}`}>— Client Testimonial</span>
                         </div>
                     )}
                 </div>

                 {/* Main Content */}
                 <div className="lg:col-span-2 space-y-12">
                     <div>
                         <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Project Overview</h2>
                         <p className={`leading-relaxed text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{project.description}</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                             <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>The Challenge</h3>
                             <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{project.challenge || 'No specific challenges recorded.'}</p>
                         </div>
                         <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800/50' : 'bg-white border-slate-200 shadow-sm'}`}>
                             <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Our Solution</h3>
                             <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{project.solution || 'Custom architectural solution provided.'}</p>
                         </div>
                     </div>

                     {/* Gallery Grid */}
                     <div>
                         <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Gallery</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {project.gallery?.map((img, i) => (
                                 <div 
                                    key={i} 
                                    className="rounded-xl overflow-hidden hover-3d shadow-md cursor-pointer group relative"
                                    onClick={() => openLightbox(img)}
                                 >
                                     <img src={img} alt={`Gallery ${i}`} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <ZoomIn className="text-white" size={32} />
                                     </div>
                                 </div>
                             ))}
                             {(!project.gallery || project.gallery.length === 0) && (
                                 <div className="text-slate-500 italic">No additional images uploaded.</div>
                             )}
                         </div>
                     </div>

                     {/* Reviews & Comments Section */}
                     <div className={`pt-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                         <CommentSection targetId={project.id} targetType="project" isDark={isDark} />
                     </div>
                 </div>
             </div>

             {/* Lightbox Modal with Zoom/Pan */}
             {lightboxImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center overflow-hidden"
                    onWheel={handleWheel}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onMouseMove={handleMouseMove} 
                >
                    {/* Toolbar */}
                    <div className="absolute top-5 right-5 z-[110] flex items-center gap-4">
                         <div className="bg-white/10 backdrop-blur-md rounded-full flex items-center p-1">
                            <button onClick={zoomOut} className="p-3 text-white hover:text-blue-400 transition-colors" title="Zoom Out">
                                <ZoomOut size={24}/>
                            </button>
                            <span className="text-xs text-white/70 w-12 text-center font-mono">{Math.round(transform.scale * 100)}%</span>
                            <button onClick={zoomIn} className="p-3 text-white hover:text-blue-400 transition-colors" title="Zoom In">
                                <ZoomIn size={24}/>
                            </button>
                        </div>
                        <button 
                            className="text-white p-3 bg-white/10 rounded-full hover:bg-red-500/80 transition-colors"
                            onClick={closeLightbox}
                        >
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div 
                        className="relative w-full h-full flex items-center justify-center"
                        onMouseDown={handleMouseDown}
                        style={{ 
                            cursor: transform.scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        }}
                    >
                         <img 
                            src={lightboxImage} 
                            alt="Full View" 
                            className="max-h-[90vh] max-w-[90vw] object-contain select-none" 
                            draggable={false}
                            style={{
                                transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                            }}
                        />
                    </div>
                    
                    {transform.scale === 1 && (
                         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white text-sm px-4 py-2 rounded-full pointer-events-none animate-pulse">
                            Use scroll wheel to zoom or drag to pan
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
