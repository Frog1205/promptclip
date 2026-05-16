import { useRef, useEffect, useState } from 'react'

interface Props {
  prompt: string
  subject: string | null
  style: string | null
  details: string[]
}

export default function PromptPreview({ prompt, subject, style, details }: Props) {
  const [copied, setCopied] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [editablePrompt, setEditablePrompt] = useState(prompt)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    setEditablePrompt(prompt)
  }, [prompt])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function handleCopy() {
    if (!editablePrompt.trim()) return
    navigator.clipboard.writeText(editablePrompt).then(() => {
      setCopied(true)
      setAnimating(true)
      timerRef.current = setTimeout(() => {
        setCopied(false)
        setAnimating(false)
      }, 2500)
    })
  }

  const hasSelection = subject || style || details.length > 0
  const isEmpty = !hasSelection
  const copyDisabled = isEmpty || !editablePrompt.trim()

  return (
    <div className={`prompt-preview ${copied ? 'copied' : ''}`}>
      <div className="preview-label">你的提示词</div>

      <div className="preview-box">
        {isEmpty ? (
          <p className="preview-empty">点击上方卡片来拼装你的提示词吧 ✂️</p>
        ) : (
          <textarea
            className="preview-textarea"
            value={editablePrompt}
            onChange={(event) => setEditablePrompt(event.target.value)}
            aria-label="编辑生成的提示词"
          />
        )}
      </div>

      <div className="preview-actions">
        <button
          className="btn btn-copy"
          onClick={handleCopy}
          disabled={copyDisabled}
        >
          📋 复制给 AI
        </button>
        <button
          className={`btn btn-clear`}
          onClick={() => {
            window.dispatchEvent(new CustomEvent('clearAll'))
          }}
          disabled={isEmpty}
        >
          🗑️ 清空选择
        </button>
        <button
          className="btn btn-random"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('randomPick'))
          }}
        >
          🎲 换一组灵感
        </button>
      </div>

      {copied && (
        <div className={`copy-toast ${animating ? 'show' : ''}`}>
          ✅ 已复制，可以粘贴给 AI 了！
        </div>
      )}
    </div>
  )
}
