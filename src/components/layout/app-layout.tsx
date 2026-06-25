import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { WebGLBackground } from '@/components/webgl-background'

export function AppLayout() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <WebGLBackground />
      <div className="relative z-10 flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
