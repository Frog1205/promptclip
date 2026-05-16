import { useState, useRef } from 'react'
import { LibraryData } from '../types'

interface Props {
  library: LibraryData
  onAddWord: (category: 'subjects' | 'styles' | 'details', text: string) => void
  onResetLibrary: () => void
  onExport: () => string
  onImport: (backupText: string) => boolean
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
  const [backupMsg, setBackupMsg] = useState('')
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

  function showBackupMsg(message: string) {
    setBackupMsg(message)
    setTimeout(() => setBackupMsg(''), 3500)
  }

  function handleSaveBackup() {
    const backupText = onExport()
    const blob = new Blob([backupText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'PromptClip-词库备份.promptclip'
    a.click()
    URL.revokeObjectURL(url)
    showBackupMsg('✅ 已保存词库备份。下次换电脑或换浏览器时，可以用它恢复。')
  }

  function handleRestoreBackup() {
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
        showBackupMsg('✅ 恢复成功！词库已经换成备份里的内容。')
      } else {
        showBackupMsg('❌ 这个文件不能恢复词库，请选择之前保存的词库备份。')
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
            <div className="backup-title">保存我的词库</div>
            <div className="backup-desc">把当前词条保存成一个备份文件，方便发给同事或换电脑使用。</div>
          </div>
          <button className="btn btn-export" onClick={handleSaveBackup}>
            保存备份
          </button>
        </div>

        <div className="backup-card">
          <div>
            <div className="backup-title">恢复别人给我的词库</div>
            <div className="backup-desc">选择之前保存的词库备份文件，恢复后会替换当前词库。</div>
          </div>
          <button className="btn btn-import" onClick={handleRestoreBackup}>
            选择备份文件
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

      {backupMsg && <div className="import-msg">{backupMsg}</div>}
    </section>
  )
}
