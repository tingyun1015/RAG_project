import { Routes, Route, Link, useLocation } from 'react-router-dom'
import PresetQueries from './PresetQueries.tsx'
import RAGPlayground from './RAGPlayground.tsx'
import DefaultQueries from './DefaultQueries.tsx'

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center w-dvw">
      <div className="w-full max-w-5xl space-y-3">
        <p className="text-sm text-gray-600 font-medium">
          Dataset Reference: [<a href="https://github.com/OpenBMB/RAGEval" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">RAGEval</a>]
        </p>
        <header className="text-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Q&A Assistant Demo
            </h1>
          </div>
          <nav className="flex items-center justify-center gap-8 mt-4 text-md font-medium">
            <Link
              to="/"
              className={`w-50 px-4 py-3 transition-all border-b-2 -mb-[2px] ${location.pathname === '/' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
            >
              Use Default Queries
            </Link>
            <Link
              to="/playground"
              className={`w-50 px-4 py-3 transition-all border-b-2 -mb-[2px] ${location.pathname === '/playground' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
            >
              Write Your Own Query
            </Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={
              <div className="p-6">
                <DefaultQueries props={{ language: 'en' }} />
              </div>
            } />
            <Route path="/playground" element={
              <div className="p-6">
                <RAGPlayground />
              </div>
            } />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
