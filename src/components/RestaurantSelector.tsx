import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import { useAuth } from '../context/AuthContext';

const RestaurantSelector: React.FC = () => {
  const { restaurant, restaurants, switchRestaurant } = useRestaurant();
  const { user } = useAuth();

  // Only show for super admin or restaurant admin
  if (!user?.is_super_admin && !user?.is_superuser && !user?.cafe_manager) {
    return null;
  }

  // Super admin can switch between restaurants
  if (user?.is_super_admin || user?.is_superuser) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Restaurant:</label>
        <select
          value={restaurant?.slug || ''}
          onChange={(e) => {
            if (e.target.value) {
              switchRestaurant(e.target.value);
            }
          }}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
        >
          <option value="">Select Restaurant</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Restaurant admin shows their restaurant
  if (user?.restaurant) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Restaurant:</span>
        <span className="text-sm text-gray-900">{user.restaurant.name}</span>
      </div>
    );
  }

  return null;
};

export default RestaurantSelector;

