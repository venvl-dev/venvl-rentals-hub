import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
} from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    role: string;
  };
}

interface SecurityLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  success: boolean;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    role: string;
  };
}

interface LogStats {
  totalLogs: number;
  todayLogs: number;
  failedActions: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
}

const AuditLogsPage = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<(AuditLog | SecurityLog)[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'audit' | 'security'>('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [stats, setStats] = useState<LogStats>({
    totalLogs: 0,
    todayLogs: 0,
    failedActions: 0,
    uniqueUsers: 0,
    topActions: [],
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | SecurityLog | null>(
    null,
  );
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState<
    Array<{ id: string; email: string }>
  >([]);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [
    auditLogs,
    securityLogs,
    activeTab,
    searchTerm,
    actionFilter,
    dateFilter,
    userFilter,
  ]);

  const loadLogs = async () => {
    try {
      setLoading(true);

      // Load audit logs with user profiles
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select(
          `
          *,
          profiles(first_name, last_name, email, role)
        `,
        )
        .order('timestamp', { ascending: false })
        .limit(100);

      if (auditError) throw auditError;

      // Load security logs with user profiles
      const { data: securityData, error: securityError } = await supabase
        .from('security_audit_log')
        .select(
          `
          *,
          profiles(first_name, last_name, email, role)
        `,
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (securityError) throw securityError;

      setAuditLogs(auditData || []);
      setSecurityLogs(securityData || []);

      // Calculate stats
      calculateStats(auditData || [], securityData || []);

      // Extract unique actions and users for filters
      const allActions = [
        ...new Set([
          ...(auditData || []).map((log) => log.action),
          ...(securityData || []).map((log) => log.action),
        ]),
      ].filter(Boolean);
      setUniqueActions(allActions);

      const allUsers = [
        ...new Map(
          [
            ...(auditData || [])
              .filter((log) => log.profiles)
              .map((log) => [
                log.user_id,
                { id: log.user_id!, email: log.profiles!.email },
              ]),
            ...(securityData || [])
              .filter((log) => log.profiles)
              .map((log) => [
                log.user_id,
                { id: log.user_id!, email: log.profiles!.email },
              ]),
          ].filter(([id]) => id),
        ).values(),
      ] as Array<{ id: string; email: string }>;
      setUniqueUsers(allUsers);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (
    auditData: AuditLog[],
    securityData: SecurityLog[],
  ) => {
    const allLogs = [...auditData, ...securityData];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = allLogs.filter((log) => {
      const logDate = new Date(
        'timestamp' in log ? log.timestamp : log.created_at,
      );
      return logDate >= today;
    });

    const failedActions = securityData.filter((log) => !log.success).length;

    const uniqueUserIds = new Set(
      allLogs.map((log) => log.user_id).filter(Boolean),
    );

    // Count actions
    const actionCounts: Record<string, number> = {};
    allLogs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    setStats({
      totalLogs: allLogs.length,
      todayLogs: todayLogs.length,
      failedActions,
      uniqueUsers: uniqueUserIds.size,
      topActions,
    });
  };

  const filterLogs = () => {
    const sourceLogs = activeTab === 'audit' ? auditLogs : securityLogs;
    let filtered = [...sourceLogs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.profiles?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter((log) => {
        const logDate = new Date(
          'timestamp' in log ? log.timestamp : log.created_at,
        );
        return logDate >= startDate;
      });
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter((log) => log.user_id === userFilter);
    }

    setFilteredLogs(filtered);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('login') || action.includes('signup')) return 'default';
    if (action.includes('delete') || action.includes('reject'))
      return 'destructive';
    if (action.includes('create') || action.includes('approve'))
      return 'default';
    if (action.includes('update') || action.includes('edit'))
      return 'secondary';
    return 'outline';
  };

  const getLogTypeIcon = (log: AuditLog | SecurityLog) => {
    if ('success' in log) {
      // Security log
      return log.success ? (
        <CheckCircle className='h-4 w-4 text-green-500' />
      ) : (
        <XCircle className='h-4 w-4 text-red-500' />
      );
    } else {
      // Audit log
      return <Activity className='h-4 w-4 text-blue-500' />;
    }
  };

  const getUserName = (log: AuditLog | SecurityLog) => {
    const profile = log.profiles;
    if (!profile) return 'System';
    return (
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
      profile.email ||
      'Unknown User'
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <AdminLayout title='Audit Logs'>
        <div className='flex items-center justify-center p-8'>
          <div className='text-lg'>Loading audit logs...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title='Audit Logs'>
      <div className='p-6 space-y-6'>
        <div>
          <p className='text-muted-foreground'>
            Monitor system activities and security events
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Logs</CardTitle>
              <FileText className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.totalLogs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Today's Activity
              </CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.todayLogs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Failed Actions
              </CardTitle>
              <AlertTriangle className='h-4 w-4 text-red-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-600'>
                {stats.failedActions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Unique Users
              </CardTitle>
              <User className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.uniqueUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Actions */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Top Actions</CardTitle>
            <CardDescription>
              Most frequent activities on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-2'>
              {stats.topActions.map(({ action, count }) => (
                <Badge key={action} variant='outline' className='px-3 py-1'>
                  {action} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className='flex space-x-1 mb-6'>
          <Button
            variant={activeTab === 'audit' ? 'default' : 'outline'}
            onClick={() => setActiveTab('audit')}
          >
            <Activity className='h-4 w-4 mr-2' />
            Audit Logs
          </Button>
          <Button
            variant={activeTab === 'security' ? 'default' : 'outline'}
            onClick={() => setActiveTab('security')}
          >
            <Shield className='h-4 w-4 mr-2' />
            Security Logs
          </Button>
        </div>

        {/* Filters */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='relative'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search logs...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='Filter by action' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='Filter by date' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Time</SelectItem>
                  <SelectItem value='today'>Today</SelectItem>
                  <SelectItem value='week'>Last Week</SelectItem>
                  <SelectItem value='month'>Last Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='Filter by user' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Users</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'audit' ? 'Audit Logs' : 'Security Logs'} (
              {filteredLogs.length})
            </CardTitle>
            <CardDescription>
              {activeTab === 'audit'
                ? 'System activities and administrative actions'
                : 'Authentication and security-related events'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className='flex items-center space-x-2'>
                        {getLogTypeIcon(log)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className='font-medium'>{getUserName(log)}</div>
                        <div className='text-sm text-muted-foreground'>
                          {log.profiles?.email || 'System'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        <div>{log.resource_type || 'N/A'}</div>
                        {log.resource_id && (
                          <div className='text-muted-foreground text-xs'>
                            {log.resource_id.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        {formatTimestamp(
                          'timestamp' in log ? log.timestamp : log.created_at,
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className='max-w-2xl'>
                          <DialogHeader>
                            <DialogTitle>Log Details</DialogTitle>
                            <DialogDescription>
                              Detailed information about this log entry
                            </DialogDescription>
                          </DialogHeader>
                          {selectedLog && (
                            <div className='space-y-4'>
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='text-sm font-medium'>
                                    Action
                                  </label>
                                  <p className='text-sm text-muted-foreground'>
                                    {selectedLog.action}
                                  </p>
                                </div>
                                <div>
                                  <label className='text-sm font-medium'>
                                    User
                                  </label>
                                  <p className='text-sm text-muted-foreground'>
                                    {getUserName(selectedLog)}
                                  </p>
                                </div>
                              </div>
                              <div className='grid grid-cols-2 gap-4'>
                                <div>
                                  <label className='text-sm font-medium'>
                                    Resource Type
                                  </label>
                                  <p className='text-sm text-muted-foreground'>
                                    {selectedLog.resource_type || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <label className='text-sm font-medium'>
                                    Resource ID
                                  </label>
                                  <p className='text-sm text-muted-foreground'>
                                    {selectedLog.resource_id || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <label className='text-sm font-medium'>
                                  IP Address
                                </label>
                                <p className='text-sm text-muted-foreground'>
                                  {selectedLog.ip_address || 'N/A'}
                                </p>
                              </div>
                              {'success' in selectedLog && (
                                <div>
                                  <label className='text-sm font-medium'>
                                    Success
                                  </label>
                                  <p className='text-sm text-muted-foreground'>
                                    {selectedLog.success ? 'Yes' : 'No'}
                                  </p>
                                </div>
                              )}
                              {'error_message' in selectedLog &&
                                selectedLog.error_message && (
                                  <div>
                                    <label className='text-sm font-medium'>
                                      Error Message
                                    </label>
                                    <p className='text-sm text-red-600'>
                                      {selectedLog.error_message}
                                    </p>
                                  </div>
                                )}
                              {'metadata' in selectedLog &&
                                selectedLog.metadata &&
                                Object.keys(selectedLog.metadata).length >
                                  0 && (
                                  <div>
                                    <label className='text-sm font-medium'>
                                      Metadata
                                    </label>
                                    <pre className='text-xs bg-muted p-2 rounded overflow-auto max-h-32'>
                                      {JSON.stringify(
                                        selectedLog.metadata,
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </div>
                                )}
                              <div>
                                <label className='text-sm font-medium'>
                                  Timestamp
                                </label>
                                <p className='text-sm text-muted-foreground'>
                                  {formatTimestamp(
                                    'timestamp' in selectedLog
                                      ? selectedLog.timestamp
                                      : selectedLog.created_at,
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredLogs.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <FileText className='h-12 w-12 mx-auto mb-4 opacity-50' />
                <p>No logs found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AuditLogsPage;
