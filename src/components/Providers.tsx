"use client";

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Создаем QueryClient один раз при инициализации компонента
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Опционально: время, после которого данные считаются "старыми"
        staleTime: 60 * 1000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        autoHideDuration={3000}
      >
        {children}
      </SnackbarProvider>
    </QueryClientProvider>
  );
}