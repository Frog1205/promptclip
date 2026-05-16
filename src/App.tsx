import { useState, useEffect, useCallback } from 'react'
import { LibraryData, WordItem, Template } from './types'
import { getDefaultLibrary } from './data/defaultLibrary'
import HeaderFormula from './components/HeaderFormula'
import WordColumn from './components/WordColumn'
import PromptPreview from './components/PromptPreview'
import TemplateBar from './components/TemplateBar'
import TeacherPanel from './components/TeacherPanel'

const STORAGE_KEY = 'promptclip-library'

function loadLibrary(): LibraryData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        parsed &&
        Array.isArray(parsed.subjects) &&
        Array.isArray(parsed.styles) &&
        Array.isArray(parsed.details) &&
        Array.isArray(parsed.templates)
      ) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return getDefaultLibrary()
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

  if (parts.length > 0) {
    parts.push('整体温暖明亮，适合低龄儿童 AI 创作。')
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

  const handleImport = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json)
      if (
        parsed &&
        Array.isArray(parsed.subjects) &&
        Array.isArray(parsed.styles) &&
        Array.isArray(parsed.details) &&
        Array.isArray(parsed.templates)
      ) {
        setLibrary(parsed)
        return true
      }
    } catch {
      // invalid
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
