interface Props {
  teacherMode: boolean
  onToggleTeacher: () => void
}

export default function HeaderFormula({ teacherMode, onToggleTeacher }: Props) {
  return (
    <header className="header">
      <div className="header-top">
        <h1 className="header-title">✂️ PromptClip</h1>
        <span className="header-sub">提示词剪刀</span>
        <button
          className={`teacher-toggle ${teacherMode ? 'active' : ''}`}
          onClick={onToggleTeacher}
        >
          {teacherMode ? '👩‍🏫 老师模式：开' : '👩‍🏫 老师模式：关'}
        </button>
      </div>
      <div className="header-formula">
        <span className="formula-label">提示词</span>
        <span className="formula-eq">=</span>
        <span className="formula-part part-subject">画什么</span>
        <span className="formula-plus">+</span>
        <span className="formula-part part-style">画成什么样</span>
        <span className="formula-plus">+</span>
        <span className="formula-part part-detail">细节</span>
      </div>
    </header>
  )
}
