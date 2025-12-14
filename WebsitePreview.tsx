
import React, { useEffect, useState } from 'react';
import { api } from '../services/mockApi';
import { Page, NewsItem } from '../types';
import { X, ExternalLink, ArrowLeft, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';

// A mock frontend component to simulate the live website
export const WebsitePreview = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activePopup, setActivePopup] = useState<NewsItem | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [view, setView] = useState<'home' | 'page' | 'news-detail'>('home');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const pData = await api.pages.getAll();
    const nData = await api.news.getAll();
    setPages(pData.filter(p => p.status === 'published'));
    
    // Filter active news/popups based on schedule
    // Logic: Only show items where scheduledFor time has PASSED (is in the past)
    const now = new Date();
    const publishedNews = nData.filter(n => {
        const scheduledTime = new Date(n.scheduledFor);
        return n.status === 'published' && scheduledTime <= now;
    });
    setNews(publishedNews);

    // Find a popup to show (simulating triggering on load if valid)
    // Only pick the most recent valid popup
    const popup = publishedNews
        .filter(n => n.type === 'popup')
        .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())[0];

    if (popup) {
        // Small delay to simulate user landing experience
        setTimeout(() => setActivePopup(popup), 1000);
    }
  };

  const handlePageClick = (page: Page) => {
    setCurrentPage(page);
    setView('page');
    window.scrollTo(0, 0);
  };

  const handleNewsClick = (item: NewsItem) => {
    setSelectedNews(item);
    setView('news-detail');
    setActivePopup(null); // Close popup if clicking "Read More" inside it
    window.scrollTo(0, 0);
  };

  const closePopup = () => {
      setActivePopup(null);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 relative">
       {/* Admin Indicator Banner */}
       <div className="bg-slate-900 text-white py-3 px-6 text-center text-sm font-medium flex justify-between items-center sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             <span>Admin Preview Mode</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-xs hidden sm:inline">This bar is only visible to admins</span>
            <Link to="/news" className="flex items-center gap-2 text-xs bg-blue-600 px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
                <ArrowLeft size={14} /> Return to Dashboard
            </Link>
          </div>
       </div>

       {/* Simulated Navbar */}
       <nav className="border-b border-slate-100 py-4 px-6 md:px-12 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-[46px] z-40">
           <div 
             className="font-bold text-2xl tracking-tight text-slate-800 cursor-pointer flex items-center gap-2"
             onClick={() => setView('home')}
           >
             <div className="w-8 h-8 rounded-full border-2 border-amber-500 flex items-center justify-center bg-slate-900">
                <span className="text-amber-500 text-xs">▲</span>
             </div>
             SkyStupa
           </div>
           <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
              <button onClick={() => setView('home')} className={`hover:text-blue-600 transition-colors ${view === 'home' ? 'text-blue-600' : ''}`}>Home</button>
              <button className="hover:text-blue-600 transition-colors">Projects</button>
              <button className="hover:text-blue-600 transition-colors">Services</button>
              {pages.map(page => (
                  <button key={page.id} onClick={() => handlePageClick(page)} className={`hover:text-blue-600 transition-colors capitalize ${view === 'page' && currentPage?.id === page.id ? 'text-blue-600' : ''}`}>
                      {page.title}
                  </button>
              ))}
              <button className="bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800 transition-colors">Contact</button>
           </div>
       </nav>

       {/* Content Area */}
       <main className="min-h-[80vh]">
          {view === 'home' && (
              <div>
                  {/* Hero */}
                  <div className="h-[60vh] bg-slate-900 flex items-center justify-center text-white relative overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1800&q=80" className="absolute inset-0 w-full h-full object-cover opacity-40 animate-pulse-slow" alt="Hero" />
                      <div className="relative z-10 text-center px-4 max-w-3xl">
                          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Where earth meets the sky in architecture</h1>
                          <p className="text-xl opacity-90 mb-8 font-light">Sustainable, traditional, and modern designs fused into perfection.</p>
                          <button className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded transition-colors">View Our Work</button>
                      </div>
                  </div>
                  
                  {/* Latest News Section */}
                  <div className="max-w-6xl mx-auto py-20 px-6">
                      <div className="flex justify-between items-end mb-10">
                        <div>
                            <span className="text-blue-600 font-bold uppercase tracking-wider text-sm">Update</span>
                            <h2 className="text-3xl font-bold mt-1">Latest News & Events</h2>
                        </div>
                        <button className="text-slate-500 hover:text-blue-600 text-sm font-medium">View All</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {news.filter(n => n.type === 'article').slice(0, 3).map(item => (
                              <div key={item.id} className="group cursor-pointer flex flex-col h-full" onClick={() => handleNewsClick(item)}>
                                  <div className="h-56 rounded-xl bg-slate-100 overflow-hidden mb-5 relative shadow-sm">
                                      {item.mediaUrl ? (
                                        item.mediaType === 'video' ? (
                                            <video src={item.mediaUrl} className="w-full h-full object-cover" muted />
                                        ) : (
                                            <img src={item.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                                        )
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200">No Image</div>
                                      )}
                                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                                        {new Date(item.scheduledFor).toLocaleDateString()}
                                      </div>
                                  </div>
                                  <h3 className="font-bold text-xl mb-3 group-hover:text-blue-600 transition-colors leading-tight">{item.title}</h3>
                                  <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">{item.content}</p>
                                  <span className="text-blue-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                      Read Article <ExternalLink size={14} />
                                  </span>
                              </div>
                          ))}
                          
                          {news.filter(n => n.type === 'article').length === 0 && (
                              <div className="col-span-3 text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                  No active news articles. Create one in the admin panel.
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {/* Dynamic Page View */}
          {view === 'page' && currentPage && (
             <div className="max-w-4xl mx-auto py-16 px-6">
                 <div className="mb-8 pb-8 border-b border-slate-100">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">{currentPage.title}</h1>
                    <div className="text-sm text-slate-500 flex items-center gap-4">
                        <span>Last Updated: {currentPage.lastUpdated}</span>
                        <span>•</span>
                        <span className="capitalize">{currentPage.slug}</span>
                    </div>
                 </div>
                 
                 <div className="prose prose-slate lg:prose-lg max-w-none">
                     {/* Simulating HTML Rendering */}
                     {currentPage.content.split('\n').map((paragraph, idx) => (
                         <p key={idx} className="mb-4 text-slate-600 leading-relaxed">{paragraph}</p>
                     ))}
                 </div>
             </div>
          )}

          {/* News Detail View */}
          {view === 'news-detail' && selectedNews && (
             <div className="bg-slate-50 min-h-screen pb-20">
                 <div className="h-[40vh] w-full bg-slate-900 relative">
                    {selectedNews.mediaUrl && selectedNews.mediaType !== 'video' && (
                        <img src={selectedNews.mediaUrl} className="w-full h-full object-cover opacity-60" alt={selectedNews.title} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl mx-auto">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                            {selectedNews.type}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{selectedNews.title}</h1>
                        <div className="flex items-center gap-6 text-slate-300 text-sm">
                            <span className="flex items-center gap-2"><Calendar size={16}/> {new Date(selectedNews.scheduledFor).toLocaleDateString()}</span>
                            <span className="flex items-center gap-2"><User size={16}/> Admin</span>
                        </div>
                    </div>
                 </div>
                 
                 <div className="max-w-3xl mx-auto -mt-10 relative z-10 bg-white rounded-xl shadow-lg p-8 md:p-12">
                     {selectedNews.mediaType === 'video' && selectedNews.mediaUrl && (
                         <div className="mb-8 rounded-xl overflow-hidden shadow-sm">
                             <video src={selectedNews.mediaUrl} controls className="w-full" />
                         </div>
                     )}
                     <div className="prose prose-lg text-slate-600 whitespace-pre-line">
                         {selectedNews.content}
                     </div>
                 </div>
             </div>
          )}
       </main>

       {/* Footer */}
       <footer className="bg-slate-900 text-slate-400 py-12 px-6">
           <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
               <div>
                   <h4 className="text-white font-bold mb-4">SkyStupa</h4>
                   <p className="text-sm">Architectural excellence since 2010.</p>
               </div>
               <div>
                   <h4 className="text-white font-bold mb-4">Links</h4>
                   <ul className="space-y-2 text-sm">
                       <li>Home</li>
                       <li>Projects</li>
                       <li>Contact</li>
                   </ul>
               </div>
           </div>
           <div className="border-t border-slate-800 pt-8 text-center text-xs">
               © 2024 SkyStupa Architect. All rights reserved.
           </div>
       </footer>

       {/* POPUP MODAL */}
       {activePopup && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-slide-up">
                   <button 
                     onClick={closePopup}
                     className="absolute top-3 right-3 z-10 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                   >
                       <X size={20} />
                   </button>
                   
                   {activePopup.mediaUrl && (
                       <div className="h-48 bg-slate-100">
                           {activePopup.mediaType === 'video' ? (
                               <video src={activePopup.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop />
                           ) : (
                               <img src={activePopup.mediaUrl} alt={activePopup.title} className="w-full h-full object-cover" />
                           )}
                       </div>
                   )}
                   
                   <div className="p-8">
                       <h3 className="text-2xl font-bold text-slate-900 mb-3">{activePopup.title}</h3>
                       <p className="text-slate-600 mb-6 leading-relaxed whitespace-pre-line">{activePopup.content}</p>
                       <div className="flex gap-3">
                           <button onClick={() => handleNewsClick(activePopup)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors">
                               Read More
                           </button>
                           <button onClick={closePopup} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors">
                               Close
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
