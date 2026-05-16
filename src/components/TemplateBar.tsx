import { Template } from '../types'

interface Props {
  templates: Template[]
  onApply: (tpl: Template) => void
}

export default function TemplateBar({ templates, onApply }: Props) {
  return (
    <section className="template-bar">
      <h3 className="template-title">📚 课堂模板</h3>
      <div className="template-list">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            className="template-btn"
            onClick={() => onApply(tpl)}
          >
            {tpl.name}
          </button>
        ))}
      </div>
    </section>
  )
}
