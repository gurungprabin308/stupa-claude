
import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { Mail, MapPin, Phone, Send, CheckCircle, Loader2, Navigation, MessageSquarePlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/website/SEO';
import { sendContactEmail } from '../../services/emailService';

const WhatsAppIcon = ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.003.575 1.913.923 3.205.923 3.183 0 5.768-2.586 5.769-5.766.002-3.181-2.585-5.766-5.768-5.766zm-9.061 5.77c.001-5.004 4.068-9.071 9.072-9.071 5.003 0 9.069 4.067 9.071 9.071.002 5.003-4.065 9.072-9.071 9.072-1.666 0-3.045-.487-4.225-1.189l-4.743 1.244 1.266-4.621c-0.817-1.286-1.372-2.735-1.37-4.506zm9.072-11.144c-6.148 0-11.144 4.996-11.144 11.144 0 2.13.606 4.12 1.66 5.83l-1.543 5.631 5.787-1.517c1.656.915 3.559 1.446 5.568 1.446 6.148 0 11.144-4.996 11.144-11.144s-4.996-11.144-11.144-11.144z"/>
    </svg>
);

const MESSAGE_SUGGESTIONS = [
    "I'm interested in a new house design.",
    "I need help with interior renovation.",
    "Looking for structural analysis services.",
    "Can I get a quote for a commercial project?",
    "I want to book a site visit."
];

export const Contact = () => {
  const { settings } = useSettings();
  const { isDark, colorClasses } = useTheme();
  const [formState, setFormState] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Using the contact phone for WhatsApp for now as requested
  // Cleaning the number to format for wa.me link
  const cleanPhone = settings?.contactPhone ? settings.contactPhone.replace(/\D/g,'') : '9779860041157';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Send email using EmailJS service (with Google fallback)
    await sendContactEmail({
        name: formState.name,
        email: formState.email,
        phone: formState.phone,
        message: formState.message,
        subject: 'New Contact Form Submission'
    });

    setStatus('success');
    setFormState({ name: '', email: '', phone: '', message: '' });
  };

  const openDirections = () => {
      window.open('https://www.google.com/maps/dir//Gwarko,+Lalitpur', '_blank');
  };

  const addSuggestion = (text: string) => {
      setFormState(prev => ({
          ...prev,
          message: prev.message ? `${prev.message}\n${text}` : text
      }));
  };

  const schema = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "mainEntity": {
          "@type": "ArchitectureFirm",
          "name": settings?.siteName || "SkyStupa Architect",
          "contactPoint": {
              "@type": "ContactPoint",
              "telephone": settings?.contactPhone,
              "email": settings?.contactEmail,
              "availableLanguage": ["English", "Nepali"]
          }
      }
  };

  return (
    <div className={`min-h-screen pt-28 pb-20`}>
      <SEO 
         title="Contact Us" 
         description="Get in touch with SkyStupa Architect in Kathmandu, Nepal. Call us or send a message for your architectural project consultation."
         schema={schema}
         path="/contact"
      />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className={`text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Contact Us</h1>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Ready to start your dream project? Get in touch with us for consultation and design services.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Contact Info & Map */}
          <div className="space-y-10">
            <div className={`border rounded-2xl p-8 shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Get in Touch</h3>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} ${colorClasses.text}`}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Visit Us</h4>
                    <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Gwarko, Lalitpur<br/>Kathmandu, Nepal</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} ${colorClasses.text}`}>
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Call Us</h4>
                    <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{settings?.contactPhone || '+977 9860041157'}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} ${colorClasses.text}`}>
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Email Us</h4>
                    <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{settings?.contactEmail || 'gurungprabin308@gmail.com'}</p>
                  </div>
                </li>
              </ul>

              <div className={`mt-8 pt-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <a 
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-green-500/20"
                  >
                      <WhatsAppIcon size={24} /> Message on WhatsApp
                  </a>
              </div>
            </div>

            <div className={`h-80 rounded-2xl overflow-hidden border shadow-xl relative group ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
               <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3533.046347478636!2d85.3340436!3d27.6683191!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1962302531d3%3A0x77cc0f1890007021!2sSkyStupa%20Architect!5e0!3m2!1sen!2snp!4v1711234567890!5m2!1sen!2snp" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="SkyStupa Location"
                ></iframe>
                <button 
                    onClick={openDirections}
                    className={`absolute bottom-4 right-4 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-bold text-sm transition-transform hover:scale-105 ${colorClasses.bg} ${colorClasses.bgHover}`}
                >
                    <Navigation size={16} /> Get Directions
                </button>
            </div>
          </div>

          {/* Contact Form */}
          <div className={`border rounded-2xl p-8 md:p-10 shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Send us a Message</h3>
            <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Fill out the form below and we will get back to you shortly.</p>

            {status === 'success' ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center animate-fade-in-up">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h4 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Message Sent!</h4>
                <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Thank you for contacting us. We will be in touch soon.</p>
                <Link 
                  to="/"
                  className={`mt-6 px-8 py-3 rounded-xl text-white font-bold transition-transform hover:scale-105 inline-block ${colorClasses.contrastBg} ${colorClasses.contrastBgHover}`}
                >
                  Go Back to Home Page
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="contact-name" className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</label>
                  <input 
                    id="contact-name"
                    type="text" 
                    required
                    name="name"
                    list="name-suggestions"
                    autoComplete="name"
                    className={`w-full px-4 py-3 border rounded-xl transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'} ${colorClasses.inputFocus}`}
                    placeholder="Enter your name"
                    value={formState.name}
                    onChange={e => setFormState({...formState, name: e.target.value})}
                  />
                  <datalist id="name-suggestions">
                      <option value="Guest User" />
                  </datalist>
                </div>
                
                <div>
                  <label htmlFor="contact-email" className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                  <input 
                    id="contact-email"
                    type="email" 
                    required
                    name="email"
                    list="email-suggestions"
                    autoComplete="email"
                    className={`w-full px-4 py-3 border rounded-xl transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'} ${colorClasses.inputFocus}`}
                    placeholder="Enter your email"
                    value={formState.email}
                    onChange={e => setFormState({...formState, email: e.target.value})}
                  />
                  <datalist id="email-suggestions">
                      <option value="@gmail.com" />
                      <option value="@yahoo.com" />
                      <option value="@outlook.com" />
                      <option value="@hotmail.com" />
                  </datalist>
                </div>

                <div>
                  <label htmlFor="contact-phone" className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Phone Number</label>
                  <input 
                    id="contact-phone"
                    type="tel" 
                    name="phone"
                    autoComplete="tel"
                    className={`w-full px-4 py-3 border rounded-xl transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'} ${colorClasses.inputFocus}`}
                    placeholder="+977 98XXXXXXXX"
                    value={formState.phone}
                    onChange={e => setFormState({...formState, phone: e.target.value})}
                  />
                </div>
                
                {/* Message Field with Quick Suggestions */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                      <label htmlFor="contact-message" className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Message</label>
                      <span className="text-xs text-slate-400 flex items-center gap-1"><MessageSquarePlus size={12}/> Quick Add</span>
                  </div>
                  
                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                      {MESSAGE_SUGGESTIONS.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => addSuggestion(suggestion)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600'}`}
                          >
                              + {suggestion}
                          </button>
                      ))}
                  </div>

                  <textarea 
                    id="contact-message"
                    required
                    rows={5}
                    name="message"
                    autoComplete="on"
                    className={`w-full px-4 py-3 border rounded-xl transition-all resize-none ${isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'} ${colorClasses.inputFocus}`}
                    placeholder="Tell us about your project..."
                    value={formState.message}
                    onChange={e => setFormState({...formState, message: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={status === 'submitting'}
                  className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${colorClasses.bg} ${colorClasses.bgHover}`}
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} /> Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
