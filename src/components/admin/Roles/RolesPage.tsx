import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '../AdminLayout';
import { Loader2, Save, Shield, Users, Key } from 'lucide-react';

interface RolePermission {
  id: string;
  role: 'guest' | 'host' | 'admin' | 'super_admin';
  permission_name: string;
  permission_value: boolean;
}

const RolesPage = () => {
  const queryClient = useQueryClient();

  // Fetch role permissions
  const { data: permissions, isLoading } = useQuery({
    queryKey: ['admin-role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles_permissions')
        .select('*')
        .order('role', { ascending: true });
      
      if (error) throw error;
      return data as RolePermission[];
    },
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ role, permissionName, value }: { 
      role: string; 
      permissionName: string; 
      value: boolean; 
    }) => {
      const { error } = await supabase
        .from('roles_permissions')
        .update({ permission_value: value })
        .eq('role', role)
        .eq('permission_name', permissionName);
      
      if (error) throw error;
      
      await supabase.rpc('log_admin_action', {
        p_action: 'update_role_permission',
        p_resource_type: 'roles_permissions',
        p_metadata: { role, permission_name: permissionName, permission_value: value }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-permissions'] });
      toast.success('Permission updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update permission');
      console.error('Permission update error:', error);
    },
  });

  const getPermissionsByRole = (role: string) => {
    return permissions?.filter(p => p.role === role) || [];
  };

  const getPermissionValue = (role: string, permissionName: string): boolean => {
    const permission = permissions?.find(
      p => p.role === role && p.permission_name === permissionName
    );
    return permission?.permission_value || false;
  };

  const handlePermissionToggle = (role: string, permissionName: string, value: boolean) => {
    updatePermissionMutation.mutate({ role, permissionName, value });
  };

  const roleDefinitions = [
    {
      role: 'guest',
      name: 'Guest',
      description: 'Regular users who can book properties',
      color: 'bg-green-100 text-green-800',
      icon: Users,
    },
    {
      role: 'host',
      name: 'Host',
      description: 'Users who can list and manage properties',
      color: 'bg-blue-100 text-blue-800',
      icon: Key,
    },
    {
      role: 'admin',
      name: 'Admin',
      description: 'Platform administrators with elevated privileges',
      color: 'bg-orange-100 text-orange-800',
      icon: Shield,
    },
    {
      role: 'super_admin',
      name: 'Super Admin',
      description: 'Full platform access with all permissions',
      color: 'bg-red-100 text-red-800',
      icon: Shield,
    },
  ];

  const availablePermissions = [
    {
      name: 'can_view_dashboard',
      label: 'View Dashboard',
      description: 'Access to role-specific dashboard',
    },
    {
      name: 'can_create_properties',
      label: 'Create Properties',
      description: 'Ability to list new properties',
    },
    {
      name: 'can_manage_bookings',
      label: 'Manage Bookings',
      description: 'View and manage booking requests',
    },
    {
      name: 'can_access_analytics',
      label: 'Access Analytics',
      description: 'View performance analytics and reports',
    },
    {
      name: 'can_manage_users',
      label: 'Manage Users',
      description: 'User management capabilities',
    },
    {
      name: 'can_manage_properties',
      label: 'Manage All Properties',
      description: 'Manage properties across the platform',
    },
    {
      name: 'can_view_audit_logs',
      label: 'View Audit Logs',
      description: 'Access to system audit logs',
    },
    {
      name: 'can_manage_settings',
      label: 'Manage Settings',
      description: 'Configure platform settings',
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout title="Role Permissions">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Role Permissions">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleDefinitions.map((roleDef) => {
            const Icon = roleDef.icon;
            const rolePermissions = getPermissionsByRole(roleDef.role);
            const activePermissions = rolePermissions.filter(p => p.permission_value).length;
            
            return (
              <Card key={roleDef.role}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon className="h-5 w-5" />
                    <Badge className={roleDef.color}>
                      {roleDef.name}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {roleDef.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activePermissions} permissions enabled
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          {roleDefinitions.map((roleDef) => (
            <Card key={roleDef.role}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <roleDef.icon className="h-6 w-6" />
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{roleDef.name} Permissions</span>
                      <Badge className={roleDef.color}>
                        {roleDef.role}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{roleDef.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePermissions.map((permission) => (
                    <div key={permission.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor={`${roleDef.role}-${permission.name}`}>
                            {permission.label}
                          </Label>
                          <div className="text-sm text-muted-foreground">
                            {permission.description}
                          </div>
                        </div>
                        <Switch
                          id={`${roleDef.role}-${permission.name}`}
                          checked={getPermissionValue(roleDef.role, permission.name)}
                          onCheckedChange={(checked) => 
                            handlePermissionToggle(roleDef.role, permission.name, checked)
                          }
                          disabled={updatePermissionMutation.isPending}
                        />
                      </div>
                      {permission.name !== availablePermissions[availablePermissions.length - 1].name && (
                        <Separator />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Access Rules Overview</span>
            </CardTitle>
            <CardDescription>
              Summary of role-based access controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {roleDefinitions.map((roleDef) => {
                  const enabledPermissions = availablePermissions.filter(perm => 
                    getPermissionValue(roleDef.role, perm.name)
                  );
                  
                  return (
                    <div key={roleDef.role} className="space-y-2">
                      <Badge className={roleDef.color}>
                        {roleDef.name}
                      </Badge>
                      <div className="space-y-1">
                        {enabledPermissions.length > 0 ? (
                          enabledPermissions.map((perm) => (
                            <div key={perm.name} className="text-xs text-muted-foreground flex items-center">
                              <div className="w-1 h-1 bg-green-500 rounded-full mr-2" />
                              {perm.label}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            No permissions enabled
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default RolesPage;