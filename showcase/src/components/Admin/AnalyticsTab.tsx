import { useMemo, useState } from 'react';
import { TabsContent } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Download,
  Eye,
} from 'lucide-react';

interface AnalyticsTabProps {
  projects: any[];
  users: any[];
}

export function AnalyticsTab({ projects, users }: AnalyticsTabProps) {
  const [studentYearFilter, setStudentYearFilter] = useState<string>('All');
  const [exporting, setExporting] = useState(false);

  const totalProjects = projects.length;
  const totalStudents = users.filter((u) => u.role === 'student').length;
  const featuredProjects = projects.filter((p) => p.featured).length;
  const totalViews = projects.reduce((sum, p) => sum + (p.stats?.views || 0), 0);

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      const y = p.author?.year || 'Unknown';
      if (y) set.add(y);
    }
    return ['All', ...Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))];
  }, [projects]);

  const categoryData = useMemo(() => {
    const filtered =
      studentYearFilter === 'All'
        ? projects
        : projects.filter((p) => (p.author?.year || 'Unknown') === studentYearFilter);
    const colorPalette = ['#ff6b35', '#4ade80', '#60a5fa', '#f59e0b', '#ec4899'];
    const map = new Map<string, number>();
    for (const p of filtered) {
      const key = (p.category || 'Others').trim() || 'Others';
      map.set(key, (map.get(key) || 0) + 1);
    }
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return entries.map(([name, count], i) => ({ name, count, color: colorPalette[i % colorPalette.length] }));
  }, [projects, studentYearFilter]);

  const yearData = useMemo(() => {
    const ym = new Map<string, number>();
    for (const p of projects) {
      const y = p.author?.year || 'Unknown';
      ym.set(y, (ym.get(y) || 0) + 1);
    }
    return Array.from(ym.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => String(a.year).localeCompare(String(b.year)));
  }, [projects]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { key: string; month: string; projects: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString(undefined, { month: 'short' });
      months.push({ key, month: label, projects: 0 });
    }
    const indexByKey = new Map(months.map((m, idx) => [m.key, idx] as const));
    for (const p of projects) {
      const t = new Date(p.created_at || p.updated_at || Date.now());
      const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
      const idx = indexByKey.get(key);
      if (idx !== undefined) months[idx].projects += 1;
    }
    return months;
  }, [projects]);

  const topTags = useMemo(() => {
    const tm = new Map<string, number>();
    for (const p of projects) {
      const tags: string[] = Array.isArray(p.tags) ? p.tags : [];
      for (const raw of tags) {
        const t = (raw || '').trim();
        if (!t) continue;
        tm.set(t, (tm.get(t) || 0) + 1);
      }
    }
    return Array.from(tm.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [projects]);

  const totalLikes = projects.reduce((sum, p) => sum + (p.stats?.likes || 0), 0);
  const totalComments = projects.reduce((sum, p) => sum + (p.stats?.comments || 0), 0);

  const topProjectsByViews = useMemo(
    () =>
      [...projects]
        .map((p) => ({ id: p.id, title: p.title, views: p.stats?.views || 0, category: p.category }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5),
    [projects],
  );

  const downloadText = (filename: string, mime: string, content: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.open(url, '_blank', 'noopener,noreferrer');
    URL.revokeObjectURL(url);
  };

  const toCsv = (rows: Record<string, any>[], headers: string[]) => {
    const escape = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map((h) => escape(row[h])).join(','));
    }
    return lines.join('\n');
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExporting(true);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const summary = {
        totals: {
          totalProjects,
          totalStudents,
          featuredProjects,
          totalViews,
          totalLikes,
          totalComments,
        },
        projects: projects.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          authorYear: p.author?.year,
          views: p.stats?.views || 0,
          likes: p.stats?.likes || 0,
          comments: p.stats?.comments || 0,
          featured: !!p.featured,
          updated_at: p.updated_at || p.created_at,
        })),
        users: users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          year: u.year,
          created_at: u.created_at,
        })),
      };

      if (format === 'json') {
        downloadText(`ddct-analytics-${timestamp}.json`, 'application/json', JSON.stringify(summary, null, 2));
      } else {
        const projectHeaders = ['id', 'title', 'category', 'authorYear', 'views', 'likes', 'comments', 'featured', 'updated_at'];
        const userHeaders = ['id', 'name', 'email', 'role', 'year', 'created_at'];
        const csv = [
          '# Projects',
          toCsv(summary.projects as any, projectHeaders),
          '',
          '# Users',
          toCsv(summary.users as any, userHeaders),
          '',
          '# Totals',
          toCsv([summary.totals], Object.keys(summary.totals)),
        ].join('\n');
        downloadText(`ddct-analytics-${timestamp}.csv`, 'text/csv', csv);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <TabsContent value="analytics" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{totalProjects}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Featured Projects</p>
                <p className="text-2xl font-bold">{featuredProjects}</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Student year (owner):</span>
          <select
            value={studentYearFilter}
            onChange={(e) => setStudentYearFilter(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Preparing…' : 'Export CSV'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('json')} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Preparing…' : 'Export JSON'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projects by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects by Student Year</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#4ade80" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Project Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="projects" stroke="#ff6b35" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topTags}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tag" interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Likes
                </div>
                <div className="text-2xl font-bold">{totalLikes}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Comments
                </div>
                <div className="text-2xl font-bold">{totalComments}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Projects by Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topProjectsByViews.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div className="truncate max-w-[70%]">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.category}</div>
                  </div>
                  <div className="text-sm font-semibold">{p.views}</div>
                </div>
              ))}
              {topProjectsByViews.length === 0 && (
                <div className="text-sm text-muted-foreground">No views yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tag Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topTags.map((t) => (
                <Badge key={t.tag} variant="outline" className="text-xs">
                  {t.tag} ({t.count})
                </Badge>
              ))}
              {topTags.length === 0 && (
                <p className="text-sm text-muted-foreground">No tags yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

