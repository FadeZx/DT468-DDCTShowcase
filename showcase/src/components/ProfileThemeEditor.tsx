import { useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowUp, ArrowDown, EyeOff, Eye, Upload, Paintbrush } from 'lucide-react';

export interface ProfileTheme {
  colors: {
    background: string;
    text: string;
    accent: string;
    cardBackground: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    headingSize: number;
  };
  layout: {
    projectColumns: number;
    borderRadius: number;
  };
  images: {
    banner?: string;
    background?: string;
  };
  projectOrder: string[];
  hiddenProjects: string[];
}

interface ProfileThemeEditorProps {
  theme: ProfileTheme;
  setTheme: (t: ProfileTheme) => void;
  projects: Array<{ id: string; title: string }>;
  onReorder: (projectId: string, direction: 'up' | 'down') => void;
  onToggleHidden: (projectId: string) => void;
  onUploadBanner: (file: File) => void;
  onUploadBackground: (file: File) => void;
}

export function ProfileThemeEditor({
  theme,
  setTheme,
  projects,
  onReorder,
  onToggleHidden,
  onUploadBanner,
  onUploadBackground,
}: ProfileThemeEditorProps) {
  const fontOptions = useMemo(
    () => [
      'system-ui',
      'Inter, system-ui, sans-serif',
      'Helvetica, Arial, sans-serif',
      'Georgia, serif',
      'Courier New, monospace',
    ],
    []
  );

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Paintbrush className="w-4 h-4" /> Colors</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Background</Label>
            <input type="color" className="w-full h-10" value={theme.colors.background}
              onChange={(e) => setTheme({ ...theme, colors: { ...theme.colors, background: e.target.value } })} />
          </div>
          <div>
            <Label>Text</Label>
            <input type="color" className="w-full h-10" value={theme.colors.text}
              onChange={(e) => setTheme({ ...theme, colors: { ...theme.colors, text: e.target.value } })} />
          </div>
          <div>
            <Label>Accent</Label>
            <input type="color" className="w-full h-10" value={theme.colors.accent}
              onChange={(e) => setTheme({ ...theme, colors: { ...theme.colors, accent: e.target.value } })} />
          </div>
          <div>
            <Label>Card Background</Label>
            <input type="color" className="w-full h-10" value={theme.colors.cardBackground}
              onChange={(e) => setTheme({ ...theme, colors: { ...theme.colors, cardBackground: e.target.value } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Font Family</Label>
            <Select value={theme.typography.fontFamily}
              onValueChange={(val) => setTheme({ ...theme, typography: { ...theme.typography, fontFamily: val } })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {fontOptions.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Base Font Size ({theme.typography.fontSize}px)</Label>
            <Slider value={[theme.typography.fontSize]} min={12} max={20}
              onValueChange={(vals) => setTheme({ ...theme, typography: { ...theme.typography, fontSize: vals[0] } })} />
          </div>
          <div>
            <Label>Heading Size ({theme.typography.headingSize}px)</Label>
            <Slider value={[theme.typography.headingSize]} min={16} max={32}
              onValueChange={(vals) => setTheme({ ...theme, typography: { ...theme.typography, headingSize: vals[0] } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="w-4 h-4" /> Images</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Banner Image</Label>
            <Input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadBanner(file);
            }} />
          </div>
          <div className="space-y-2">
            <Label>Background Image</Label>
            <Input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadBackground(file);
            }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Project Columns ({theme.layout.projectColumns})</Label>
            <Slider value={[theme.layout.projectColumns]} min={1} max={5}
              onValueChange={(vals) => setTheme({ ...theme, layout: { ...theme.layout, projectColumns: vals[0] } })} />
          </div>
          <div>
            <Label>Card Border Radius ({theme.layout.borderRadius}px)</Label>
            <Slider value={[theme.layout.borderRadius]} min={0} max={24}
              onValueChange={(vals) => setTheme({ ...theme, layout: { ...theme.layout, borderRadius: vals[0] } })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {projects.map((p) => {
            const isHidden = theme.hiddenProjects.includes(p.id);
            return (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <span className="text-sm truncate">{p.title}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => onReorder(p.id, 'up')}><ArrowUp className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => onReorder(p.id, 'down')}><ArrowDown className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => onToggleHidden(p.id)}>
                    {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => {
          const defaults: ProfileTheme = {
            colors: { background: '#0b0b0b', text: '#ffffff', accent: '#7c3aed', cardBackground: '#111827' },
            typography: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, headingSize: 18 },
            layout: { projectColumns: 3, borderRadius: 8 },
            images: {},
            projectOrder: projects.map((p) => p.id),
            hiddenProjects: [],
          };
          setTheme(defaults);
        }}>Reset</Button>
      </div>
    </div>
  );
}
