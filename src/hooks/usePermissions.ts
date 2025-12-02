import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

/**
 * Hook to check user permissions and roles
 */
export const usePermissions = () => {
  const { user } = useAuth();

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.is_super_admin || user.role === 'super_admin') {
      return true;
    }
    
    // Check if user has the permission in their permissions array
    return user.permissions?.includes(permissionName) || false;
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    
    // Check if user is super admin (legacy flag or role)
    if (user.is_super_admin || user.is_superuser || user.role === 'super_admin') {
      // Super admin has access to all roles
      return true;
    }
    
    // Check user's role
    const userRole = user.role || 'customer';
    if (roles.includes(userRole)) {
      return true;
    }
    
    // Legacy support: check cafe_manager flag for restaurant_admin
    if (roles.includes('restaurant_admin') && user.cafe_manager) {
      return true;
    }
    
    return false;
  };

  /**
   * Check if user can access a feature based on role
   */
  const canAccess = (featureName: string): boolean => {
    if (!user) return false;

    // Super admin can access everything
    if (user.is_super_admin || user.role === 'super_admin') {
      return true;
    }

    // Feature-based access control
    const featurePermissions: Record<string, string[]> = {
      'restaurant_management': ['manage_restaurants'],
      'menu_management': ['manage_menu'],
      'table_management': ['manage_tables'],
      'room_management': ['manage_rooms'],
      'floor_management': ['manage_floors'],
      'order_management': ['manage_orders', 'view_orders'],
      'employee_management': ['manage_employees', 'view_employees'],
      'payroll_management': ['manage_payroll', 'view_payroll'],
      'attendance_management': ['manage_attendance', 'view_attendance'],
      'leave_management': ['manage_leaves', 'view_leaves'],
      'training_management': ['manage_training', 'view_training'],
      'performance_management': ['manage_performance', 'view_performance'],
      'hr_system': ['manage_employees', 'manage_payroll', 'manage_attendance'],
      'staff_portal': ['manage_orders', 'view_orders'],
    };

    const requiredPermissions = featurePermissions[featureName] || [];
    if (requiredPermissions.length === 0) {
      return false;
    }

    // Check if user has any of the required permissions
    return requiredPermissions.some(perm => hasPermission(perm));
  };

  /**
   * Check if user is restaurant admin or above
   */
  const isRestaurantAdmin = (): boolean => {
    if (!user) return false;
    return hasAnyRole(['super_admin', 'restaurant_admin']) || user.cafe_manager || false;
  };

  /**
   * Check if user is HR manager or above
   */
  const isHRManager = (): boolean => {
    if (!user) return false;
    return hasAnyRole(['super_admin', 'restaurant_admin', 'hr_manager']);
  };

  /**
   * Check if user is staff or above
   */
  const isStaff = (): boolean => {
    if (!user) return false;
    return hasAnyRole(['super_admin', 'restaurant_admin', 'hr_manager', 'staff']);
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    canAccess,
    isRestaurantAdmin,
    isHRManager,
    isStaff,
    user,
  };
};

