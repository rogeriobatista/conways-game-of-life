import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import 'sonner/dist/styles.css'
import './index.css'
import App from './App.tsx'
import { AppShellProvider } from './app/AppShellContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { queryClient } from './query/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppShellProvider>
          <App />
        </AppShellProvider>
        <Toaster
          theme="dark"
          position="bottom-center"
          richColors
          closeButton
          expand={false}
          gap={10}
          toastOptions={{
            classNames: {
              toast: 'app-toast',
            },
          }}
        />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
