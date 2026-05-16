export interface WordItem {
  id: string
  text: string
  custom?: boolean
}

export interface Template {
  id: string
  name: string
  subject: string
  style: string
  details: string[]
}

export interface LibraryData {
  subjects: WordItem[]
  styles: WordItem[]
  details: WordItem[]
  templates: Template[]
}
