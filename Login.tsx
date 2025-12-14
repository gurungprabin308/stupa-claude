import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Check } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      
      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('admin_remembered_email', email);
      } else {
        localStorage.removeItem('admin_remembered_email');
      }

      // Redirect to the Admin Dashboard
      navigate('/admin');
    } catch (err: any) {
      console.error("Login error:", err);
      // Safely extract error message to avoid [object Object]
      const message = err?.message || (typeof err === 'string' ? err : 'Failed to login. Please check your credentials.');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Dynamic Logo & Name from SettingsContext
  const displayLogo = settings?.logoUrl || 'https://cdn-icons-png.flaticon.com/512/2665/2665511.png';
  const displaySiteName = settings?.siteName || 'SkyStupa Architect';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Colorful Blurry Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {/* Gradient blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
          <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-amber-500/20 rounded-full blur-[80px] animate-pulse delay-1000"></div>
          <img 
            src="https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-10 blur-md absolute inset-0 mix-blend-overlay" 
            alt="Texture" 
          />
      </div>
      
      {/* Styles to override autofill colors */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #f8fafc inset !important;
            -webkit-text-fill-color: #0f172a !important;
        }
        .dark input:-webkit-autofill,
        .dark input:-webkit-autofill:hover, 
        .dark input:-webkit-autofill:focus, 
        .dark input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #020617 inset !important;
            -webkit-text-fill-color: #ffffff !important;
        }
      `}</style>

      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-slate-200 dark:border-slate-800 hover-3d transition-all">
        <div className="p-8 pb-6 text-center">
          <div className="w-28 h-28 rounded-full border-4 border-amber-500 shadow-xl mx-auto mb-4 overflow-hidden bg-slate-900 relative shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center p-2 neon-icon">
             <img 
               src={displayLogo} 
               alt="Logo" 
               className="w-full h-full object-contain"
             />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{displaySiteName}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Admin Dashboard Login</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-shake border border-red-200 dark:border-red-800">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative group">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} size={20} />
              <input 
                id="email"
                name="email"
                type="email" 
                autoComplete="username"
                list="email-suggestions"
                required 
                className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 outline-none neon-input transition-all ${
                  error 
                  ? 'border-red-500 focus:ring-red-500 animate-shake' 
                  : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
                }`}
                style={{ colorScheme: 'light dark' }} 
                placeholder="Enter valid company email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              {/* Suggestion List */}
              <datalist id="email-suggestions">
                <option value="gurungprabin308@gmail.com" />
              </datalist>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} size={20} />
              <input 
                id="password"
                name="password"
                type="password"
                autoComplete="current-password" 
                required 
                className={`w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 outline-none neon-input transition-all ${
                  error 
                  ? 'border-red-500 focus:ring-red-500 animate-shake' 
                  : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
                }`}
                style={{ colorScheme: 'light dark' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}>
                    {rememberMe && <Check size={14} />}
                </div>
                <input 
                    type="checkbox" 
                    className="hidden"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors">Remember me</span>
            </label>
            <a href="#" className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors">Forgot Password?</a>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 mt-2 neon-button group"
          >
            {isLoading ? 'Authenticating...' : (
              <>Sign In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>
        
        <div className="bg-slate-50 dark:bg-slate-950 p-4 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400">SkyStupa Architect © 2024</p>
        </div>
      </div>
    </div>
  );
};