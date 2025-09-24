import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '../AdminLayout';
import { Loader2, Search, Filter, Download, Eye, Calendar } from 'lucide-react';

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
}

const AuditLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7'); // days

  // Fetch audit logs
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', dateRange],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('timestamp', cutoffDate.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const filteredLogs = auditLogs?.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesResource =
      resourceFilter === 'all' || log.resource_type === resourceFilter;

    return matchesSearch && matchesAction && matchesResource;
  });

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'bg-green-100 text-green-800';
    if (action.includes('update')) return 'bg-blue-100 text-blue-800';
    if (action.includes('delete')) return 'bg-red-100 text-red-800';
    if (action.includes('login') || action.includes('auth'))
      return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getUniqueActions = () => {
    const actions = auditLogs?.map((log) => log.action) || [];
    return [...new Set(actions)].sort();
  };

  const getUniqueResourceTypes = () => {
    const resources =
      auditLogs?.map((log) => log.resource_type).filter(Boolean) || [];
    return [...new Set(resources)].sort();
  };

  const handleExport = () => {
    const exportData = filteredLogs?.map((log) => ({
      timestamp: log.timestamp,
      action: log.action,
      resource_type: log.resource_type,
      user_id: log.user_id,
      metadata: JSON.stringify(log.metadata),
      ip_address: log.ip_address,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <AdminLayout title='Audit Logs'>
        <div className='flex items-center justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title='Audit Logs'>
      <div className='p-6 space-y-6'>
        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold'>{auditLogs?.length || 0}</div>
              <div className='text-sm text-muted-foreground'>Total Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold'>
                {auditLogs?.filter((log) => log.action.includes('login'))
                  .length || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Login Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold'>
                {auditLogs?.filter((log) => log.action.includes('create'))
                  .length || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Create Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='text-2xl font-bold'>
                {auditLogs?.filter((log) => log.action.includes('update'))
                  .length || 0}
              </div>
              <div className='text-sm text-muted-foreground'>Update Events</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Filter className='h-5 w-5' />
              <span>Filters & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-4'>
              <div className='flex items-center space-x-2'>
                <Search className='h-4 w-4' />
                <Input
                  placeholder='Search logs...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-64'
                />
              </div>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className='w-48'>
                  <SelectValue placeholder='Filter by action' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Actions</SelectItem>
                  {getUniqueActions().map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className='w-48'>
                  <SelectValue placeholder='Filter by resource' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Resources</SelectItem>
                  {getUniqueResourceTypes().map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className='w-48'>
                  <SelectValue placeholder='Date range' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1'>Last 24 hours</SelectItem>
                  <SelectItem value='7'>Last 7 days</SelectItem>
                  <SelectItem value='30'>Last 30 days</SelectItem>
                  <SelectItem value='90'>Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleExport} variant='outline'>
                <Download className='h-4 w-4 mr-2' />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Events</CardTitle>
            <CardDescription>
              Showing {filteredLogs?.length || 0} events from the last{' '}
              {dateRange} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className='font-mono text-sm'>
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.resource_type ? (
                        <Badge variant='outline'>{log.resource_type}</Badge>
                      ) : (
                        <span className='text-muted-foreground'>N/A</span>
                      )}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {log.user_id ? (
                        <span className='bg-gray-100 px-2 py-1 rounded'>
                          {log.user_id.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className='text-muted-foreground'>System</span>
                      )}
                    </TableCell>
                    <TableCell className='font-mono text-sm'>
                      {log.ip_address || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            // TODO: Implement metadata view modal
                            alert(JSON.stringify(log.metadata, null, 2));
                          }}
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                      ) : (
                        <span className='text-muted-foreground'>
                          No details
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AuditLogsPage;
