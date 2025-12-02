import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import apiService from '../services/api';

interface TrainingProgram {
  id: number;
  title: string;
  description: string;
  trainer: string;
  start_date: string;
  end_date: string;
  duration_hours: number;
  max_participants: number;
  current_participants: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  category: 'technical' | 'soft_skills' | 'compliance' | 'leadership' | 'safety';
  location: string;
  created_at: string;
}

const TrainingManagement: React.FC = () => {
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load employees for training programs
      const employeesData = await apiService.getEmployees();
      setEmployees(employeesData);
      
      // Create sample training programs since the training system isn't fully implemented
      const sampleTrainings: TrainingProgram[] = [
        {
          id: 1,
          title: 'Customer Service Excellence',
          description: 'Advanced customer service techniques and best practices',
          trainer: 'Sarah Johnson',
          start_date: '2025-09-15',
          end_date: '2025-09-17',
          duration_hours: 16,
          max_participants: 20,
          current_participants: 15,
          status: 'upcoming',
          category: 'soft_skills',
          location: 'Conference Room A',
          created_at: '2025-08-10'
        },
        {
          id: 2,
          title: 'Food Safety & Hygiene',
          description: 'Essential food safety protocols and hygiene standards',
          trainer: 'Dr. Michael Chen',
          start_date: '2025-08-20',
          end_date: '2025-08-22',
          duration_hours: 12,
          max_participants: 25,
          current_participants: 22,
          status: 'ongoing',
          category: 'compliance',
          location: 'Training Hall',
          created_at: '2025-08-05'
        },
        {
          id: 3,
          title: 'Kitchen Management',
          description: 'Advanced kitchen operations and management skills',
          trainer: 'Chef Maria Rodriguez',
          start_date: '2025-08-10',
          end_date: '2025-08-12',
          duration_hours: 20,
          max_participants: 15,
          current_participants: 12,
          status: 'completed',
          category: 'technical',
          location: 'Kitchen Training Area',
          created_at: '2025-07-25'
        },
        {
          id: 4,
          title: 'Leadership Development',
          description: 'Building leadership skills for restaurant managers',
          trainer: 'James Wilson',
          start_date: '2025-09-25',
          end_date: '2025-09-27',
          duration_hours: 18,
          max_participants: 12,
          current_participants: 8,
          status: 'upcoming',
          category: 'leadership',
          location: 'Executive Conference Room',
          created_at: '2025-08-15'
        }
      ];
      
      setTrainingPrograms(sampleTrainings);
    } catch (error: any) {
      console.error('Training data loading error:', error);
      setError('Failed to load training data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrainings = trainingPrograms.filter(training => {
    const matchesSearch = 
      training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.trainer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || training.category === selectedCategory;
    const matchesStatus = !selectedStatus || training.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ongoing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'upcoming':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'soft_skills':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'compliance':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'leadership':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'safety':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalTrainings = filteredTrainings.length;
  const upcomingTrainings = filteredTrainings.filter(t => t.status === 'upcoming').length;
  const ongoingTrainings = filteredTrainings.filter(t => t.status === 'ongoing').length;
  const totalParticipants = filteredTrainings.reduce((sum, training) => sum + training.current_participants, 0);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Training Management</h2>
          <p className="text-gray-400">Manage employee training programs and development</p>
        </div>
        <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center">
          <PlusIcon className="h-5 w-5" />
          <span className="hidden sm:inline">New Training Program</span>
          <span className="sm:hidden">New Training</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs lg:text-sm">Total Programs</p>
              <p className="text-xl lg:text-2xl font-bold text-white">{totalTrainings}</p>
            </div>
            <AcademicCapIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs lg:text-sm">Upcoming</p>
              <p className="text-xl lg:text-2xl font-bold text-yellow-400">{upcomingTrainings}</p>
            </div>
            <CalendarIcon className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs lg:text-sm">Ongoing</p>
              <p className="text-xl lg:text-2xl font-bold text-blue-400">{ongoingTrainings}</p>
            </div>
            <ClockIcon className="h-6 w-6 lg:h-8 lg:w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs lg:text-sm">Participants</p>
              <p className="text-xl lg:text-2xl font-bold text-purple-400">{totalParticipants}</p>
            </div>
            <UserGroupIcon className="h-6 w-6 lg:h-8 lg:w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          >
            <option value="">All Categories</option>
            <option value="technical">Technical</option>
            <option value="soft_skills">Soft Skills</option>
            <option value="compliance">Compliance</option>
            <option value="leadership">Leadership</option>
            <option value="safety">Safety</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          >
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Training Programs - Mobile Cards / Desktop Table */}
      <div className="space-y-4">
        {/* Mobile Cards View */}
        <div className="lg:hidden space-y-4">
          {filteredTrainings.map((training) => (
            <div key={training.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{training.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{training.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ml-2 flex-shrink-0 ${getStatusColor(training.status)}`}>
                    {training.status}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Trainer</p>
                    <p className="text-white">{training.trainer}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Category</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(training.category)}`}>
                      {training.category.replace('_', ' ').charAt(0).toUpperCase() + training.category.replace('_', ' ').slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="text-white">{training.duration_hours}h</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Participants</p>
                    <p className="text-white">{training.current_participants}/{training.max_participants}</p>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <p className="text-gray-400 text-sm">Dates</p>
                  <p className="text-white text-sm">
                    {new Date(training.start_date).toLocaleDateString()} - {new Date(training.end_date).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-700/30">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-700/50 rounded-lg">
                    <DocumentTextIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-700/50 rounded-lg">
                    <UserGroupIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-700/50 rounded-lg">
                    <StarIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Program</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Trainer</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Category</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Duration</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Dates</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Participants</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainings.map((training) => (
                  <tr key={training.id} className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{training.title}</p>
                        <p className="text-gray-400 text-sm max-w-xs truncate">{training.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{training.trainer}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(training.category)}`}>
                        {training.category.replace('_', ' ').charAt(0).toUpperCase() + training.category.replace('_', ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{training.duration_hours}h</td>
                    <td className="px-6 py-4 text-gray-300">
                      <div>
                        <p className="text-sm">{new Date(training.start_date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">to {new Date(training.end_date).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {training.current_participants}/{training.max_participants}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(training.status)}`}>
                        {training.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-white transition-colors">
                          <DocumentTextIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-white transition-colors">
                          <UserGroupIcon className="h-4 w-4" />
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
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TrainingManagement;
