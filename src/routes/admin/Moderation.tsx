import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  User,
  Home,
  Clock,
  Ban,
  UserCheck
} from 'lucide-react';

interface ModerationReport {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  reported_property_id: string | null;
  report_type: string;
  description: string;
  evidence_urls: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  moderator_id: string | null;
  moderator_notes: string | null;
  resolution: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  reporter?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  reported_user?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  reported_property?: {
    title: string;
    city: string;
  };
}

interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  urgentReports: number;
  reportsByType: Record<string, number>;
}

const ContentModeration = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stats, setStats] = useState<ModerationStats>({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    urgentReports: 0,
    reportsByType: {}
  });
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionData, setActionData] = useState({
    status: '',
    resolution: '',
    moderatorNotes: ''
  });

  const reportTypes = [
    'inappropriate_content',
    'spam',
    'fraud', 
    'harassment',
    'other'
  ];

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, statusFilter, priorityFilter, typeFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('moderation_reports')
        .select(`
          *,
          reporter:profiles!moderation_reports_reporter_id_fkey(email, first_name, last_name),
          reported_user:profiles!moderation_reports_reported_user_id_fkey(email, first_name, last_name),
          reported_property:properties(title, city)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReports(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading moderation reports:', error);
      toast({
        title: "Error",
        description: "Failed to load moderation reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reportData: ModerationReport[]) => {
    const reportsByType: Record<string, number> = {};
    reportData.forEach(report => {
      reportsByType[report.report_type] = (reportsByType[report.report_type] || 0) + 1;
    });

    setStats({
      totalReports: reportData.length,
      pendingReports: reportData.filter(r => r.status === 'pending').length,
      resolvedReports: reportData.filter(r => r.status === 'resolved').length,
      urgentReports: reportData.filter(r => r.priority === 'urgent').length,
      reportsByType
    });
  };

  const filterReports = () => {
    let filtered = reports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporter?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reported_user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reported_property?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(report => report.priority === priorityFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.report_type === typeFilter);
    }

    setFilteredReports(filtered);
  };

  const updateReportStatus = async (reportId: string, status: string, resolution?: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('moderation_reports')
        .update({
          status,
          resolution: resolution || null,
          moderator_notes: notes || null,
          moderator_id: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      // Log the admin action
      await supabase.rpc('log_admin_action', {
        p_action: `moderation_${status}`,
        p_resource_type: 'moderation_report',
        p_resource_id: reportId,
        p_metadata: { status, resolution, notes }
      });

      toast({
        title: "Success",
        description: `Report ${status} successfully`,
      });

      loadReports();
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive",
      });
    }
  };

  const openActionDialog = (report: ModerationReport) => {
    setSelectedReport(report);
    setActionData({
      status: report.status,
      resolution: report.resolution || '',
      moderatorNotes: report.moderator_notes || ''
    });
    setActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedReport) return;

    await updateReportStatus(
      selectedReport.id,
      actionData.status,
      actionData.resolution,
      actionData.moderatorNotes
    );

    setActionDialogOpen(false);
    setSelectedReport(null);
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'resolved': return 'default';
      case 'investigating': return 'secondary';
      case 'dismissed': return 'outline';
      case 'pending': return 'destructive';
      default: return 'outline';
    }
  };

  const getReporterName = (report: ModerationReport) => {
    if (!report.reporter) return 'Anonymous';
    return `${report.reporter.first_name || ''} ${report.reporter.last_name || ''}`.trim() 
      || report.reporter.email || 'Unknown';
  };

  const getReportedUserName = (report: ModerationReport) => {
    if (!report.reported_user) return 'N/A';
    return `${report.reported_user.first_name || ''} ${report.reported_user.last_name || ''}`.trim() 
      || report.reported_user.email || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading moderation reports...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Moderation</h1>
          <p className="text-muted-foreground mt-2">Review and manage reported content and users</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvedReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgentReports}</div>
          </CardContent>
        </Card>
      </div>

      {/* Report Type Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Reports by Type</CardTitle>
          <CardDescription>Distribution of report categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.reportsByType).map(([type, count]) => (
              <Badge key={type} variant="outline" className="px-3 py-1">
                {type.replace('_', ' ')} ({count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {reportTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Reports ({filteredReports.length})</CardTitle>
          <CardDescription>Review and take action on reported content</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {report.report_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{getReporterName(report)}</div>
                      <div className="text-muted-foreground">{report.reporter?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {report.reported_user && (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{getReportedUserName(report)}</span>
                        </div>
                      )}
                      {report.reported_property && (
                        <div className="flex items-center space-x-1">
                          <Home className="h-3 w-3" />
                          <span>{report.reported_property.title}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(report.priority)} className="capitalize">
                      {report.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(report.status)} className="capitalize">
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(report.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Report Details</DialogTitle>
                            <DialogDescription>
                              Review the full report information
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Description</Label>
                              <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                            </div>
                            {report.evidence_urls.length > 0 && (
                              <div>
                                <Label>Evidence</Label>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {report.evidence_urls.length} files attached
                                </div>
                              </div>
                            )}
                            {report.moderator_notes && (
                              <div>
                                <Label>Moderator Notes</Label>
                                <p className="text-sm text-muted-foreground mt-1">{report.moderator_notes}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openActionDialog(report)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>

                      {report.status === 'pending' && (
                        <>
                          <Button 
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'investigating')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'dismissed')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reports found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Moderation Action</DialogTitle>
            <DialogDescription>
              Update the status and add notes for this report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={actionData.status} onValueChange={(value) => setActionData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="resolution">Resolution</Label>
              <Textarea
                id="resolution"
                value={actionData.resolution}
                onChange={(e) => setActionData(prev => ({ ...prev, resolution: e.target.value }))}
                placeholder="Describe the resolution taken..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="moderatorNotes">Moderator Notes</Label>
              <Textarea
                id="moderatorNotes"
                value={actionData.moderatorNotes}
                onChange={(e) => setActionData(prev => ({ ...prev, moderatorNotes: e.target.value }))}
                placeholder="Add internal notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAction}>Update Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentModeration;