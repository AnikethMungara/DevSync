// === FRONTEND FILE ===
// SAFE TO EDIT
// Purpose: Monaco Editor integration component with Python language support.

import React, { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'

export default function Editor({ value, onChange }) {
  const ref = useRef(null)
  const editorRef = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    editorRef.current = monaco.editor.create(ref.current, {
      value,
      language: 'python',
      automaticLayout: true,
      minimap: { enabled: false },
    })
    editorRef.current.onDidChangeModelContent(() => {
      const v = editorRef.current.getValue()
      onChange(v)
    })
    return () => editorRef.current && editorRef.current.dispose()
  }, [])

  return <div ref={ref} style={{ height: '100%', width: '100%' }} />
}
