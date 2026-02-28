import { Routes, Route } from 'react-router-dom'
import RAGPlayground from './RAGPlayground.tsx'
import DefaultQueries from './DefaultQueries.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DefaultQueries props={{ language: 'en' }} />} />
      <Route path="/playground" element={<RAGPlayground />} />
    </Routes>
  )
}

export default App
