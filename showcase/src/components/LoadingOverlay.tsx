import React from 'react';
import { createPortal } from 'react-dom';

type Props = {
  show: boolean;
  message?: string;
};

export function LoadingOverlay({ show, message = 'Loading…' }: Props) {
  if (!show) return null;
  return createPortal(
    <div className="fixed inset-0 z-[2147483000] bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>,
    document.body
  );
}

