export interface LLMConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'azure' | 'custom'
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  createdAt: number
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  systemPrompt: string
  userPrompt: string
  createdAt: number
  updatedAt: number
}

export type AnnotationFieldType = 'text' | 'select' | 'multiselect' | 'number' | 'boolean' | 'textarea'

export interface AnnotationField {
  id: string
  name: string
  label: string
  type: AnnotationFieldType
  options?: string[]
  required: boolean
  description?: string
}

export interface AnnotationTemplate {
  id: string
  name: string
  description: string
  fields: AnnotationField[]
  promptTemplateId?: string
  createdAt: number
  updatedAt: number
}

export interface Dataset {
  id: string
  name: string
  fileName: string
  headers: string[]
  rows: Record<string, string>[]
  rowCount: number
  annotationTemplateId?: string
  createdAt: number
}

export interface AnnotationRecord {
  id: string
  datasetId: string
  rowIndex: number
  annotations: Record<string, string | string[] | number | boolean>
  llmSummary?: string
  annotatedBy: string
  annotatedAt: number
  updatedAt: number
}

export interface AppState {
  llmConfigs: LLMConfig[]
  activeLlmConfigId: string | null
  promptTemplates: PromptTemplate[]
  annotationTemplates: AnnotationTemplate[]
  datasets: Dataset[]
  annotationRecords: AnnotationRecord[]
  currentAnnotator: string
}
