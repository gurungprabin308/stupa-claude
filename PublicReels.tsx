
import React, { useEffect, useState } from 'react';
import { api } from '../../services/mockApi';
import { Reel } from '../../types';
import { Play, X, Eye } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CommentSection } from '../../components/website/Comments';
import { SEO } from '../../components/website/SEO';

export const PublicReels = () => {
    const [reels, setReels] = useState<Reel[]>([]);
    const [playingReel, setPlayingReel] = useState<Reel | null>(null);
    const { colorClasses, isDark } = useTheme();

    useEffect(() => {
        loadReels();
    }, []);

    const loadReels = async () => {
        const data = await api.reels.getAll();
        setReels(data.filter(r => r.status === 'published'));
    };

    const handlePlayReel = async (reel: Reel) => {
        setPlayingReel(reel);
        await api.reels.incrementView(reel.id);
        // Update local state to show incremented view count immediately
        setReels(prev => prev.map(r => r.id === reel.id ? { ...r, views: (r.views || 0) + 1 } : r));
        setPlayingReel(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
    };

    const schema = {
        "@context": "https://schema.org",
        "@type": "VideoGallery",
        "name": "Architectural Video Showcase",
        "description": "Video reels of construction sites, finished projects, and architectural walkthroughs by SkyStupa Architect.",
        "video": reels.map(r => ({
            "@type": "VideoObject",
            "name": r.title,
            "description": r.category,
            "thumbnailUrl": r.thumbnailUrl,
            "uploadDate": "2024-01-01", // Should ideally come from data
            "contentUrl": r.videoUrl
        }))
    };

    return (
        <div className="pt-28 min-h-screen">
             <SEO 
                title="Video Gallery" 
                description="Watch site visits, construction progress, and architectural walkthroughs of our latest projects in Nepal."
                schema={schema}
                path="/videos"
             />

             <div className="max-w-7xl mx-auto px-6 py-12">
                 <div className="text-center mb-16">
                    <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Video Gallery</h1>
                    <p className={`max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Explore our construction progress, site visits, and design showcases.</p>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                     {reels.map(reel => (
                         <div 
                            key={reel.id} 
                            onClick={() => handlePlayReel(reel)}
                            className={`group relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-2 border ${colorClasses.cardHover} ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                         >
                             <img src={reel.thumbnailUrl} alt={reel.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                             
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                     <Play className="text-white ml-1" fill="currentColor" />
                                 </div>
                             </div>
                             
                             {/* View Count Badge */}
                             <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1 font-bold">
                                 <Eye size={12} /> {reel.views.toLocaleString()}
                             </div>

                             <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                                 <span className={`text-[10px] uppercase font-bold mb-1 block ${colorClasses.text}`}>{reel.category}</span>
                                 <h3 className="text-white font-bold text-sm leading-tight">{reel.title}</h3>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>

             {/* Video Modal - Fullscreen Ready with Comments */}
             {playingReel && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-md" onClick={() => setPlayingReel(null)}>
                    <div className={`relative w-full h-full md:h-[90vh] max-w-7xl md:rounded-2xl overflow-hidden shadow-2xl border animate-scale-up flex flex-col lg:flex-row ${isDark ? 'bg-black border-slate-800' : 'bg-black border-slate-700'}`} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setPlayingReel(null)}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-red-600 transition-colors backdrop-blur-sm lg:hidden"
                        >
                            <X size={24} />
                        </button>
                        
                        {/* Video Player Container */}
                        <div className="flex-1 bg-black flex items-center justify-center h-[40vh] lg:h-full w-full relative">
                             <button 
                                onClick={() => setPlayingReel(null)}
                                className="absolute top-4 left-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm hidden lg:block"
                            >
                                <X size={24} />
                            </button>
                            <video 
                                key={playingReel.id}
                                src={playingReel.videoUrl} 
                                className="w-full h-full object-contain" 
                                controls 
                                autoPlay 
                                playsInline
                            />
                        </div>
                        
                        {/* Info Panel & Comments (Right Side Desktop, Bottom Mobile) */}
                        <div className={`flex flex-col w-full lg:w-[400px] border-l border-slate-800 shrink-0 h-[60vh] lg:h-full ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                            <div className="p-6 border-b border-slate-800/50">
                                <h3 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{playingReel.title}</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">{playingReel.category}</span>
                                    <span className="text-slate-500 text-xs flex items-center gap-1"><Eye size={12}/> {playingReel.views.toLocaleString()} views</span>
                                </div>
                            </div>
                            
                            {/* Scrollable Comments */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <CommentSection targetId={playingReel.id} targetType="reel" isDark={isDark} />
                            </div>
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
};