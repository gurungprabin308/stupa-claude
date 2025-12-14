import React, { useEffect, useState } from 'react';
import { api } from '../services/mockApi';
import { Review } from '../types';
import { Star, Trash2, Eye, EyeOff } from 'lucide-react';

export const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await api.reviews.getAll();
      setReviews(data);
    } catch (error) {
      console.error("Failed to load reviews", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (review: Review) => {
    const newStatus = review.status === 'approved' ? 'hidden' : 'approved';
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: newStatus } : r));
    await api.reviews.updateStatus(review.id, newStatus);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      await api.reviews.delete(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Testimonials</h2>
           <p className="text-slate-500 dark:text-slate-400">Manage customer reviews and visibility.</p>
        </div>
      </div>
      
      <div className="hover-3d bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {loading ? (
             <div className="p-12 text-center text-slate-400">Loading reviews...</div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Customer</th>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Rating</th>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm w-1/3">Comment</th>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Date</th>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {reviews.map(review => (
              <tr key={review.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{review.customerName}</td>
                <td className="px-6 py-4">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-slate-300 dark:text-slate-600" : ""} />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">{review.comment}</td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{new Date(review.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize tracking-wide shadow-sm
                    ${review.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                      review.status === 'hidden' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                    {review.status === 'approved' ? 'Visible' : review.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleToggleStatus(review)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm neon-transition ${
                            review.status === 'approved' 
                            ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700' 
                            : 'bg-blue-600 border-transparent text-white hover:bg-blue-700 neon-button'
                        }`}
                      >
                         {review.status === 'approved' ? (
                            <>
                                <EyeOff size={14} /> Hide
                            </>
                         ) : (
                            <>
                                <Eye size={14} /> Show
                            </>
                         )}
                      </button>

                      <button 
                        onClick={() => handleDelete(review.id)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors neon-transition"
                        title="Delete Review"
                      >
                        <Trash2 size={16} />
                      </button>
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No reviews found.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};