import { WordItem } from '../types'

interface Props {
  title: string
  subtitle: string
  colorClass: string
  items: WordItem[]
  selected: string | string[] | null
  multi: boolean
  onSelect: (id: string) => void
  teacherMode: boolean
  onDeleteWord?: (id: string) => void
}

export default function WordColumn({
  title,
  subtitle,
  colorClass,
  items,
  selected,
  multi,
  onSelect,
  teacherMode,
  onDeleteWord,
}: Props) {
  function isActive(id: string) {
    if (multi) {
      return (selected as string[]).includes(id)
    }
    return selected === id
  }

  return (
    <div className={`word-column column-${colorClass}`}>
      <div className="column-header">
        <h2 className="column-title">{title}</h2>
        <p className="column-subtitle">{subtitle}</p>
      </div>
      <div className="card-grid">
        {items.map((item) => (
          <button
            key={item.id}
            className={`word-card ${isActive(item.id) ? 'active' : ''} ${item.custom ? 'custom' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="card-text">{item.text}</span>
            {teacherMode && item.custom && onDeleteWord && (
              <span
                className="card-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteWord(item.id)
                }}
                title="删除"
              >
                ×
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
