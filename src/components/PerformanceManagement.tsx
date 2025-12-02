import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  UserGroupIcon,
  StarIcon,
  CalendarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';

interface PerformanceReview {
  id: number;
  employee_id: string;
  employee_name: string;
  reviewer_name: string;
  review_date: string;
  review_period: string;
  overall_rating: number;
  performance_score: number;
  goals_achieved: number;
  goals_total: number;
  status: 'pending' | 'completed' | 'overdue';
  comments: string;
  created_at: string;
}

const PerformanceManagement: React.FC = () => {
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRating, setSelectedRating] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load employees for performance reviews
      const employeesData = await apiService.getEmployees();
      setEmployees(employeesData);
      
      // Create sample performance reviews since the performance system isn't fully implemented
      const sampleReviews: PerformanceReview[] = [
        {
          id: 1,
          employee_id: employeesData[0]?.employee_id || 'EMP001',
          employee_name: employeesData[0]?.full_name || 'John Doe',
          reviewer_name: 'Sarah Manager',
          review_date: '2025-08-15',
          review_period: 'Q2 2025',
          overall_rating: 4.2,
          performance_score: 85,
          goals_achieved: 8,
          goals_total: 10,
          status: 'completed',
          comments: 'Excellent performance in customer service and team collaboration.',
          created_at: '2025-08-10'
        },
        {
          id: 2,
          employee_id: employeesData[1]?.employee_id || 'EMP002',
          employee_name: employeesData[1]?.full_name || 'Jane Smith',
          reviewer_name: 'Mike Supervisor',
          review_date: '2025-08-20',
          review_period: 'Q2 2025',
          overall_rating: 3.8,
          performance_score: 78,
          goals_achieved: 7,
          goals_total: 10,
          status: 'completed',
          comments: 'Good performance with room for improvement in time management.',
          created_at: '2025-08-15'
        },
        {
          id: 3,
          employee_id: employeesData[2]?.employee_id || 'EMP003',
          employee_name: employeesData[2]?.full_name || 'Bob Johnson',
          reviewer_name: 'Lisa Director',
          review_date: '2025-08-25',
          review_period: 'Q2 2025',
          overall_rating: 4.5,
          performance_score: 92,
          goals_achieved: 9,
          goals_total: 10,
          status: 'pending',
          comments: 'Outstanding performance and leadership skills demonstrated.',
          created_at: '2025-08-20'
        },
        {
          id: 4,
          employee_id: employeesData[3]?.employee_id || 'EMP004',
          employee_name: employeesData[3]?.full_name || 'Alice Brown',
          reviewer_name: 'Tom Manager',
          review_date: '2025-08-10',
          review_period: 'Q2 2025',
          overall_rating: 3.5,
          performance_score: 72,
          goals_achieved: 6,
          goals_total: 10,
          status: 'overdue',
          comments: 'Needs improvement in communication and task completion.',
          created_at: '2025-08-05'
        }
      ];
      
      setPerformanceReviews(sampleReviews);
    } catch (error: any) {
      console.error('Performance data loading error:', error);
      setError('Failed to load performance data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = performanceReviews.filter(review => {
    const matchesSearch = 
      review.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !selectedStatus || review.status === selectedStatus;
    const matchesRating = !selectedRating || 
      (selectedRating === 'high' && review.overall_rating >= 4.0) ||
      (selectedRating === 'medium' && review.overall_rating >= 3.0 && review.overall_rating < 4.0) ||
      (selectedRating === 'low' && review.overall_rating < 3.0);
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'overdue':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return 'text-green-400';
    if (rating >= 3.0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIcon key={i} className="h-4 w-4 fill-current" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarIcon key="half" className="h-4 w-4 fill-current opacity-50" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-400" />);
    }
    
    return stars;
  };

  const totalReviews = filteredReviews.length;
  const completedReviews = filteredReviews.filter(r => r.status === 'completed').length;
  const pendingReviews = filteredReviews.filter(r => r.status === 'pending').length;
  const averageRating = filteredReviews.length > 0 
    ? filteredReviews.reduce((sum, review) => sum + review.overall_rating, 0) / filteredReviews.length 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Performance Management</h2>
          <p className="text-gray-400">Manage employee performance reviews and evaluations</p>
        </div>
        <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          New Performance Review
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Reviews</p>
              <p className="text-2xl font-bold text-white">{totalReviews}</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-400">{completedReviews}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{pendingReviews}</p>
            </div>
            <CalendarIcon className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Rating</p>
              <p className={`text-2xl font-bold ${getRatingColor(averageRating)}`}>
                {averageRating.toFixed(1)}
              </p>
            </div>
            <StarIcon className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
          
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          >
            <option value="">All Ratings</option>
            <option value="high">High (4.0+)</option>
            <option value="medium">Medium (3.0-3.9)</option>
            <option value="low">Low (&lt;3.0)</option>
          </select>
        </div>
      </div>

      {/* Performance Reviews Table */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Employee</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Reviewer</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Period</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Rating</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Score</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Goals</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Status</th>
                <th className="px-6 py-4 text-left text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{review.employee_name}</p>
                      <p className="text-gray-400 text-sm">{review.employee_id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{review.reviewer_name}</td>
                  <td className="px-6 py-4 text-gray-300">{review.review_period}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {getRatingStars(review.overall_rating)}
                      </div>
                      <span className={`text-sm font-medium ${getRatingColor(review.overall_rating)}`}>
                        {review.overall_rating}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{review.performance_score}%</td>
                  <td className="px-6 py-4 text-gray-300">
                    {review.goals_achieved}/{review.goals_total}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(review.status)}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-white transition-colors">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-white transition-colors">
                        <DocumentTextIcon className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-white transition-colors">
                        <StarIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceManagement;
