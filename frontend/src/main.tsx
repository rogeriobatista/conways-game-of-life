import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import 'sonner/dist/styles.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <App />
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
    </>
  </StrictMode>,
)
