import { useState, useEffect, useCallback } from 'react'
import { LibraryData, WordItem, Template } from './types'
import { getDefaultLibrary } from './data/defaultLibrary'
import HeaderFormula from './components/HeaderFormula'
import WordColumn from './components/WordColumn'
import PromptPreview from './components/PromptPreview'
import TemplateBar from './components/TemplateBar'
import TeacherPanel from './components/TeacherPanel'

const STORAGE_KEY = 'promptclip-library'
const OLD_A6_DETAIL = 'A6 尺寸'
const NEW_A6_DETAIL = 'A6尺寸横版明信片'

function normalizeLibrary(library: LibraryData): LibraryData {
  return {
    ...library,
    details: library.details.map((detail) =>
      detail.text === OLD_A6_DETAIL ? { ...detail, text: NEW_A6_DETAIL } : detail
    ),
    templates: library.templates.map((template) => ({
      ...template,
      details: template.details.map((detail) =>
        detail === OLD_A6_DETAIL ? NEW_A6_DETAIL : detail
      ),
    })),
  }
}

function isLibraryData(value: unknown): value is LibraryData {
  const data = value as LibraryData
  return Boolean(
    data &&
      Array.isArray(data.subjects) &&
      Array.isArray(data.styles) &&
      Array.isArray(data.details) &&
      Array.isArray(data.templates)
  )
}

function normalizeImportLabel(value: string): string {
  return value
    .replace(/^\uFEFF/, '')
    .replace(/\s/g, '')
    .replace(/[（(].*?[）)]/g, '')
    .toLowerCase()
}

function detectCsvDelimiter(headerLine: string): string {
  const candidates = [',', '\t', ';', '，']
  return candidates.reduce((best, delimiter) => {
    const count = headerLine.split(delimiter).length
    return count > headerLine.split(best).length ? delimiter : best
  }, ',')
}

function parseCsvLine(line: string, delimiter = ','): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current.trim())
  return cells
}

function parseImportCsv(text: string): LibraryData | null {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return null

  const delimiter = detectCsvDelimiter(lines[0])
  const normalizedHeaders = parseCsvLine(lines[0], delimiter).map(normalizeImportLabel)
  const typeIndex = normalizedHeaders.findIndex((h) => ['类型', '分类', 'category', 'type'].includes(h))
  const nameIndex = normalizedHeaders.findIndex((h) => ['名称', '词条', 'text', 'name'].includes(h))
  const subjectIndex = normalizedHeaders.findIndex((h) => ['主体', 'subject'].includes(h))
  const styleIndex = normalizedHeaders.findIndex((h) => ['风格', 'style'].includes(h))
  const detailsIndex = normalizedHeaders.findIndex((h) => ['细节', 'details'].includes(h))

  if (typeIndex < 0 || nameIndex < 0) return null

  const subjects: WordItem[] = []
  const styles: WordItem[] = []
  const details: WordItem[] = []
  const templates: Template[] = []

  lines.slice(1).forEach((line, index) => {
    const cells = parseCsvLine(line, delimiter)
    const type = normalizeImportLabel(cells[typeIndex] || '')
    const name = cells[nameIndex]?.trim()
    if (!type || !name || type.startsWith('#')) return

    if (['主体', 'subjects', 'subject'].includes(type)) {
      subjects.push({ id: `import-subject-${index}`, text: name, custom: true })
    } else if (['风格', 'styles', 'style'].includes(type)) {
      styles.push({ id: `import-style-${index}`, text: name, custom: true })
    } else if (['细节', 'details', 'detail'].includes(type)) {
      details.push({ id: `import-detail-${index}`, text: name, custom: true })
    } else if (['模板', 'templates', 'template'].includes(type)) {
      const subject = cells[subjectIndex]?.trim()
      const style = cells[styleIndex]?.trim()
      const detailText = cells[detailsIndex]?.trim()
      if (subject && style) {
        templates.push({
          id: `import-template-${index}`,
          name,
          subject,
          style,
          details: detailText ? detailText.split(/[、;；]/).map((d) => d.trim()).filter(Boolean) : [],
        })
      }
    }
  })

  if (subjects.length === 0 && styles.length === 0 && details.length === 0) return null

  return normalizeLibrary({
    subjects,
    styles,
    details,
    templates: templates.length > 0 ? templates : getDefaultLibrary().templates,
  })
}

function loadLibrary(): LibraryData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        isLibraryData(parsed)
      ) {
        return normalizeLibrary(parsed)
      }
    }
  } catch {
    // ignore
  }
  return normalizeLibrary(getDefaultLibrary())
}

function buildPromptText(
  subject: string | null,
  style: string | null,
  details: string[],
  library: LibraryData
): string {
  const parts: string[] = []

  if (subject) {
    const found = library.subjects.find((s) => s.id === subject)
    if (found) parts.push(`请画${found.text}`)
  }

  if (style) {
    const found = library.styles.find((s) => s.id === style)
    if (found) {
      parts.push(`使用${found.text}风格`)
    }
  }

  if (details.length > 0) {
    const detailTexts = details
      .map((id) => library.details.find((d) => d.id === id)?.text)
      .filter(Boolean)
    if (detailTexts.length > 0) {
      parts.push(`画面中加入${detailTexts.join('、')}`)
    }
  }

  return parts.join('，')
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function App() {
  const [library, setLibrary] = useState<LibraryData>(loadLibrary)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedDetails, setSelectedDetails] = useState<string[]>([])
  const [teacherMode, setTeacherMode] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
  }, [library])

  const handleSelectSubject = useCallback((id: string) => {
    setSelectedSubject((prev) => (prev === id ? null : id))
  }, [])

  const handleSelectStyle = useCallback((id: string) => {
    setSelectedStyle((prev) => (prev === id ? null : id))
  }, [])

  const handleToggleDetail = useCallback((id: string) => {
    setSelectedDetails((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }, [])

  const handleClearAll = useCallback(() => {
    setSelectedSubject(null)
    setSelectedStyle(null)
    setSelectedDetails([])
  }, [])

  const handleRandomPick = useCallback(() => {
    setSelectedSubject(randomPick(library.subjects).id)
    setSelectedStyle(randomPick(library.styles).id)
    const count = 2 + Math.floor(Math.random() * 3)
    const shuffled = [...library.details].sort(() => 0.5 - Math.random())
    setSelectedDetails(shuffled.slice(0, count).map((d) => d.id))
  }, [library])

  const handleApplyTemplate = useCallback(
    (tpl: Template) => {
      const sub = library.subjects.find((s) => s.text === tpl.subject)
      const sty = library.styles.find((s) => s.text === tpl.style)
      const detIds = tpl.details
        .map((dText) => library.details.find((d) => d.text === dText))
        .filter(Boolean)
        .map((d) => d!.id)

      if (sub) setSelectedSubject(sub.id)
      if (sty) setSelectedStyle(sty.id)
      setSelectedDetails(detIds)
    },
    [library]
  )

  const handleAddWord = useCallback(
    (category: 'subjects' | 'styles' | 'details', text: string) => {
      setLibrary((prev) => {
        const existing = prev[category].find(
          (w) => w.text === text
        )
        if (existing) return prev

        const newItem: WordItem = {
          id: `custom-${category}-${Date.now()}`,
          text,
          custom: true,
        }
        return { ...prev, [category]: [...prev[category], newItem] }
      })
    },
    []
  )

  const handleDeleteWord = useCallback(
    (category: 'subjects' | 'styles' | 'details', id: string) => {
      setLibrary((prev) => ({
        ...prev,
        [category]: prev[category].filter((w) => w.id !== id),
      }))
    },
    []
  )

  const handleResetLibrary = useCallback(() => {
    setLibrary(getDefaultLibrary())
    handleClearAll()
  }, [handleClearAll])

  const handleExport = useCallback(() => {
    return JSON.stringify(library, null, 2)
  }, [library])

  const handleImport = useCallback((libraryText: string): boolean => {
    try {
      const embeddedData = libraryText.match(
        /<script[^>]*id=["']promptclip-library-data["'][^>]*>([\s\S]*?)<\/script>/i
      )?.[1]
      const parsed = JSON.parse(embeddedData || libraryText)
      if (isLibraryData(parsed)) {
        setLibrary(normalizeLibrary(parsed))
        return true
      }
    } catch {
      const parsedCsv = parseImportCsv(libraryText)
      if (parsedCsv) {
        setLibrary(parsedCsv)
        return true
      }
    }
    return false
  }, [])

  useEffect(() => {
    function onClearAll() {
      handleClearAll()
    }
    function onRandomPick() {
      handleRandomPick()
    }
    window.addEventListener('clearAll', onClearAll)
    window.addEventListener('randomPick', onRandomPick)
    return () => {
      window.removeEventListener('clearAll', onClearAll)
      window.removeEventListener('randomPick', onRandomPick)
    }
  }, [handleClearAll, handleRandomPick])

  const prompt = buildPromptText(selectedSubject, selectedStyle, selectedDetails, library)

  return (
    <div className="app">
      <HeaderFormula
        teacherMode={teacherMode}
        onToggleTeacher={() => setTeacherMode((p) => !p)}
      />

      <TemplateBar
        templates={library.templates}
        onApply={handleApplyTemplate}
      />

      <main className="main-columns">
        <WordColumn
          title="① 主体"
          subtitle="画什么（选 1 个）"
          colorClass="subject"
          items={library.subjects}
          selected={selectedSubject}
          multi={false}
          onSelect={handleSelectSubject}
          teacherMode={teacherMode}
          onDeleteWord={(id) => handleDeleteWord('subjects', id)}
        />
        <WordColumn
          title="② 风格"
          subtitle="画成什么样（选 1 个）"
          colorClass="style"
          items={library.styles}
          selected={selectedStyle}
          multi={false}
          onSelect={handleSelectStyle}
          teacherMode={teacherMode}
          onDeleteWord={(id) => handleDeleteWord('styles', id)}
        />
        <WordColumn
          title="③ 细节"
          subtitle="还有什么（可多选）"
          colorClass="detail"
          items={library.details}
          selected={selectedDetails}
          multi={true}
          onSelect={handleToggleDetail}
          teacherMode={teacherMode}
          onDeleteWord={(id) => handleDeleteWord('details', id)}
        />
      </main>

      <PromptPreview
        prompt={prompt}
        subject={selectedSubject}
        style={selectedStyle}
        details={selectedDetails}
      />

      {teacherMode && (
        <TeacherPanel
          library={library}
          onAddWord={handleAddWord}
          onResetLibrary={handleResetLibrary}
          onExport={handleExport}
          onImport={handleImport}
        />
      )}
    </div>
  )
}
