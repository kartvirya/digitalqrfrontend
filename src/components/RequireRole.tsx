import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { UserRole } from '../types';

interface RequireRoleProps {
  children: React.ReactNode;
  roles: UserRole[];
  redirectTo?: string;
}

/**
 * Component to protect routes based on user roles
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ 
  children, 
  roles, 
  redirectTo = '/login' 
}) => {
  const { user, loading } = useAuth();
  const { hasAnyRole } = usePermissions();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!hasAnyRole(roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

interface RequirePermissionProps {
  children: React.ReactNode;
  permission: string;
  redirectTo?: string;
}

/**
 * Component to protect routes based on user permissions
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({ 
  children, 
  permission, 
  redirectTo = '/dashboard' 
}) => {
  const { user, loading } = useAuth();
  const { hasPermission } = usePermissions();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

