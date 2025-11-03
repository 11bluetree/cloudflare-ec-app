import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
