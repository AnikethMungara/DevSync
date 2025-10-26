import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Editor from './components/Editor'

const API = import.meta.env.VITE_API || 'http://localhost:8000'

export default function App() {
  const [files, setFiles] = useState([])
  const [path, setPath] = useState('main.py')
  const [content, setContent] = useState('# DevSync\nprint(\"hello\")')

  useEffect(() => {
    axios.get(`${API}/files`).then(r => setFiles(r.data.files)).catch(() => setFiles([]))
  }, [])

  const save = async () => {
    await axios.post(`${API}/file`, { path, content })
  }

  const commit = async () => {
    await save()
    await axios.post(`${API}/git/commit`, null, { params: { message: 'save from frontend' } })
    const d = await axios.get(`${API}/git/diff`)
    alert('Committed. Latest diff:\n' + d.data.diff)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', height: '100vh' }}>
      <aside style={{ borderRight: '1px solid #ddd', padding: 12 }}>
        <h3>DevSync</h3>
        <button onClick={commit}>Commit + Diff</button>
        <h4>Files</h4>
        <ul>
          {files.map(f => <li key={f} onClick={() => setPath(f)} style={{ cursor:'pointer' }}>{f}</li>)}
        </ul>
      </aside>
      <main>
        <Editor value={content} onChange={setContent} />
      </main>
    </div>
  )
}
