
import React, { useEffect, useState } from 'react';
import { Review } from '../../types';
import { api } from '../../services/mockApi';
import { MessageSquare, ThumbsUp, Reply, Star, Send, X, MoreHorizontal, Heart } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface CommentSectionProps {
    targetId: string;
    targetType: 'project' | 'reel';
    isDark?: boolean;
}

export const CommentSection = ({ targetId, targetType, isDark }: CommentSectionProps) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const { colorClasses } = useTheme();

    // Form State
    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadReviews();
    }, [targetId]);

    const loadReviews = async () => {
        const data = await api.reviews.getByTarget(targetId);
        setReviews(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !comment.trim()) return;

        setSubmitting(true);
        const newReviewData: Partial<Review> = {
            customerName: name,
            comment: comment,
            rating: (!replyTo && targetType === 'project') ? rating : undefined, 
            parentId: replyTo || undefined,
            [targetType === 'project' ? 'projectId' : 'reelId']: targetId
        };

        await api.reviews.create(newReviewData);
        await loadReviews();
        
        // Reset
        setComment('');
        if (!replyTo) setName(''); 
        else setReplyTo(null);
        setSubmitting(false);
    };

    const handleLike = async (id: string) => {
        const liked = sessionStorage.getItem(`liked_${id}`);
        if (liked) return;

        await api.reviews.like(id);
        sessionStorage.setItem(`liked_${id}`, 'true');
        
        setReviews(prev => prev.map(r => r.id === id ? { ...r, likes: (r.likes || 0) + 1 } : r));
    };

    // Recursive render helper
    const renderComments = (parentId?: string, depth = 0) => {
        const items = reviews.filter(r => (parentId ? r.parentId === parentId : !r.parentId));
        
        if (items.length === 0) return null;

        const isReply = depth > 0;
        const avatarSize = isReply ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";

        return (
            <div className={`flex flex-col ${isReply ? 'gap-2 mt-2' : 'gap-4'}`}>
                {items.map(review => (
                    <div key={review.id} className="group animate-fade-in-up">
                        <div className="flex gap-2">
                            {/* Avatar */}
                            <div className="shrink-0">
                                <div className={`${avatarSize} rounded-full flex items-center justify-center font-bold shadow-sm border select-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-200 text-slate-600'}`}>
                                    {review.customerName.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* Bubble Content (Facebook Style) */}
                                <div className={`px-3 py-2 rounded-2xl inline-block max-w-full ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-900'}`}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {review.customerName}
                                        </span>
                                        {!review.parentId && review.rating && (
                                           <div className="flex text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={8} fill={i < review.rating! ? "currentColor" : "none"} className={i >= review.rating! ? "text-slate-300 opacity-30" : ""} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm leading-snug whitespace-pre-wrap break-words mt-0.5">{review.comment}</p>
                                </div>

                                {/* Actions Bar */}
                                <div className="flex items-center gap-3 mt-1 ml-1 select-none text-[10px] font-semibold text-slate-500">
                                     <span>{new Date(review.date).toLocaleDateString()}</span>
                                     <button 
                                        onClick={() => handleLike(review.id)}
                                        className={`hover:text-blue-500 transition-colors ${review.likes && review.likes > 0 ? 'text-blue-500' : ''}`}
                                    >
                                        Like {review.likes && review.likes > 0 ? `(${review.likes})` : ''}
                                    </button>
                                     <button 
                                        onClick={() => setReplyTo(replyTo === review.id ? null : review.id)}
                                        className="hover:text-blue-500 transition-colors"
                                    >
                                        Reply
                                    </button>
                                </div>

                                {/* Reply Input */}
                                {replyTo === review.id && (
                                    <div className="mt-2 mb-2 animate-fade-in max-w-lg">
                                        <form onSubmit={handleSubmit} className="flex gap-2 items-start">
                                             <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                 Me
                                             </div>
                                             <div className="flex-1 space-y-2">
                                                 <input 
                                                    type="text" 
                                                    placeholder="Your Name (required)" 
                                                    className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300'} focus:border-blue-500 transition-colors`}
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    autoFocus
                                                 />
                                                 <div className={`flex items-center rounded-xl border px-3 py-1 ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300'} focus-within:border-blue-500 transition-colors`}>
                                                     <input 
                                                         type="text" 
                                                         placeholder={`Reply to ${review.customerName}...`}
                                                         className={`flex-1 bg-transparent border-none outline-none text-xs py-1 ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                                                         value={comment}
                                                         onChange={e => setComment(e.target.value)}
                                                     />
                                                     <button type="submit" disabled={submitting} className="text-blue-500 disabled:opacity-50">
                                                         <Send size={14} />
                                                     </button>
                                                 </div>
                                                 <button type="button" onClick={() => setReplyTo(null)} className="text-[10px] text-red-400 hover:text-red-500 ml-1">Cancel Reply</button>
                                             </div>
                                        </form>
                                    </div>
                                )}
                                
                                {/* Nested Replies - Indented naturally by flex layout */}
                                {reviews.some(r => r.parentId === review.id) && (
                                    <div className="mt-1">
                                        {renderComments(review.id, depth + 1)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <h3 className={`font-bold text-lg mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <MessageSquare size={20} className={colorClasses.text} /> 
                {targetType === 'project' ? 'Reviews & Comments' : 'Comments'} 
                <span className={`text-xs font-bold ml-1 py-0.5 px-2 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                    {reviews.length}
                </span>
            </h3>
            
            {/* Top Level Input */}
            <div className="mb-8">
                <form onSubmit={handleSubmit} className="flex gap-3">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                         <div className="font-bold text-xs">Guest</div>
                     </div>
                     <div className="flex-1">
                         <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'} focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-400`}>
                            {!replyTo && (
                                 <div className="flex justify-between items-center mb-3 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                                    <input 
                                        type="text" 
                                        placeholder="Enter your name..." 
                                        className={`bg-transparent outline-none text-sm font-bold w-full ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                    {targetType === 'project' && (
                                        <div className="flex gap-1">
                                            {[1,2,3,4,5].map(star => (
                                                <button 
                                                    key={star} 
                                                    type="button" 
                                                    onClick={() => setRating(star)}
                                                    className="hover:scale-110 transition-transform p-0.5"
                                                    title={`Rate ${star} stars`}
                                                >
                                                    <Star size={16} fill={star <= rating ? "currentColor" : "none"} className={star <= rating ? "text-amber-400" : "text-slate-300"} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                 </div>
                            )}
                            <textarea 
                                rows={2}
                                placeholder={targetType === 'project' ? "Write a review..." : "Write a comment..."}
                                className={`w-full bg-transparent outline-none text-sm resize-none ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`}
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            />
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-[10px] text-slate-400 italic">Your email is not required.</p>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className={`px-4 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-105 ${colorClasses.bg} ${colorClasses.bgHover} disabled:opacity-50`}
                                >
                                     Post {targetType === 'project' ? 'Review' : 'Comment'} <Send size={12} />
                                </button>
                            </div>
                         </div>
                     </div>
                </form>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center text-slate-500 py-8">Loading...</div>
            ) : reviews.length > 0 ? (
                renderComments()
            ) : (
                <div className={`text-center py-12 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    <MessageSquare size={48} className="mx-auto mb-2 opacity-20" />
                    <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
            )}
        </div>
    );
};
