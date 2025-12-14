import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Film, 
  Briefcase, 
  MessageSquareQuote, 
  Settings, 
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Sun,
  Moon,
  FileText,
  Megaphone,
  Eye
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink
    to={to}
    end={to === '/admin'} // Only exact match for dashboard home
    className={({ isActive }) =>
      `sidebar-item flex items-center gap-3 px-4 py-3 my-1 rounded-r-full mr-2 transition-all duration-300 group ${
        isActive 
          ? 'sidebar-item-active' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-blue-400 hover:translate-x-1'
      }`
    }
  >
    <Icon size={20} className="relative z-10" />
    <span className="font-medium relative z-10">{label}</span>
  </NavLink>
);

export const Layout = () => {
  const { user, logout } = useAuth();
  const { isDark, setThemeMode } = useTheme();
  const { settings } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  // Fallback if settings haven't loaded yet
  const displayLogo = settings?.logoUrl || 'https://cdn-icons-png.flaticon.com/512/2665/2665511.png';
  const displaySiteName = settings?.siteName || 'SkyStupa';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Sidebar - Desktop & Mobile */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 text-white transition-transform duration-300 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:flex md:flex-col shadow-[5px_0_25px_-5px_rgba(0,0,0,0.3)]`}
      >
        <div className="flex items-center gap-3 p-6 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
           {/* Logo in Round Circle with 3D shadow */}
           <div className="w-12 h-12 shrink-0 rounded-full border-2 border-blue-500/50 overflow-hidden bg-slate-800 relative shadow-[0_0_15px_rgba(59,130,246,0.4)] flex items-center justify-center p-1 hover:scale-105 transition-transform duration-300">
              <img 
                src={displayLogo}
                alt="Logo" 
                className="w-full h-full object-contain"
              />
           </div>
           <div>
             <span className="block text-lg font-bold tracking-tight leading-none text-white drop-shadow-md truncate w-32">{displaySiteName}</span>
             <span className="block text-xs font-medium text-blue-500 tracking-wide mt-0.5">Admin Panel</span>
           </div>
           
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 ml-auto hover:text-white hover:rotate-90 transition-all">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 pr-0 space-y-1">
          <SidebarItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/admin/projects" icon={FolderKanban} label="Projects" />
          <SidebarItem to="/admin/reels" icon={Film} label="Reels & Video" />
          <SidebarItem to="/admin/services" icon={Briefcase} label="Services" />
          <SidebarItem to="/admin/reviews" icon={MessageSquareQuote} label="Reviews" />
          <div className="my-3 border-t border-slate-800/50 mx-4"></div>
          <SidebarItem to="/admin/pages" icon={FileText} label="Pages" />
          <SidebarItem to="/admin/news" icon={Megaphone} label="News & Popups" />
          <div className="my-3 border-t border-slate-800/50 mx-4"></div>
          <SidebarItem to="/admin/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-800/50 bg-slate-900/30 space-y-3">
          <Link 
            to="/" 
            className="flex items-center gap-3 w-full px-4 py-3 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] border border-blue-500/20 group hover-3d"
          >
             <Eye size={20} className="group-hover:scale-110 transition-transform" />
             <span className="font-medium">View Website</span>
          </Link>

          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] border border-red-500/20 group hover-3d"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm transition-colors duration-300">
          <button 
            className="md:hidden text-slate-600 dark:text-slate-300 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden md:block">
             Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 font-bold">{user?.name.split(' ')[0]}</span>
          </h1>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:rotate-12 active:scale-90 hover:shadow-lg hover:shadow-amber-500/20"
              title="Toggle Theme"
            >
              {!isDark ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <Link to="/admin/profile" className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700 group cursor-pointer">
               <div className="relative">
                   {user?.avatar ? (
                     <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 object-cover shadow-sm group-hover:border-blue-500 transition-all duration-300 neon-icon" />
                   ) : (
                     <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:ring-2 ring-blue-500 transition-all neon-icon">
                       <UserIcon size={20} />
                     </div>
                   )}
                   <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
               </div>
               <div className="hidden sm:block">
                 <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-500 transition-colors">{user?.name}</p>
                 <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
               </div>
            </Link>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};