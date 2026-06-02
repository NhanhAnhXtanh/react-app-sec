import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthBootstrap } from '@/features/auth/AuthBootstrap';
import { App } from './App';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ThemeProvider>
      <TooltipProvider delayDuration={200}>
        <QueryClientProvider client={queryClient}>
          <AuthBootstrap>
            <App />
          </AuthBootstrap>
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
