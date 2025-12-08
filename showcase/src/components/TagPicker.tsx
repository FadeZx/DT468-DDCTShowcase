import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

type TagPickerProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
};

const normalizeTag = (raw: string) => raw.trim().replace(/^#+/, '');

export function TagPicker({ value, onChange, suggestions = [], placeholder = 'Type and press Enter…', maxTags = 10 }: TagPickerProps) {
  const [text, setText] = useState('');

  const normalizedSuggestions = useMemo(() => {
    const set = new Set(
      suggestions
        .map(s => normalizeTag(s).toLowerCase())
        .filter(Boolean)
    );
    value.forEach(v => set.delete(normalizeTag(v).toLowerCase()));
    return Array.from(set).sort();
  }, [suggestions, value]);

  const addTagsFromString = (raw: string) => {
    const incoming = raw
      .split(/[\n,]/)
      .map(t => normalizeTag(t))
      .filter(Boolean);
    if (!incoming.length) return;
    const current = new Set(value.map(v => normalizeTag(v).toLowerCase()));
    const next: string[] = [...value];
    for (const t of incoming) {
      if (next.length >= maxTags) break;
      const key = t.toLowerCase();
      if (!current.has(key)) {
        next.push(t);
        current.add(key);
      }
    }
    onChange(next);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (text.trim()) {
        addTagsFromString(text);
        setText('');
      }
    } else if (e.key === 'Backspace' && !text) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => {
          const displayTag = normalizeTag(tag) || tag;
          return (
            <Badge key={tag} variant="secondary" className="text-xs inline-flex items-center gap-1">
              {displayTag}
              <button
                type="button"
                className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={`Remove ${displayTag}`}
                onClick={() => onChange(value.filter(t => t !== tag))}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          );
        })}
      </div>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
      />
      {normalizedSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {normalizedSuggestions.slice(0, 12).map(s => (
            <button
              key={s}
              type="button"
              className="text-xs px-2 py-1 rounded border hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={() => addTagsFromString(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

