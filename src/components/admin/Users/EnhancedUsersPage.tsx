import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdminQueryClient } from "@/hooks/useAdminQueryClient";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  MoreHorizontal,
  UserCheck,
  UserX,
  Shield,
  Eye,
  MessageSquare,
  UserPlus,
  Loader,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "../AdminLayout";
import { Link } from "react-router-dom";

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: "guest" | "host" | "super_admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  guestUsers: number;
  hostUsers: number;
  pendingHosts: number;
}

const EnhancedUsersPage = () => {
  const { queryClient, invalidateAdminQueries } = useAdminQueryClient();
  const pageSize = 10;
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { data: selectedUserProperties, isLoading: loadingProperties } =
    useQuery({
      queryKey: ["user", selectedUser?.id],
      queryFn: async () => {
        if (!selectedUser) return [];
        const { data, error } = await supabase
          .from("properties")
          .select("id, title, is_active")
          .eq("host_id", selectedUser?.id);

        if (error) {
          console.error("Error fetching properties:", error);
          return [];
        }
        return data;
      },
    });

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as User[];
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      newRole,
    }: {
      userId: string;
      newRole: string;
    }) => {
      const { error } = await supabase.rpc("update_user_role", {
        target_user_id: userId,
        new_role: newRole,
      });

      if (error) throw error;

      await supabase.rpc("log_admin_action", {
        p_action: "update_user_role",
        p_resource_type: "profiles",
        p_resource_id: userId,
        p_metadata: { new_role: newRole },
      });
    },
    onSuccess: () => {
      invalidateAdminQueries([["admin-users"]]);
      toast.success("User role updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update user role");
      console.error("User role update error:", error);
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      disable,
    }: {
      userId: string;
      disable: boolean;
    }) => {
      const { error } = await supabase.rpc("toggle_user_status", {
        target_user_id: userId,
        disable_user: disable,
      });

      if (error) throw error;

      await supabase.rpc("log_admin_action", {
        p_action: disable ? "disable_user" : "enable_user",
        p_resource_type: "profiles",
        p_resource_id: userId,
        p_metadata: { status: disable ? "disabled" : "enabled" },
      });
    },
    onSuccess: (_, { disable }) => {
      invalidateAdminQueries([["admin-users"]]);
      toast.success(
        `User ${disable ? "deactivated" : "activated"} successfully`
      );
    },
    onError: (error) => {
      toast.error("Failed to update user status");
      console.error("User status update error:", error);
    },
  });

  // Calculate stats
  const stats: UserStats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.is_active).length,
    guestUsers: users.filter((u) => u.role === "guest").length,
    hostUsers: users.filter((u) => u.role === "host").length,
    pendingHosts: 0, // Future: implement host request status
  };

  // Filter users based on active tab
  const filteredUsers = users.filter((user) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return user.is_active;
    if (activeTab === "inactive") return !user.is_active;
    return user.role === activeTab;
  });

  const formatUserName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    return "N/A";
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "host":
        return "default";
      case "guest":
        return "secondary";
      default:
        return "outline";
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div>
            {user && (
              <>
                <div className="font-medium">{formatUserName(user)}</div>
                <div className="text-sm text-muted-foreground">
                  {user.email}
                </div>
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return <Badge variant={getRoleBadgeVariant(role)}>{role}</Badge>;
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at") as string);
        return date.toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu
            open={selectedUser?.id == user.id && !loadingProperties}
            onOpenChange={(open) => {
              if (open) {
                if (user.id != selectedUser?.id) {
                  setSelectedUser(user);
                  // setDropDownId(user.id);
                }
              } else setSelectedUser(null);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                {loadingProperties && selectedUser.id == user.id ? (
                  <Loader />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
                    <DialogDescription>
                      View and manage user information
                    </DialogDescription>
                  </DialogHeader>
                  {selectedUser && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <p className="text-sm text-muted-foreground">
                            {formatUserName(selectedUser)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Email</label>
                          <p className="text-sm text-muted-foreground">
                            {selectedUser.email}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Role</label>
                          <p className="text-sm text-muted-foreground">
                            {selectedUser.role}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <p className="text-sm text-muted-foreground">
                            {selectedUser.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Created</label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedUser.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Last Updated
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedUser.updated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {user.role === "guest" && (
                <DropdownMenuItem
                  onClick={() =>
                    updateUserRoleMutation.mutate({
                      userId: user.id,
                      newRole: "host",
                    })
                  }
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Approve as Host
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => {
                  const newRole = prompt(
                    "Enter new role (guest, host, super_admin):"
                  );
                  if (
                    newRole &&
                    ["guest", "host", "super_admin"].includes(newRole)
                  ) {
                    updateUserRoleMutation.mutate({ userId: user.id, newRole });
                  }
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Change Role
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => toast.info("Message feature coming soon")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                    className={
                      user.is_active ? "text-red-600" : "text-green-600"
                    }
                  >
                    {user.is_active ? (
                      <>
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {user.is_active ? "Deactivate" : "Activate"} User{" "}
                      {selectedUser
                        ? `${selectedUser?.first_name} ${selectedUser?.last_name}`
                        : ""}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to{" "}
                      {user.is_active ? "deactivate" : "activate"} this user?
                      {user.is_active &&
                        " They will no longer be able to access the platform."}
                      {selectedUser?.role === "host" && (
                        <div className="space-y-3 my-4">
                          <p className="font-semibold text-red-700 text-xs">
                            Warning: Deactivating this host will also deactivate
                            the following properties:
                          </p>
                          {loadingProperties ? (
                            <div className="text-center text-xs text-muted-foreground">
                              Loading properties...
                            </div>
                          ) : selectedUserProperties &&
                            selectedUserProperties.length > 0 ? (
                            <div className="max-h-40 overflow-y-auto">
                              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                                {selectedUserProperties.map((property: any) => (
                                  <li key={property.id}>
                                    <Link
                                      to={`/property/${property.id}`}
                                      className="font-medium text-blue-950 hover:underline"
                                    >
                                      {property.title}
                                      {!property.is_active && (
                                        <Badge
                                          variant="secondary"
                                          className="ml-2"
                                        >
                                          Already Inactive
                                        </Badge>
                                      )}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              This user does not own any properties.
                            </p>
                          )}
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        toggleUserStatusMutation.mutate({
                          userId: user.id,
                          disable: user.is_active,
                        })
                      }
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout title="User Management">
        <div className="flex items-center justify-center p-8">
          <div className="text-lg">Loading users...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management">
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeUsers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.guestUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hosts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hostUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Hosts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pendingHosts}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="guest">Guests</TabsTrigger>
            <TabsTrigger value="host">Hosts</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Users ({filteredUsers.length})</CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={filteredUsers}
                  searchPlaceholder="Search by email..."
                  searchColumn="email"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default EnhancedUsersPage;
