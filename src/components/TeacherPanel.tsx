import { useState, useRef } from 'react'
import { LibraryData } from '../types'

interface Props {
  library: LibraryData
  onAddWord: (category: 'subjects' | 'styles' | 'details', text: string) => void
  onResetLibrary: () => void
  onExport: () => string
  onImport: (libraryText: string) => boolean
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
  const [batchMsg, setBatchMsg] = useState('')
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

  function showBatchMsg(message: string) {
    setBatchMsg(message)
    setTimeout(() => setBatchMsg(''), 3500)
  }

  function handleBatchExport() {
    const libraryText = onExport()
    const blob = new Blob([libraryText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'PromptClip-批量词库.promptclip'
    a.click()
    URL.revokeObjectURL(url)
    showBatchMsg('✅ 已批量导出词库。可以把这个文件发给其他老师使用。')
  }

  function handleBatchImport() {
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
        showBatchMsg('✅ 批量导入成功！词库已经更新。')
      } else {
        showBatchMsg('❌ 这个文件不能导入词库，请选择从本工具批量导出的词库文件。')
      }
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
        <div className="backup-card">
          <div>
            <div className="backup-title">批量导出词库</div>
            <div className="backup-desc">把当前所有主体、风格、细节词条打包成一个文件，方便发给其他老师。</div>
          </div>
          <button className="btn btn-export" onClick={handleBatchExport}>
            批量导出
          </button>
        </div>

        <div className="backup-card">
          <div>
            <div className="backup-title">批量导入词库</div>
            <div className="backup-desc">选择其他老师发来的词库文件，一次性更新主体、风格和细节词条。</div>
          </div>
          <button className="btn btn-import" onClick={handleBatchImport}>
            批量导入
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".promptclip,.json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="backup-card reset-card">
          <div>
            <div className="backup-title">回到初始词库</div>
            <div className="backup-desc">清空自己添加和恢复的内容，回到系统预设词条。</div>
          </div>
          <button className="btn btn-reset" onClick={onResetLibrary}>
            恢复默认
          </button>
        </div>
      </div>

      {batchMsg && <div className="import-msg">{batchMsg}</div>}
    </section>
  )
}
