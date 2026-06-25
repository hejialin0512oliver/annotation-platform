import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import DashboardPage from '@/pages/dashboard'
import DatasetsPage from '@/pages/datasets'
import AnnotatePage from '@/pages/annotate'
import PromptTemplatesPage from '@/pages/templates/prompts'
import AnnotationTemplatesPage from '@/pages/templates/annotation'
import LLMSettingsPage from '@/pages/settings/llm'

const basename = import.meta.env.BASE_URL

function RedirectHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirect-path')
    if (redirectPath) {
      sessionStorage.removeItem('redirect-path')
      navigate(redirectPath, { replace: true })
    }
  }, [navigate])

  return null
}

function App() {
  return (
    <BrowserRouter basename={basename}>
      <RedirectHandler />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/datasets" element={<DatasetsPage />} />
          <Route path="/annotate/:datasetId" element={<AnnotatePage />} />
          <Route path="/templates/prompts" element={<PromptTemplatesPage />} />
          <Route path="/templates/annotation" element={<AnnotationTemplatesPage />} />
          <Route path="/settings/llm" element={<LLMSettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
