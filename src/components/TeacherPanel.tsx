import { useState, useRef } from 'react'
import { LibraryData } from '../types'

interface Props {
  library: LibraryData
  onAddWord: (category: 'subjects' | 'styles' | 'details', text: string) => void
  onResetLibrary: () => void
  onExport: () => string
  onImport: (json: string) => boolean
}

const categoryLabels: Record<string, string> = {
  subjects: '主体（画什么）',
  styles: '风格（画成什么样）',
  details: '细节（还有什么）',
}

export default function TeacherPanel({
  library,
  onAddWord,
  onResetLibrary,
  onExport,
  onImport,
}: Props) {
  const [addCategory, setAddCategory] = useState<'subjects' | 'styles' | 'details'>('subjects')
  const [newWord, setNewWord] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleAdd() {
    const trimmed = newWord.trim()
    if (!trimmed) return
    onAddWord(addCategory, trimmed)
    setNewWord('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAdd()
  }

  function handleExport() {
    const json = onExport()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'promptclip-词库.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport() {
    fileRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const ok = onImport(text)
      if (ok) {
        setImportMsg('✅ 导入成功！')
      } else {
        setImportMsg('❌ 文件格式不正确，请检查')
      }
      setTimeout(() => setImportMsg(''), 3000)
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  const customWords = {
    subjects: library.subjects.filter((w) => w.custom),
    styles: library.styles.filter((w) => w.custom),
    details: library.details.filter((w) => w.custom),
  }

  return (
    <section className="teacher-panel">
      <h3 className="teacher-panel-title">👩‍🏫 老师管理面板</h3>

      <div className="teacher-row">
        <div className="teacher-add">
          <label className="teacher-label">新增词条</label>
          <div className="add-row">
            <select
              className="add-select"
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value as typeof addCategory)}
            >
              <option value="subjects">{categoryLabels.subjects}</option>
              <option value="styles">{categoryLabels.styles}</option>
              <option value="details">{categoryLabels.details}</option>
            </select>
            <input
              className="add-input"
              type="text"
              placeholder="输入新词条..."
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn btn-add" onClick={handleAdd}>
              添加
            </button>
          </div>
        </div>
      </div>

      <div className="teacher-row teacher-summary">
        <span>自定义词条：</span>
        {(['subjects', 'styles', 'details'] as const).map((cat) => {
          const arr = customWords[cat]
          if (arr.length === 0) return null
          return (
            <span key={cat} className="custom-badge">
              {categoryLabels[cat]}：{arr.length} 个
            </span>
          )
        })}
        {Object.values(customWords).every((a) => a.length === 0) && (
          <span className="no-custom">暂无自定义词条</span>
        )}
      </div>

      <div className="teacher-row teacher-actions">
        <button className="btn btn-export" onClick={handleExport}>
          📤 导出词库 JSON
        </button>
        <button className="btn btn-import" onClick={handleImport}>
          📥 导入词库 JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button className="btn btn-reset" onClick={onResetLibrary}>
          🔄 恢复默认词库
        </button>
      </div>

      {importMsg && <div className="import-msg">{importMsg}</div>}
    </section>
  )
}
