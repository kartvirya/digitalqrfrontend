import React, { useState, useEffect } from 'react';
import {
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Star as StarIcon,
  Send as SendIcon,
  Message as MessageIcon,
  Person as UserIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Rating as RatingType } from '../types';
import { apiService } from '../services/api';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<RatingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newReview, setNewReview] = useState({
    comment: ''
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const reviewList = await apiService.getRatings();
      setReviews(reviewList);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReview.comment.trim()) {
      setError('Please provide a comment');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiService.createRating({ comment: newReview.comment });
      setSuccess('Review submitted successfully!');
      setNewReview({ comment: '' });
      loadReviews();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
        <CircularProgress className="text-red-500 mb-4" size={60} />
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Loading Reviews...</h2>
        <p className="text-gray-400">Please wait while we fetch the latest reviews</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageIcon className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Customer Reviews</h1>
          </div>
          <p className="text-red-100 text-sm">Share your experience and read what others have to say</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Alerts */}
        {error && (
          <Alert severity="error" className="rounded-lg bg-red-900/20 border border-red-700 text-red-200">
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" className="rounded-lg bg-green-900/20 border border-green-700 text-green-200">
            {success}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Write Review Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700 sticky top-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <StarIcon className="text-white text-sm" />
                </div>
                <h2 className="text-lg font-bold text-gray-200">Write a Review</h2>
              </div>
              
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label htmlFor="review" className="block text-sm font-medium text-gray-300 mb-2">
                    Your Review *
                  </label>
                  <textarea
                    id="review"
                    rows={6}
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your experience with our restaurant..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-colors"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {submitting ? (
                    <>
                      <CircularProgress size={20} className="text-white" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <SendIcon className="text-sm" />
                      Submit Review
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <MessageIcon className="text-white text-sm" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-200">All Reviews</h2>
                </div>
                <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                  {reviews.length} reviews
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageIcon className="text-gray-400 text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-400">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div 
                      key={review.id} 
                      className="bg-gray-700 rounded-xl p-4 border border-gray-600 hover:border-gray-500 transition-colors card-hover"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                            <UserIcon className="text-white text-sm" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-200">
                              {review.user_name || 'Anonymous'}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <CalendarIcon className="text-xs" />
                              {formatDate(review.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-medium border border-red-500/30">
                          Review
                        </span>
                      </div>
                      
                      <div className="pl-13">
                        <p className="text-gray-300 leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
