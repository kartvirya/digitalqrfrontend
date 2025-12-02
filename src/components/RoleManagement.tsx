import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import apiService from '../services/api';

interface Permission {
  id: number;
  name: string;
  codename: string;
  description: string;
  category: string;
}

interface RolePermission {
  id: number;
  role: string;
  permission: Permission;
}

const RoleManagement: React.FC = () => {
  const { isRestaurantAdmin, hasRole, user } = usePermissions();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('restaurant_admin');
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [error, setError] = useState('');
  const isSuperAdmin = useMemo(() => hasRole('super_admin'), [hasRole, user?.role]);
  const permissionsLoadedRef = useRef(false);
  const rolePermissionsLoadingRef = useRef<string | null>(null);

  const loadPermissions = useCallback(async () => {
    setLoadingPermissions(true);
    try {
      setError('');
      const response = await apiService.get('/api/permissions/');
      if (response.data && Array.isArray(response.data)) {
        setPermissions(response.data);
      } else {
        setPermissions([]);
      }
    } catch (err: any) {
      console.error('Error loading permissions:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to load permissions';
      setError(errorMsg);
      setPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  const loadRolePermissions = useCallback(async (role?: string) => {
    if (!role) return;
    setLoading(true);
    try {
      setError('');
      const url = `/api/role-permissions/?role=${role}`;
      const response = await apiService.get(url);
      if (response.data && Array.isArray(response.data)) {
        setRolePermissions(response.data);
      } else {
        setRolePermissions([]);
      }
    } catch (err: any) {
      console.error('Error loading role permissions:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to load role permissions';
      // Don't set error for empty results - it's okay if there are no role permissions yet
      if (err.response?.status !== 404) {
        setError(errorMsg);
      }
      setRolePermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin && !permissionsLoadedRef.current && !loadingPermissions) {
      permissionsLoadedRef.current = true;
      loadPermissions();
    }
  }, [isSuperAdmin, loadPermissions, loadingPermissions]);

  useEffect(() => {
    if (isSuperAdmin && selectedRole) {
      const currentLoadingRole = rolePermissionsLoadingRef.current;
      if (currentLoadingRole !== selectedRole && !loading) {
        rolePermissionsLoadingRef.current = selectedRole;
        loadRolePermissions(selectedRole);
      }
    }
  }, [isSuperAdmin, selectedRole, loadRolePermissions, loading]);

  const handleRoleChange = useCallback((role: string) => {
    setSelectedRole(role);
    rolePermissionsLoadingRef.current = null; // Reset to allow loading new role
  }, []);

  const togglePermission = useCallback(async (permissionId: number) => {
    if (!isSuperAdmin) {
      setError('Only super admins can manage permissions');
      return;
    }

    if (loading) return;

    setLoading(true);
    setError('');

    try {
      // Check if permission already exists for this role
      const existing = rolePermissions.find(
        rp => rp.role === selectedRole && rp.permission.id === permissionId
      );

      if (existing) {
        // Remove permission
        await apiService.delete(`/api/role-permissions/${existing.id}/`);
        setRolePermissions(prev => prev.filter(rp => rp.id !== existing.id));
      } else {
        // Add permission
        const response = await apiService.post('/api/role-permissions/', {
          role: selectedRole,
          permission_id: permissionId,
        });
        setRolePermissions(prev => [...prev, response.data]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update permission');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, loading, rolePermissions, selectedRole]);

  const hasPermissionForRole = useCallback((permissionId: number, role: string): boolean => {
    return rolePermissions.some(
      rp => rp.role === role && rp.permission.id === permissionId
    );
  }, [rolePermissions]);

  const roles = useMemo(() => [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'restaurant_admin', label: 'Restaurant Admin' },
    { value: 'hr_manager', label: 'HR Manager' },
    { value: 'staff', label: 'Staff' },
    { value: 'customer', label: 'Customer' },
  ], []);

  const categories = useMemo(() => {
    return Array.from(new Set(permissions.map(p => p.category)));
  }, [permissions]);

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">Access denied. Only super admins can manage roles and permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Role & Permission Management</h1>
        <p className="text-gray-400">Manage roles and permissions for the system</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          {error.includes('Failed to load') && (
            <p className="text-red-300 text-sm mt-2">
              Note: If this is the first time accessing this page, you may need to run the migration command:
              <code className="block mt-2 p-2 bg-gray-900 rounded text-xs">
                python manage.py migrate_roles
              </code>
            </p>
          )}
        </div>
      )}

      {permissions.length === 0 && !error && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-400">No permissions found. Please run the migration command to create permissions:</p>
          <code className="block mt-2 p-2 bg-gray-900 rounded text-xs">
            cd backend && python manage.py migrate_roles
          </code>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Role
        </label>
        <select
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="w-full md:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      {loadingPermissions && (
        <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-400">Loading permissions...</p>
        </div>
      )}

      {loading && !loadingPermissions && (
        <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-400">Loading role permissions...</p>
        </div>
      )}

      {permissions.length > 0 ? (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryPermissions = permissions.filter(p => p.category === category);
            
            if (categoryPermissions.length === 0) return null;
            
            return (
              <div key={category} className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-white mb-4 capitalize">
                  {category.replace('_', ' ')} Permissions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPermissions.map((permission) => {
                    const hasPermission = hasPermissionForRole(permission.id, selectedRole);
                    return (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{permission.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">{permission.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Code: {permission.codename}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={hasPermission}
                          onChange={() => togglePermission(permission.id)}
                          disabled={loading || loadingPermissions}
                          className="ml-4 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">No permissions available. Please run the migration command to create permissions.</p>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;

