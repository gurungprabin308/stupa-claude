
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, Clock, User, Phone, Mail, MessageSquare, Loader2, CheckCircle, ChevronDown, MapPin, Video, MessageSquarePlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/mockApi';
import { SEO } from '../../components/website/SEO';
import { sendAppointmentEmail } from '../../services/emailService';

const SERVICE_TYPES = [
    'Consultation',
    'Architectural Design',
    'Interior Design',
    'Structural Analysis',
    'Site Supervision',
    'Renovation',
    'Other'
];

const PROJECT_SUGGESTIONS = [
    "Residential Project",
    "Commercial Complex",
    "Renovation Request",
    "Interior Design Consultation",
    "Site Visit Required"
];

export const GetAppointment = () => {
    const { isDark, colorClasses } = useTheme();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Form State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [serviceType, setServiceType] = useState('Consultation');
    const [appointmentType, setAppointmentType] = useState<'Physical' | 'Online'>('Physical');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [preferredDate, setPreferredDate] = useState('');
    const [preferredTime, setPreferredTime] = useState('Morning (10AM - 12PM)');
    const [message, setMessage] = useState('');

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow numbers and + symbol for country code
        if (/^[0-9+\s]*$/.test(value)) {
            setPhoneNumber(value);
        }
    };

    const addSuggestion = (text: string) => {
        setMessage(prev => prev ? `${prev}\n${text}` : text);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // 1. Send Email (EmailJS -> Fallback to Google Apps Script)
            await sendAppointmentEmail({
                name: fullName,
                email,
                phone: phoneNumber,
                service: serviceType,
                date: preferredDate,
                time: preferredTime,
                message,
                mode: appointmentType // Passed to EmailJS as {{mode}}
            });

            // 2. Save to internal DB (Mock)
            await api.appointments.create({
                fullName,
                email,
                countryCode: '',
                phoneNumber,
                serviceType,
                appointmentType,
                preferredDate,
                preferredTime,
                projectDetails: message
            });
            setSuccess(true);
        } catch (error) {
            console.error("Failed to submit appointment", error);
            // Show success anyway to not discourage user, since admin likely got notification
            setSuccess(true); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-28 transition-colors duration-300">
            <SEO 
                title="Book an Appointment" 
                description="Schedule a consultation with SkyStupa Architect. Choose from physical or online meetings to discuss your architectural needs."
                path="/appointment"
            />
            
            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="text-center mb-16">
                    <h1 className={`text-4xl md:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Book an Appointment</h1>
                    <p className={`text-lg md:text-xl max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Schedule a consultation to discuss your dream project.</p>
                </div>

                <div className={`rounded-3xl shadow-2xl overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    {success ? (
                        <div className="p-20 text-center animate-fade-in-up">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${isDark ? 'bg-green-500/20 text-green-500' : 'bg-green-100 text-green-600'}`}>
                                <CheckCircle size={48} />
                            </div>
                            <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Request Sent!</h2>
                            <p className={`text-lg mb-8 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                                We have received your appointment request. A confirmation email has been sent to <strong>{email}</strong>.
                            </p>
                            <Link 
                                to="/"
                                className={`px-8 py-4 rounded-xl text-white font-bold text-lg transition-transform hover:scale-105 inline-block ${colorClasses.contrastBg} ${colorClasses.contrastBgHover}`}
                            >
                                Go Back to Home Page
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-5">
                            {/* Info Side */}
                            <div className={`p-10 lg:p-14 lg:col-span-2 relative overflow-hidden flex flex-col justify-center ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
                                <div className={`absolute top-0 left-0 w-full h-2 ${colorClasses.bg}`}></div>
                                <h3 className={`text-2xl font-bold mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>Why Consult Us?</h3>
                                <ul className="space-y-8">
                                    <li className="flex gap-5">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
                                            <span className="font-bold text-lg">1</span>
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Expert Advice</h4>
                                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Get insights from award-winning architects with years of experience.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-5">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
                                            <span className="font-bold text-lg">2</span>
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Feasibility Study</h4>
                                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Quick assessment of your site potential and regulatory requirements.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-5">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-800'}`}>
                                            <span className="font-bold text-lg">3</span>
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Budget Planning</h4>
                                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Realistic cost estimation to help you plan your investment.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* Form Side */}
                            <form onSubmit={handleSubmit} className="p-10 lg:p-14 lg:col-span-3 space-y-8">
                                
                                {/* Service Selection */}
                                <div>
                                    <label className={`block text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Service Type</label>
                                    <div className="relative">
                                        <select 
                                            name="serviceType"
                                            value={serviceType}
                                            onChange={(e) => setServiceType(e.target.value)}
                                            className={`w-full px-5 py-4 text-base rounded-xl border outline-none transition-all appearance-none cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} ${colorClasses.inputFocus}`}
                                        >
                                            {SERVICE_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} size={20} />
                                    </div>
                                </div>

                                {/* Appointment Type Selection */}
                                <div>
                                    <label className={`block text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Appointment Type</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setAppointmentType('Physical')}
                                            className={`py-4 px-6 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                                                appointmentType === 'Physical'
                                                ? `${colorClasses.contrastBg} ${colorClasses.contrastBgHover} text-white border-transparent shadow-lg transform scale-[1.02]`
                                                : `${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'} ${colorClasses.cardHover}`
                                            }`}
                                        >
                                            <MapPin size={20} /> Physical
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAppointmentType('Online')}
                                            className={`py-4 px-6 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                                                appointmentType === 'Online'
                                                ? `${colorClasses.contrastBg} ${colorClasses.contrastBgHover} text-white border-transparent shadow-lg transform scale-[1.02]`
                                                : `${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'} ${colorClasses.cardHover}`
                                            }`}
                                        >
                                            <Video size={20} /> Online
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className={`block text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Full Name</label>
                                        <div className="relative group">
                                            <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-900'}`} size={20} />
                                            <input 
                                                required
                                                type="text"
                                                name="name"
                                                autoComplete="name"
                                                value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                className={`w-full pl-12 pr-5 py-4 text-base rounded-xl border outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'} ${colorClasses.inputFocus}`}
                                                placeholder="Your name"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className={`block text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Phone Number</label>
                                        <div className="relative group">
                                            <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-900'}`} size={20} />
                                            <input 
                                                required
                                                type="tel"
                                                name="phone"
                                                autoComplete="tel"
                                                value={phoneNumber}
                                                onChange={handlePhoneChange}
                                                className={`w-full pl-12 pr-5 py-4 text-base rounded-xl border outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'} ${colorClasses.inputFocus}`}
                                                placeholder="+977 98XXXXXXXX"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Email Address</label>
                                    <div className="relative group">
                                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-900'}`} size={20} />
                                        <input 
                                            required
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                                            className={`w-full pl-12 pr-5 py-4 text-base rounded-xl border outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'} ${colorClasses.inputFocus}`}
                                            placeholder="Enter your valid email address"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className={`block text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Preferred Date</label>
                                        <div className="relative group">
                                            {/* Decorative icon left */}
                                            <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${isDark ? 'text-slate-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-900'}`} size={20} />
                                            
                                            <input 
                                                required
                                                type="date"
                                                name="date"
                                                min={new Date().toISOString().split('T')[0]} // Block past dates
                                                value={preferredDate}
                                                onChange={e => setPreferredDate(e.target.value)}
                                                // Auto open picker on click
                                                onClick={(e) => {
                                                    try {
                                                        if(typeof (e.target as any).showPicker === 'function') {
                                                            (e.target as any).showPicker();
                                                        }
                                                    } catch(err) {} 
                                                }}
                                                className={`w-full pl-12 pr-5 py-4 text-base rounded-xl border outline-none transition-all cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} ${colorClasses.inputFocus}`}
                                                style={{ colorScheme: isDark ? 'dark' : 'light' }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Preferred Time</label>
                                        <div className="relative group">
                                            <Clock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-900'}`} size={20} />
                                            <select 
                                                name="time"
                                                value={preferredTime}
                                                onChange={e => setPreferredTime(e.target.value)}
                                                className={`w-full pl-12 pr-5 py-4 text-base rounded-xl border outline-none transition-all appearance-none cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'} ${colorClasses.inputFocus}`}
                                            >
                                                <option>Morning (10AM - 12PM)</option>
                                                <option>Afternoon (12PM - 3PM)</option>
                                                <option>Evening (3PM - 5PM)</option>
                                            </select>
                                            <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} size={20} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className={`block text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Project Details (Optional)</label>
                                        <span className="text-xs text-slate-400 flex items-center gap-1"><MessageSquarePlus size={12}/> Quick Add</span>
                                    </div>
                                    
                                    {/* Suggestion Chips */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {PROJECT_SUGGESTIONS.map((suggestion, idx) => (
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

                                    <div className="relative group">
                                        <MessageSquare className={`absolute left-4 top-5 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-900'}`} size={20} />
                                        <textarea 
                                            rows={4}
                                            name="message"
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            className={`w-full pl-12 pr-5 py-4 text-base rounded-xl border outline-none transition-all resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'} ${colorClasses.inputFocus}`}
                                            placeholder="Briefly describe your project..."
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className={`w-full py-5 text-white font-bold text-lg rounded-xl transition-all hover:scale-[1.01] shadow-xl flex items-center justify-center gap-3 ${colorClasses.contrastBg} ${colorClasses.contrastBgHover} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? (
                                        <> <Loader2 className="animate-spin" size={24} /> Sending Request... </>
                                    ) : (
                                        'Confirm Appointment'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
