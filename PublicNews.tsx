
import React, { useEffect, useState } from 'react';
import { api } from '../../services/mockApi';
import { NewsItem } from '../../types';
import { Calendar, ArrowRight, Layout, Megaphone } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/website/SEO';

export const PublicNews = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const { isDark, colorClasses } = useTheme();

    useEffect(() => {
        const load = async () => {
            const data = await api.news.getAll();
            const published = data.filter(n => n.status === 'published');
            // Sort by most recent
            published.sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime());
            setNews(published);
        };
        load();
    }, []);

    const schema = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "SkyStupa News & Updates",
        "description": "Latest announcements, architectural news, and project updates from SkyStupa Architect.",
        "blogPost": news.map(n => ({
            "@type": "BlogPosting",
            "headline": n.title,
            "description": n.content.substring(0, 150) + "...",
            "datePublished": n.scheduledFor,
            "image": n.mediaUrl,
            "url": `${window.location.origin}/news/${n.id}`
        }))
    };

    return (
        <div className="min-h-screen pt-28">
             <SEO 
                title="News & Announcements" 
                description="Stay updated with the latest architectural trends, company news, and project announcements from SkyStupa Architect."
                schema={schema}
                path="/news"
             />

             <div className="max-w-7xl mx-auto px-6 py-12">
                 <div className="text-center mb-16">
                    <h1 className={`text-4xl md:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>News & Announcements</h1>
                    <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto`}>Stay updated with the latest from SkyStupa.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {news.map(item => (
                        <Link 
                            to={`/news/${item.id}`}
                            key={item.id} 
                            className={`group flex flex-col h-full rounded-xl overflow-hidden border transition-all hover:-translate-y-1 cursor-pointer ${colorClasses.cardHover} ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                        >
                             <div className={`h-48 overflow-hidden relative ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                 {item.mediaUrl ? (
                                     item.mediaType === 'video' ? (
                                        <video src={item.mediaUrl} className="w-full h-full object-cover" muted />
                                     ) : (
                                        <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                     )
                                 ) : (
                                     <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                                         {item.type === 'popup' ? <Layout size={40}/> : <Megaphone size={40}/>}
                                     </div>
                                 )}
                                 
                                 <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border ${isDark ? 'bg-slate-900/90 text-white border-slate-700' : 'bg-white/90 text-slate-800 border-slate-200'}`}>
                                     {item.type}
                                 </div>
                             </div>
                             
                             <div className="p-6 flex-1 flex flex-col">
                                 <div className={`flex items-center gap-2 mb-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                     <Calendar size={14} />
                                     <span>{new Date(item.scheduledFor).toLocaleDateString()}</span>
                                 </div>
                                 
                                 <h3 className={`font-bold text-xl mb-3 leading-tight transition-colors ${isDark ? 'text-white group-hover:text-white' : 'text-slate-900 group-hover:text-black'} ${colorClasses.textHover}`}>
                                     {item.title}
                                 </h3>
                                 
                                 <p className={`text-sm line-clamp-3 mb-6 flex-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.content}</p>
                                 
                                 <div className={`flex items-center gap-2 font-medium text-sm transition-all ${colorClasses.text} group-hover:translate-x-1`}>
                                     Read More <ArrowRight size={16} />
                                 </div>
                             </div>
                        </Link>
                    ))}
                 </div>
                 
                 {news.length === 0 && (
                     <div className={`text-center py-20 border-2 border-dashed rounded-xl ${isDark ? 'text-slate-600 border-slate-800' : 'text-slate-400 border-slate-300'}`}>
                         No news available at the moment.
                     </div>
                 )}
             </div>
        </div>
    );
};
