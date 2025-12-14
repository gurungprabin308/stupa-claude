import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Mic, Volume2, VolumeX, StopCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { GoogleGenAI } from "@google/genai";
import { api } from '../../services/mockApi';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ChatWidget = () => {
  const { isDark, colorClasses } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Namaste! I am the voice assistant for SkyStupa. Speak or type to chat.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  // Lazy initialization of speech recognition
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        if (!recognitionRef.current) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';
            
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
                setTimeout(() => processMessage(transcript), 500);
            };
            
            recognitionRef.current.onend = () => setIsListening(false);
            
            recognitionRef.current.onerror = (event: any) => {
                if (event.error === 'no-speech') {
                    // Silent fail for no speech
                } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                    alert("Microphone access denied. Please allow microphone permission in your browser settings to use voice features.");
                } else {
                    console.error("Speech error", event.error);
                }
                setIsListening(false);
            };
        }
        
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            console.error("Failed to start recognition", e);
            setIsListening(false);
        }
    } else {
        alert("Voice input is not supported in this browser.");
    }
  };

  const stopListening = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
          setIsListening(false);
      }
  };

  const toggleListening = () => {
      if (isListening) {
          stopListening();
      } else {
          startListening();
      }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);

  const speak = (text: string) => {
      if (!voiceEnabled) return;
      if (synthRef.current.speaking) synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      synthRef.current.speak(utterance);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    processMessage(inputText);
  };

  const processMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const liveContext = await api.getSiteContext();
        const historyText = messages.slice(-4).map(m => `${m.role}: ${m.text}`).join('\n');
        const prompt = `${liveContext}\n\nHISTORY:\n${historyText}\nuser: ${userMsg.text}\nmodel:`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const aiResponse = response.text || "I'm checking our records...";
        
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: aiResponse }]);
        speak(aiResponse);
    } catch (error) {
        console.error("Gemini API Error:", error);
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
        setIsThinking(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {isOpen && (
        <div className={`mb-4 w-[350px] max-h-[500px] h-[60vh] rounded-2xl shadow-2xl pointer-events-auto flex flex-col border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`p-4 flex justify-between items-center ${colorClasses.bg} text-white`}>
            <div className="flex items-center gap-2"><Bot size={20} /><h3 className="font-bold text-sm">SkyStupa AI</h3></div>
            <div className="flex items-center gap-1">
                <button 
                    onClick={() => setVoiceEnabled(!voiceEnabled)} 
                    className={`p-1 rounded ${voiceEnabled ? 'text-white' : 'text-white/50'}`}
                    title={voiceEnabled ? "Mute Voice" : "Enable Voice"}
                >
                    {voiceEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}
                </button>
                <button onClick={() => setIsOpen(false)} title="Close Chat"><X size={18} /></button>
            </div>
          </div>
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? `${colorClasses.bg} text-white` : `${isDark ? 'bg-slate-800' : 'bg-white'} border`}`}>{msg.text}</div>
              </div>
            ))}
            {isThinking && <div className="text-xs text-slate-400 px-4">Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className={`p-3 border-t ${isDark ? 'border-slate-800 bg-slate-900' : 'bg-white'}`}>
             <div className="flex items-center gap-2 rounded-full px-4 py-2 border">
               <input type="text" className="flex-1 bg-transparent outline-none text-sm" placeholder={isListening ? "Listening..." : "Type..."} value={inputText} onChange={e => setInputText(e.target.value)} />
               <button type="button" onClick={toggleListening} className={isListening ? 'text-red-500 animate-pulse' : 'text-slate-400'}>{isListening ? <StopCircle size={20} /> : <Mic size={20} />}</button>
               <button type="submit" disabled={!inputText.trim() || isThinking} className="text-blue-500"><Send size={18} /></button>
             </div>
          </form>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className={`pointer-events-auto w-14 h-14 rounded-full shadow-2xl flex items-center justify-center ${colorClasses.bg} text-white`}>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};