import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '../services/api';

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  subscription_status: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  stats?: {
    tables_count?: number;
    rooms_count?: number;
    menu_items_count?: number;
    orders_count?: number;
    staff_count?: number;
  };
}

interface RestaurantContextType {
  restaurant: Restaurant | null;
  restaurants: Restaurant[];
  loading: boolean;
  setRestaurant: (restaurant: Restaurant | null) => void;
  loadRestaurants: () => Promise<void>;
  switchRestaurant: (restaurantSlug: string) => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

interface RestaurantProviderProps {
  children: ReactNode;
}

export const RestaurantProvider: React.FC<RestaurantProviderProps> = ({ children }) => {
  const [restaurant, setRestaurantState] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Load restaurants list
  const loadRestaurants = async () => {
    try {
      const data = await apiService.getRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    }
  };

  // Switch restaurant by slug
  const switchRestaurant = async (restaurantSlug: string) => {
    try {
      const foundRestaurant = restaurants.find(r => r.slug === restaurantSlug);
      if (foundRestaurant) {
        setRestaurant(foundRestaurant);
      } else {
        // Try to fetch from API
        const allRestaurants = await apiService.getRestaurants();
        const restaurant = allRestaurants.find(r => r.slug === restaurantSlug);
        if (restaurant) {
          setRestaurant(restaurant);
        }
      }
    } catch (error) {
      console.error('Failed to switch restaurant:', error);
    }
  };

  // Set restaurant
  const setRestaurant = (restaurant: Restaurant | null) => {
    setRestaurantState(restaurant);
    if (restaurant) {
      localStorage.setItem('selected_restaurant', JSON.stringify(restaurant));
      // Update API service context
      apiService.setRestaurantContext(restaurant.id);
      apiService.setRestaurantSlug(restaurant.slug);
    } else {
      localStorage.removeItem('selected_restaurant');
      // Clear restaurant context (pass null instead of 0)
      apiService.setRestaurantContext(null);
      apiService.setRestaurantSlug(null);
    }
  };

  // Initialize restaurant from localStorage or URL
  useEffect(() => {
    const initializeRestaurant = async () => {
      try {
        // Check URL for restaurant slug
        const urlParams = new URLSearchParams(window.location.search);
        const restaurantSlug = urlParams.get('restaurant') || 
                              window.location.pathname.match(/\/r\/([^\/]+)/)?.[1];
        
        if (restaurantSlug) {
          await switchRestaurant(restaurantSlug);
        } else {
          // Try to load from localStorage and set API headers
          const savedRestaurant = localStorage.getItem('selected_restaurant');
          if (savedRestaurant) {
            try {
              const parsed = JSON.parse(savedRestaurant);
              setRestaurantState(parsed);
              // Set API headers from saved restaurant
              apiService.setRestaurantContext(parsed.id);
              apiService.setRestaurantSlug(parsed.slug);
            } catch (e) {
              console.error('Failed to parse saved restaurant:', e);
              localStorage.removeItem('selected_restaurant');
            }
          }
        }

        // Load restaurants list (only if not on login page)
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
          await loadRestaurants();
        }
      } catch (error) {
        console.error('Failed to initialize restaurant:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeRestaurant();
  }, []);

  const value: RestaurantContextType = {
    restaurant,
    restaurants,
    loading,
    setRestaurant,
    loadRestaurants,
    switchRestaurant,
  };

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = (): RestaurantContextType => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

