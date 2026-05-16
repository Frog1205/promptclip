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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function downloadFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

function createImportTemplate(): string {
  const rows = [
    ['类型', '名称', '主体', '风格', '细节'],
    ['主体', '藏族小朋友', '', '', ''],
    ['主体', '雪豹', '', '', ''],
    ['主体', '扎溪卡草原', '', '', ''],
    ['风格', '水彩', '', '', ''],
    ['风格', '可爱卡通', '', '', ''],
    ['细节', 'A6尺寸横版明信片', '', '', ''],
    ['细节', '五色经幡', '', '', ''],
    ['细节', '藏八宝纹样', '', '', ''],
    ['细节', '温暖明亮', '', '', ''],
    ['模板', '石渠文创明信片', '扎溪卡草原', '水彩', '藏八宝纹样、A6尺寸横版明信片、温暖明亮'],
  ]

  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\n')}`
}

function createLibraryHtml(library: LibraryData, libraryText: string): string {
  const createdAt = new Date().toLocaleString('zh-CN')
  const embeddedData = libraryText.replace(/</g, '\\u003c')
  const renderWords = (items: { text: string }[]) =>
    items.map((item) => `<span class="pill">${escapeHtml(item.text)}</span>`).join('')
  const renderTemplates = () =>
    library.templates
      .map(
        (template) => `
          <tr>
            <td>${escapeHtml(template.name)}</td>
            <td>${escapeHtml(template.subject)}</td>
            <td>${escapeHtml(template.style)}</td>
            <td>${escapeHtml(template.details.join('、'))}</td>
          </tr>`
      )
      .join('')

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PromptClip 批量词库</title>
  <style>
    body { margin: 0; background: #f7f1e8; color: #2f2418; font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; }
    .page { max-width: 980px; margin: 0 auto; padding: 36px 24px 48px; }
    .hero { background: #fffaf0; border: 3px solid #d4a017; border-radius: 18px; padding: 28px; box-shadow: 0 14px 36px rgba(111, 74, 28, 0.12); }
    h1 { margin: 0 0 10px; font-size: 32px; }
    .meta { color: #7a6248; line-height: 1.7; }
    .section { margin-top: 22px; background: #fff; border: 2px solid #ead9bd; border-radius: 14px; padding: 22px; }
    h2 { margin: 0 0 14px; color: #8b1a1a; font-size: 20px; }
    .pills { display: flex; flex-wrap: wrap; gap: 10px; }
    .pill { display: inline-flex; border: 2px solid #e3c57b; border-radius: 999px; padding: 8px 14px; background: #fff8e8; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 10px; }
    th, td { border-bottom: 1px solid #ead9bd; padding: 12px; text-align: left; vertical-align: top; }
    th { background: #f7ead1; color: #5b3511; }
    .note { margin-top: 18px; padding: 14px 16px; background: #f1f8ed; border: 2px solid #b6d7a8; border-radius: 12px; color: #355c20; font-weight: 700; }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <h1>PromptClip 批量词库</h1>
      <div class="meta">导出时间：${escapeHtml(createdAt)}<br />这个文件可以直接打开查看，也可以在 PromptClip 老师模式里“批量导入”。</div>
    </section>
    <section class="section"><h2>主体（画什么）</h2><div class="pills">${renderWords(library.subjects)}</div></section>
    <section class="section"><h2>风格（画成什么样）</h2><div class="pills">${renderWords(library.styles)}</div></section>
    <section class="section"><h2>细节（还有什么）</h2><div class="pills">${renderWords(library.details)}</div></section>
    <section class="section">
      <h2>组合模板</h2>
      <table><thead><tr><th>模板名称</th><th>主体</th><th>风格</th><th>细节</th></tr></thead><tbody>${renderTemplates()}</tbody></table>
    </section>
    <div class="note">提示：不要删除本文件底部隐藏数据，否则可能无法再批量导入。</div>
  </main>
  <script id="promptclip-library-data" type="application/json">${embeddedData}</script>
</body>
</html>`
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
    const html = createLibraryHtml(library, libraryText)
    downloadFile('PromptClip-批量词库.html', html, 'text/html;charset=utf-8')
    showBatchMsg('✅ 已批量导出词库。双击文件可以打开查看，也可以发给其他老师导入。')
  }

  function handleBatchImport() {
    fileRef.current?.click()
  }

  function handleDownloadTemplate() {
    downloadFile('PromptClip-批量导入模板.csv', createImportTemplate(), 'text/csv;charset=utf-8')
    showBatchMsg('✅ 已下载导入模板。用 Excel 或 WPS 填好后，再点“批量导入”。')
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
            <div className="backup-desc">导出成美观网页文件，双击能打开查看，也能发给其他老师导入。</div>
          </div>
          <button className="btn btn-export" onClick={handleBatchExport}>
            批量导出
          </button>
        </div>

        <div className="backup-card">
          <div>
            <div className="backup-title">批量导入词库</div>
            <div className="backup-desc">支持导入批量词库网页文件，也支持导入按模板填写的表格文件。</div>
          </div>
          <button className="btn btn-import" onClick={handleBatchImport}>
            批量导入
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".html,.csv,.promptclip,.json,text/html,text/csv,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="backup-card template-card">
          <div>
            <div className="backup-title">下载导入模板</div>
            <div className="backup-desc">先下载表格模板，按“类型、名称、主体、风格、细节”填写后再批量导入。</div>
          </div>
          <button className="btn btn-template" onClick={handleDownloadTemplate}>
            下载模板
          </button>
        </div>

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
