import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import { store } from '@/store'
import { router } from '@/router'
import AppInit from '@/AppInit'
import { ToastProvider } from '@/components/ui/toast'
import { initTheme } from '@/lib/theme'
import './index.css'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <AppInit />
        <RouterProvider router={router} />
      </ToastProvider>
    </Provider>
  </StrictMode>,
)
