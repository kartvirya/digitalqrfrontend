import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
// import { useAuth } from '../context/AuthContext'; // Not needed for anonymous reviews
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
  // const { user } = useAuth(); // Not needed for anonymous reviews

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
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Customer Reviews
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Submit Review Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Write a Review
        </Typography>
        
        <Box component="form" onSubmit={handleSubmitReview}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Review"
            value={newReview.comment}
            onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
            margin="normal"
            required
            placeholder="Share your experience with our restaurant..."
          />
          
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{ mt: 2 }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit Review'}
          </Button>
        </Box>
      </Paper>

      {/* Reviews List */}
      <Box>
        <Typography variant="h6" gutterBottom>
          All Reviews ({reviews.length})
        </Typography>

        {reviews.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No Reviews Yet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Be the first to share your experience!
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        {review.user_name || 'Anonymous'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(review.created_at)}
                      </Typography>
                    </Box>
                    
                                    <Typography variant="body2" color="text.secondary">
                  Review
                </Typography>
                  </Box>
                  
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    {review.comment}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Reviews;
