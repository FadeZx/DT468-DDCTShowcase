import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  Users, BookOpen, Award, TrendingUp, Download, 
  Calendar, Filter, FileText, MessageSquare, Image as ImageIcon, Video as VideoIcon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SupabaseImage } from './figma/SupabaseImage';
import supabase from '../utils/supabase/client';
import { cleanupOrphanedProjectStorage } from '../utils/fileStorage';

interface AdminDashboardProps {
  projects: any[];
  users: any[];
}

export function AdminDashboard({ projects, users }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2024');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [cleaning, setCleaning] = useState(false);
  const handleCleanStorage = async () => {
    if (cleaning) return;
    setCleaning(true);
    try {
      const { removed, kept } = await cleanupOrphanedProjectStorage();
      alert(`Orphaned storage cleanup completed. Removed ${removed} files. Kept ${kept}.`);
    } catch (e) {
      console.error('Cleanup failed', e);
      alert('Storage cleanup failed. See console for details.');
    } finally {
      setCleaning(false);
    }
  };
  const [showFilters, setShowFilters] = useState(false);
  // Filter: project owner (author) student year
  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      const y = p.author?.year || 'Unknown';
      if (y) set.add(y);
    }
    return ['All', ...Array.from(set).sort((a,b) => String(a).localeCompare(String(b)))];
  }, [projects]);
  const [studentYearFilter, setStudentYearFilter] = useState<string>('All');
  const analyticsRef = useRef<HTMLDivElement>(null);

  // Calculate statistics from real data
  const totalProjects = projects.length;
  const totalStudents = users.filter(u => u.role === 'student').length;
  const featuredProjects = projects.filter(p => p.featured).length;
  const totalViews = projects.reduce((sum, p) => sum + (p.stats?.views || 0), 0);

  // Dynamic project categories
  const categoryData = useMemo(() => {
    const filtered = studentYearFilter === 'All'
      ? projects
      : projects.filter(p => (p.author?.year || 'Unknown') === studentYearFilter);
    const colorPalette = ['#ff6b35', '#4ade80', '#60a5fa', '#f59e0b', '#ec4899', '#a78bfa', '#34d399', '#f472b6', '#f87171', '#22d3ee'];
    const map = new Map<string, number>();
    for (const p of filtered) {
      const key = (p.category || 'Others').trim() || 'Others';
      map.set(key, (map.get(key) || 0) + 1);
    }
    const entries = Array.from(map.entries()).sort((a,b) => b[1]-a[1]);
    return entries.map(([name, count], i) => ({ name, count, color: colorPalette[i % colorPalette.length] }));
  }, [projects, studentYearFilter]);

  // Projects by student year
  const yearData = useMemo(() => {
    const ym = new Map<string, number>();
    for (const p of projects) {
      const y = p.author?.year || 'Unknown';
      ym.set(y, (ym.get(y) || 0) + 1);
    }
    return Array.from(ym.entries()).map(([year, count]) => ({ year, count })).sort((a,b) => String(a.year).localeCompare(String(b.year)));
  }, [projects]);

  // Monthly project submissions from created_at (last 12 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { key: string; month: string; projects: number; views: number }[] = [];
    for (let i=11;i>=0;i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleString(undefined, { month: 'short' });
      months.push({ key, month: label, projects: 0, views: 0 });
    }
    const indexByKey = new Map(months.map((m, idx) => [m.key, idx] as const));
    for (const p of projects) {
      const t = new Date(p.created_at || p.updated_at || Date.now());
      const key = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}`;
      const idx = indexByKey.get(key);
      if (idx !== undefined) months[idx].projects += 1;
    }
    return months;
  }, [projects]);

  // Tag popularity
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
      .sort((a,b) => b.count - a.count)
      .slice(0, 12);
  }, [projects]);

  // Engagement and media stats from Supabase
  const [engagement, setEngagement] = useState<{ totalLikes: number; totalComments: number }>({ totalLikes: 0, totalComments: 0 });
  const [mediaCounts, setMediaCounts] = useState<{ image: number; video: number; project: number; document: number }>({ image: 0, video: 0, project: 0, document: 0 });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [likesRes, commentsRes, imgRes, vidRes, projRes, docRes] = await Promise.all([
          supabase.from('project_likes').select('id', { count: 'exact', head: true }),
          supabase.from('project_comments').select('id', { count: 'exact', head: true }),
          supabase.from('project_files').select('id', { count: 'exact', head: true }).eq('file_type', 'image'),
          supabase.from('project_files').select('id', { count: 'exact', head: true }).eq('file_type', 'video'),
          supabase.from('project_files').select('id', { count: 'exact', head: true }).eq('file_type', 'project'),
          supabase.from('project_files').select('id', { count: 'exact', head: true }).eq('file_type', 'document'),
        ]);
        if (!mounted) return;
        setEngagement({ totalLikes: likesRes.count || 0, totalComments: commentsRes.count || 0 });
        setMediaCounts({
          image: imgRes.count || 0,
          video: vidRes.count || 0,
          project: projRes.count || 0,
          document: docRes.count || 0,
        });
      } catch {
        if (mounted) {
          setEngagement({ totalLikes: 0, totalComments: 0 });
          setMediaCounts({ image: 0, video: 0, project: 0, document: 0 });
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const recentProjects = projects.slice(0, 10);
  const topProjectsByLikes = useMemo(() => {
    return [...projects]
      .sort((a: any, b: any) => (b.stats?.likes || 0) - (a.stats?.likes || 0))
      .slice(0, 5)
      .map((p: any) => ({ id: p.id, title: p.title, likes: p.stats?.likes || 0, category: p.category || 'Others' }));
  }, [projects]);

  function toCSV(rows: any[]): string {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => escape(r[h])).join(',')));
    return lines.join('\n');
  }

  function downloadBlob(content: BlobPart, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Render tabular PDF from data (same info as CSV/JSON)
  async function exportPDFData(payload: {
    year: string;
    summary: Record<string, any>;
    categoryRows: { category: string; count: number }[];
    yearRows: { year: string; count: number }[];
    monthlyRows: { month: string; projects: number; views: number }[];
    featuredRows: { id: any; title: string; category: string; views: number; likes: number; author: string }[];
    projects: any[];
    users: any[];
  }) {
    const { jsPDF } = await import('jspdf');
    // Make the whole report landscape by default for more horizontal space
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    let pageW = doc.internal.pageSize.getWidth();
    let pageH = doc.internal.pageSize.getHeight();
    const margin = 36;
    let y = margin;

    const addHeader = (title: string) => {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(title, margin, y);
      y += 10;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated at ${new Date().toLocaleString()} • Year ${payload.year}`, margin, y);
      y += 14;
    };

    const ensureSpace = (need: number) => {
      if (y + need > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const addKV = (obj: Record<string, any>) => {
      const entries = Object.entries(obj);
      const colW = (pageW - margin * 2) / 2;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      entries.forEach(([_k, _v], i) => {
        const k = String(_k);
        const v = String(_v);
        const row = `${k}: ${v}`;
        const lines = doc.splitTextToSize(row, colW - 6);

        ensureSpace(14 * lines.length + 2);
        const col = i % 2;
        const x = margin + col * colW;
        doc.text(lines, x, y);
        if (col === 1) y += 14 * lines.length;
      });
      if (entries.length % 2 === 1) y += 14; // pad if odd
    };

    const addSectionTitle = (t: string) => {
      ensureSpace(22);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(t, margin, y);
      y += 8;
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 8;
    };

    // Advanced table: supports per-table widths, landscape pages, max lines per cell with ellipsis
    const addTableAdvanced = (
      headers: string[],
      rows: any[],
      options?: { widths?: number[]; landscape?: boolean; maxLines?: number }
    ) => {
      const maxLines = options?.maxLines ?? 4;

      // Switch to landscape page if requested
      let restorePortrait = false;
      if (options?.landscape) {
        doc.addPage(undefined, 'landscape');
        // refresh page metrics for landscape
        // @ts-ignore
        pageW = doc.internal.pageSize.getWidth();
        // @ts-ignore
        pageH = doc.internal.pageSize.getHeight();
        y = margin;
        restorePortrait = true;
      }

      const tableW = pageW - margin * 2;
      let widths: number[];
      const columnWidths = options?.widths;
      if (columnWidths && columnWidths.length === headers.length) {
        const sum = columnWidths.reduce((a, b) => a + b, 0);
        if (sum > 0 && sum <= 2) {
          const scale = tableW / sum;
          widths = columnWidths.map(w => w * scale);
        } else if (sum > tableW * 1.5) {
          const scale = tableW / sum;
          widths = columnWidths.map(w => w * scale);
        } else {
          widths = columnWidths.slice();
        }
      } else {
        widths = headers.map(() => tableW / headers.length);
      }

      // Header row with background and borders
      ensureSpace(26);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setDrawColor(180);
      doc.setFillColor(235, 235, 235); // lighter header background for normal look
      let x = margin;
      const headerHeight = 18;
      headers.forEach((h, i) => {
        doc.rect(x, y - 14, widths[i], headerHeight, 'FD');
        const wrapped = doc.splitTextToSize(String(h), widths[i] - 10);
        doc.setTextColor(0);
        doc.text(wrapped, x + 6, y - 2);
        x += widths[i];
      });
      y += 12;

      // Body rows with grid borders and zebra stripes
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      const lineH = 13; // slightly taller line height
      const cellPadX = 6;
      const cellPadY = 6;
      rows.forEach((r, rowIdx) => {
        // Prepare wrapped cells and apply maxLines with ellipsis
        const wrappedCells = headers.map((h, i) => {
          const cell = r[h] !== undefined ? r[h] : '';
          const text = Array.isArray(cell) ? cell.join(', ') : String(cell);
          let wrapped = doc.splitTextToSize(text, widths[i] - cellPadX * 2);
          if (wrapped.length > maxLines) {
            wrapped = wrapped.slice(0, maxLines);
            wrapped[wrapped.length - 1] = wrapped[wrapped.length - 1] + '…';
          }
          return wrapped;
        });
        const maxL = wrappedCells.reduce((m, w) => Math.max(m, w.length || 1), 1);
        const rowHeight = Math.max(lineH, lineH * maxL) + cellPadY;
        ensureSpace(rowHeight + 2);

        // Zebra fill (very light)
        if (rowIdx % 2 === 1) {
          doc.setFillColor(248, 248, 248);
          doc.rect(margin, y - (lineH - 3), tableW, rowHeight, 'F');
        }

        // Draw cells and borders with padding
        let cx = margin;
        headers.forEach((_, i) => {
          doc.setDrawColor(200);
          doc.rect(cx, y - (lineH - 3), widths[i], rowHeight);
          if (wrappedCells[i].length) {
            doc.setTextColor(0);
            doc.text(wrappedCells[i], cx + cellPadX, y);
          }
          cx += widths[i];
        });
        y += rowHeight;
      });

      // Restore portrait if we switched to landscape for this table
      if (restorePortrait) {
        doc.addPage(undefined, 'portrait');
        // @ts-ignore
        pageW = doc.internal.pageSize.getWidth();
        // @ts-ignore
        pageH = doc.internal.pageSize.getHeight();
        y = margin;
      }
    };

    // Backward compatible simple table
    const addTable = (headers: string[], rows: any[], columnWidths?: number[]) => addTableAdvanced(headers, rows, { widths: columnWidths });

    // Document
    addHeader('DDCT Analytics Report');

    addSectionTitle('Summary');
    addKV(payload.summary);

    addSectionTitle('Category Stats');
    addTable(['category', 'count'], payload.categoryRows);

    addSectionTitle('Year Stats');
    addTable(['year', 'count'], payload.yearRows);

    addSectionTitle('Monthly Trends');
    addTable(['month', 'projects', 'views'], payload.monthlyRows);

    addSectionTitle('Featured Projects');
    addTableAdvanced(
      ['id', 'title', 'category', 'views', 'likes', 'author'],
      payload.featuredRows,
      { widths: [80, 180, 90, 60, 60, 120], maxLines: 2 }
    );

    addSectionTitle('Projects');
    addTableAdvanced(
      ['id','title','description','category','author_id','author_name','author_year','featured','views','likes','downloads','created_at','updated_at'],
      payload.projects,
      { widths: [80, 140, 220, 90, 90, 120, 80, 60, 60, 60, 70, 100, 100], landscape: true, maxLines: 3 }
    );

    addSectionTitle('Users');
    addTableAdvanced(
      ['id','name','email','role','year','projects_count','created_at','updated_at'],
      payload.users,
      { widths: [100, 120, 180, 70, 60, 90, 100, 100], landscape: true, maxLines: 2 }
    );

    doc.save(`ddct-analytics-${payload.year}.pdf`);
  }

  // Previous screenshot-based export kept for reference if needed
  async function exportPDFScreenshot() {
    const section = analyticsRef.current;
    if (!section) return;
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(section, { scale: 2, useCORS: true, backgroundColor: '#111827' });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 48;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let remaining = imgHeight;
    let sourceY = 0;
    const sliceHeight = (canvas.width * (pageHeight - 48)) / imgWidth;
    while (remaining > 0) {
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.min(sliceHeight, canvas.height - sourceY);
      const ctx = sliceCanvas.getContext('2d');
      if (ctx) ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
      const sliceImg = sliceCanvas.toDataURL('image/png');
      const sliceImgHeight = (sliceCanvas.height * imgWidth) / canvas.width;
      pdf.addImage(sliceImg, 'PNG', 24, 24, imgWidth, sliceImgHeight);
      remaining -= (pageHeight - 48);
      sourceY += sliceHeight;
      if (remaining > 0) pdf.addPage();
    }
    pdf.save(`ddct-analytics-${selectedYear}.pdf`);
  }

  const exportReport = () => {
    // Build comprehensive datasets for export
    const projectRows = projects.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description || '',
      category: p.category,
      author_id: p.author?.id || '',
      author_name: p.author?.name || '',
      author_year: p.author?.year || '',
      featured: !!p.featured,
      views: p.stats?.views ?? 0,
      likes: p.stats?.likes ?? 0,
      downloads: p.stats?.downloads ?? 0,
      created_at: p.created_at || '',
      updated_at: p.updated_at || ''
    }));

    const userRows = users.map(u => ({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      role: u.role,
      year: u.year || '',
      projects_count: projects.filter(p => p.author?.id === u.id).length,
      created_at: u.created_at || '',
      updated_at: u.updated_at || ''
    }));

    const featuredRows = projects.filter(p => p.featured).map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      views: p.stats?.views ?? 0,
      likes: p.stats?.likes ?? 0,
      author: p.author?.name || ''
    }));

    const summary = {
      totalProjects,
      totalStudents,
      featuredProjects,
      totalViews,
    };

    const categoryRows = categoryData.map(c => ({ category: c.name, count: c.count }));
    const yearRows = yearData.map(y => ({ year: y.year, count: y.count }));
    const monthlyRows = monthlyData.map(m => ({ month: m.month, projects: m.projects, views: m.views }));

    if (exportFormat === 'csv') {
      const kvToRows = (obj: Record<string, any>) => Object.entries(obj).map(([k, v]) => ({ key: k, value: v }));
      const sections = [
        '# Summary',
        toCSV(kvToRows(summary)),
        '',
        '# Category Stats',
        toCSV(categoryRows),
        '',
        '# Year Stats',
        toCSV(yearRows),
        '',
        '# Monthly Trends',
        toCSV(monthlyRows),
        '',
        '# Featured Projects',
        toCSV(featuredRows),
        '',
        '# Projects',
        toCSV(projectRows),
        '',
        '# Users',
        toCSV(userRows)
      ].join('\n');
      downloadBlob(sections, `ddct-analytics-${selectedYear}.csv`, 'text/csv;charset=utf-8');
    } else if (exportFormat === 'json') {
      const payload = {
        generated_at: new Date().toISOString(),
        year: selectedYear,
        summary,
        stats: {
          categoryData: categoryRows,
          yearData: yearRows,
          monthlyData: monthlyRows,
        },
        featured: featuredRows,
        projects: projectRows,
        users: userRows,
      };
      downloadBlob(JSON.stringify(payload, null, 2), `ddct-analytics-${selectedYear}.json`, 'application/json');
    } else if (exportFormat === 'pdf') {
      exportPDFData({
        year: selectedYear,
        summary,
        categoryRows,
        yearRows,
        monthlyRows,
        featuredRows,
        projects: projectRows,
        users: userRows,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of DDCT Showcase platform analytics and management
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowFilters((v) => !v);
              // bring analytics filters into view
              try { analyticsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
            }}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <div className="flex items-center gap-2">
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')} className="border rounded px-2 py-1 text-sm">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
            </select>
            <Button onClick={exportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{totalProjects}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <span className="text-green-500">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <span className="text-green-500">+5%</span> from last month
            </p>
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
            <p className="text-xs text-muted-foreground mt-4">
              <span className="text-blue-500">3</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <span className="text-green-500">+18%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="projects">Project Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {showFilters && (
            <div className="flex items-center justify-end gap-3">
              <label className="text-sm text-muted-foreground">Student year (owner):</label>
              <select
                value={studentYearFilter}
                onChange={(e) => setStudentYearFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
          <div ref={analyticsRef}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Projects by Category */}
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

              {/* Top Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topTags.map(t => ({ name: t.tag, count: t.count }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#60a5fa" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Project Submissions & Views</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="projects" 
                    stroke="#ff6b35" 
                    fill="#ff6b35" 
                    fillOpacity={0.6}
                    name="Projects"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#4ade80" 
                    fill="#4ade80" 
                    fillOpacity={0.4}
                    name="Views"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4"/>Total Likes</div>
                    <div className="text-2xl font-bold">{engagement.totalLikes}</div>
                    <div className="text-xs text-muted-foreground">avg {(totalProjects? (engagement.totalLikes/totalProjects):0).toFixed(1)} / project</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="text-sm text-muted-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4"/>Total Comments</div>
                    <div className="text-2xl font-bold">{engagement.totalComments}</div>
                    <div className="text-xs text-muted-foreground">discussion across projects</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><ImageIcon className="w-4 h-4"/>Images</span><span className="font-medium">{mediaCounts.image}</span></div>
                  <div className="flex items-center justify-between"><span className="flex items-center gap-2"><VideoIcon className="w-4 h-4"/>Videos</span><span className="font-medium">{mediaCounts.video}</span></div>
                  <div className="flex items-center justify-between"><span>Project Files</span><span className="font-medium">{mediaCounts.project}</span></div>
                  <div className="flex items-center justify-between"><span>Documents</span><span className="font-medium">{mediaCounts.document}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Projects by Likes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topProjectsByLikes.map(p => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="truncate max-w-[70%]">
                        <div className="font-medium truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.category}</div>
                      </div>
                      <div className="text-sm font-semibold">{p.likes}</div>
                    </div>
                  ))}
                  {topProjectsByLikes.length === 0 && (
                    <div className="text-sm text-muted-foreground">No likes yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Projects
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Manage All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex items-center gap-2 text-left hover:opacity-90 focus:outline-none p-0 m-0 bg-transparent"
                      aria-label={`View ${project.title}`}
                    >
                      <div className="w-16 h-16 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        <SupabaseImage
                          src={project.cover_image || project.thumbnail || ''}
                          alt={project.title}
                          className="w-16 h-16 object-cover"
                          fallbackSrc="/placeholder-project.svg"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold line-clamp-1 m-0 leading-tight">{project.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          by {project.author.name} • {project.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{project.author.year}</Badge>
                          {project.featured && (
                            <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                          )}
                        </div>
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm min-w-[120px]">
                        <div>{project.stats.views} views</div>
                        <div>{project.stats.downloads ?? 0} downloads</div>
                        <div className="text-muted-foreground">{project.stats.likes} likes</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(users ?? []).slice(0, 10).map((user) => {
                  const name = user?.name || user?.full_name || 'Unknown User';
                  const email = user?.email || user?.email_address || 'No email';
                  const year = user?.year || user?.student_year || 'Unknown year';
                  const role = user?.role || user?.user_role || 'Unknown role';
                  const projectCount = projects.filter(p => p.author && p.author.id === user.id).length;
                  const initial = String(name).trim()[0] || 'U';

                  return (
                  <div key={user.id || email} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {initial}
                      </div>
                      <div>
                        <h4 className="font-semibold">{name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {email} • {year} • {role}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div>{projectCount} projects</div>
                        <div className="text-muted-foreground">
                          Joined {user.joinDate || 'Sept 2024'}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                )})}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
