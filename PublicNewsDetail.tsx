
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/mockApi';
import { NewsItem } from '../../types';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SEO } from '../../components/website/SEO';
import { useSettings } from '../../context/SettingsContext';

export const PublicNewsDetail = () => {
    const { id } = useParams();
    const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
    const [loading, setLoading] = useState(true);
    const { colorClasses, isDark } = useTheme();
    const { settings } = useSettings();

    useEffect(() => {
        const load = async () => {
            const data = await api.news.getAll();
            const item = data.find(n => n.id === id);
            setNewsItem(item || null);
            setLoading(false);
        };
        load();
    }, [id]);

    if (loading) return <div className={`min-h-screen pt-32 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Loading...</div>;
    
    if (!newsItem) return (
        <div className="min-h-screen pt-32 text-center">
            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>News item not found</h2>
            <Link to="/" className={`hover:underline ${colorClasses.text}`}>Return to Home</Link>
        </div>
    );

    const schema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": newsItem.title,
        "image": newsItem.mediaUrl,
        "datePublished": newsItem.scheduledFor,
        "articleBody": newsItem.content,
        "author": {
            "@type": "Organization",
            "name": settings?.siteName || "SkyStupa Architect"
        }
    };

    return (
        <div className={`min-h-screen pb-20 ${isDark ? 'bg-slate-950' : ''}`}>
             <SEO 
                title={newsItem.title}
                description={newsItem.content.substring(0, 150)}
                image={newsItem.mediaUrl}
                type="article"
                schema={schema}
                path={`/news/${newsItem.id}`}
             />

             {/* Hero Image Section */}
             <div className="h-[60vh] w-full relative">
                <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_85%,transparent)]">
                    {newsItem.mediaUrl && newsItem.mediaType !== 'video' && (
                        <img 
                            src={newsItem.mediaUrl} 
                            className="w-full h-full object-cover" 
                            alt={newsItem.title} 
                        />
                    )}
                    {/* Dark Gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl mx-auto z-10 pb-16">
                    <Link to="/" className={`inline-flex items-center gap-2 mb-6 text-sm font-medium transition-colors text-white/80 hover:text-white drop-shadow-md`}>
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <div>
                        <span className={`text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-4 inline-block shadow-lg ${colorClasses.bg}`}>
                            {newsItem.type}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight text-white drop-shadow-lg [text-shadow:0_4px_8px_rgba(0,0,0,0.5)]">
                            {newsItem.title}
                        </h1>
                        <div className="flex items-center gap-6 text-sm text-white/90 font-medium drop-shadow-md">
                            <span className="flex items-center gap-2"><Calendar size={16}/> {new Date(newsItem.scheduledFor).toLocaleDateString()}</span>
                            <span className="flex items-center gap-2"><User size={16}/> Admin</span>
                        </div>
                    </div>
                </div>
             </div>
             
             <div className={`max-w-3xl mx-auto -mt-10 relative z-20 border rounded-xl shadow-2xl p-8 md:p-12 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                 {newsItem.mediaType === 'video' && newsItem.mediaUrl && (
                     <div className="mb-8 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
                         <video src={newsItem.mediaUrl} controls className="w-full" />
                     </div>
                 )}
                 <div className={`prose prose-lg max-w-none whitespace-pre-line leading-relaxed ${isDark ? 'prose-invert text-slate-300' : 'text-slate-600'}`}>
                     {newsItem.content}
                 </div>
             </div>
        </div>
    );
};
