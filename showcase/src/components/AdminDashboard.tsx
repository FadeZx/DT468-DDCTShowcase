import { useState, useRef } from 'react';
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
  Calendar, Filter, FileText, Settings 
} from 'lucide-react';

interface AdminDashboardProps {
  projects: any[];
  users: any[];
}

export function AdminDashboard({ projects, users }: AdminDashboardProps) {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const analyticsRef = useRef<HTMLDivElement>(null);

  // Calculate statistics
  const totalProjects = projects.length;
  const totalStudents = users.filter(u => u.role === 'student').length;
  const featuredProjects = projects.filter(p => p.featured).length;
  const totalViews = projects.reduce((sum, p) => sum + (p.stats?.views || 0), 0);

  // Projects by category data
  const categoryData = [
    { name: 'Games', count: projects.filter(p => p.category === 'Games').length, color: '#ff6b35' },
    { name: 'Animations', count: projects.filter(p => p.category === 'Animations').length, color: '#4ade80' },
    { name: 'Digital Art', count: projects.filter(p => p.category === 'Digital Art').length, color: '#60a5fa' },
    { name: 'Simulations', count: projects.filter(p => p.category === 'Simulations').length, color: '#f59e0b' },
    { name: 'Others', count: projects.filter(p => p.category === 'Others').length, color: '#ec4899' }
  ];

  // Projects by student year
  const yearData = [
    { year: '68', count: projects.filter(p => p.author.year === '68').length },
    { year: '67', count: projects.filter(p => p.author.year === '67').length },
    { year: '66', count: projects.filter(p => p.author.year === '66').length },
    { year: '65', count: projects.filter(p => p.author.year === '65').length }
  ];

  // Monthly project submissions (mock data)
  const monthlyData = [
    { month: 'Jan', projects: 12, views: 1200 },
    { month: 'Feb', projects: 15, views: 1500 },
    { month: 'Mar', projects: 18, views: 2100 },
    { month: 'Apr', projects: 22, views: 2800 },
    { month: 'May', projects: 25, views: 3200 },
    { month: 'Jun', projects: 20, views: 2900 },
    { month: 'Jul', projects: 16, views: 2200 },
    { month: 'Aug', projects: 19, views: 2600 },
    { month: 'Sep', projects: 28, views: 3800 },
    { month: 'Oct', projects: 32, views: 4200 },
    { month: 'Nov', projects: 24, views: 3500 },
    { month: 'Dec', projects: 18, views: 2800 }
  ];

  const recentProjects = projects.slice(0, 10);

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
          <Button variant="outline">
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="projects">Project Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
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

              {/* Projects by Student Year */}
              <Card>
                <CardHeader>
                  <CardTitle>Projects by Student Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={yearData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ff6b35" />
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
                    <div className="flex items-center gap-4">
                      <img 
                        src="/placeholder-project.svg" 
                        alt={project.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">{project.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          by {project.author.name} • {project.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{project.author.year}</Badge>
                          {project.featured && (
                            <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div>{project.stats.views} views</div>
                        <div className="text-muted-foreground">{project.stats.likes} likes</div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
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
                {users.slice(0, 10).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {user.name[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold">{user.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.email} • {user.year} • {user.role}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div>{projects.filter(p => p.author.id === user.id).length} projects</div>
                        <div className="text-muted-foreground">
                          Joined {user.joinDate || 'Sept 2024'}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Project Management</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Auto-approve student projects</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Featured project criteria</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">User Management</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Student registration approval</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Teacher role permissions</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Export & Reports</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Automated monthly reports</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Student resume templates</span>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}