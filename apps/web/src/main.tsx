import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import './index.css';

// routeTreeは自動生成される
import { routeTree } from './routeTree.gen';

// ルーターを作成
const router = createRouter({ routeTree });

// TypeScript用の型定義
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// QueryClientを作成
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  </StrictMode>,
);
