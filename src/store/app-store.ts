import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  LLMConfig,
  PromptTemplate,
  AnnotationTemplate,
  Dataset,
  AnnotationRecord,
  AppState,
} from '@/types'

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 9)

export interface AppStore extends AppState {
  setLLMConfigs: (configs: LLMConfig[]) => void
  addLLMConfig: (config: Omit<LLMConfig, 'id' | 'createdAt'>) => void
  updateLLMConfig: (id: string, config: Partial<LLMConfig>) => void
  deleteLLMConfig: (id: string) => void
  setActiveLLMConfig: (id: string | null) => void

  addPromptTemplate: (
    template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => void
  updatePromptTemplate: (
    id: string,
    template: Partial<PromptTemplate>
  ) => void
  deletePromptTemplate: (id: string) => void

  addAnnotationTemplate: (
    template: Omit<AnnotationTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => void
  updateAnnotationTemplate: (
    id: string,
    template: Partial<AnnotationTemplate>
  ) => void
  deleteAnnotationTemplate: (id: string) => void

  addDataset: (
    dataset: Omit<Dataset, 'id' | 'createdAt' | 'rowCount'>
  ) => void
  deleteDataset: (id: string) => void
  setDatasetAnnotationTemplate: (
    datasetId: string,
    templateId: string | undefined
  ) => void

  addOrUpdateAnnotation: (
    record: Omit<AnnotationRecord, 'id' | 'annotatedAt' | 'updatedAt'> & {
      id?: string
    }
  ) => void
  getAnnotation: (
    datasetId: string,
    rowIndex: number
  ) => AnnotationRecord | undefined
  getDatasetAnnotations: (datasetId: string) => AnnotationRecord[]

  setCurrentAnnotator: (name: string) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      llmConfigs: [],
      activeLlmConfigId: null,
      promptTemplates: [],
      annotationTemplates: [],
      datasets: [],
      annotationRecords: [],
      currentAnnotator: 'annotator',

      setLLMConfigs: (configs) => set({ llmConfigs: configs }),
      addLLMConfig: (config) => {
        const newConfig: LLMConfig = {
          ...config,
          id: generateId(),
          createdAt: Date.now(),
        }
        set((state) => ({
          llmConfigs: [...state.llmConfigs, newConfig],
          activeLlmConfigId:
            state.activeLlmConfigId || newConfig.id,
        }))
      },
      updateLLMConfig: (id, config) =>
        set((state) => ({
          llmConfigs: state.llmConfigs.map((c) =>
            c.id === id ? { ...c, ...config } : c
          ),
        })),
      deleteLLMConfig: (id) =>
        set((state) => ({
          llmConfigs: state.llmConfigs.filter((c) => c.id !== id),
          activeLlmConfigId:
            state.activeLlmConfigId === id
              ? state.llmConfigs.find((c) => c.id !== id)?.id || null
              : state.activeLlmConfigId,
        })),
      setActiveLLMConfig: (id) => set({ activeLlmConfigId: id }),

      addPromptTemplate: (template) => {
        const now = Date.now()
        const newTemplate: PromptTemplate = {
          ...template,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          promptTemplates: [...state.promptTemplates, newTemplate],
        }))
      },
      updatePromptTemplate: (id, template) =>
        set((state) => ({
          promptTemplates: state.promptTemplates.map((t) =>
            t.id === id ? { ...t, ...template, updatedAt: Date.now() } : t
          ),
        })),
      deletePromptTemplate: (id) =>
        set((state) => ({
          promptTemplates: state.promptTemplates.filter((t) => t.id !== id),
        })),

      addAnnotationTemplate: (template) => {
        const now = Date.now()
        const newTemplate: AnnotationTemplate = {
          ...template,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          annotationTemplates: [...state.annotationTemplates, newTemplate],
        }))
      },
      updateAnnotationTemplate: (id, template) =>
        set((state) => ({
          annotationTemplates: state.annotationTemplates.map((t) =>
            t.id === id ? { ...t, ...template, updatedAt: Date.now() } : t
          ),
        })),
      deleteAnnotationTemplate: (id) =>
        set((state) => ({
          annotationTemplates: state.annotationTemplates.filter(
            (t) => t.id !== id
          ),
        })),

      addDataset: (dataset) => {
        const newDataset: Dataset = {
          ...dataset,
          id: generateId(),
          rowCount: dataset.rows.length,
          createdAt: Date.now(),
        }
        set((state) => ({
          datasets: [...state.datasets, newDataset],
        }))
      },
      deleteDataset: (id) =>
        set((state) => ({
          datasets: state.datasets.filter((d) => d.id !== id),
          annotationRecords: state.annotationRecords.filter(
            (r) => r.datasetId !== id
          ),
        })),
      setDatasetAnnotationTemplate: (datasetId, templateId) =>
        set((state) => ({
          datasets: state.datasets.map((d) =>
            d.id === datasetId
              ? { ...d, annotationTemplateId: templateId }
              : d
          ),
        })),

      addOrUpdateAnnotation: (record) => {
        const now = Date.now()
        const existing = get().annotationRecords.find(
          (r) =>
            r.datasetId === record.datasetId &&
            r.rowIndex === record.rowIndex
        )
        if (existing) {
          set((state) => ({
            annotationRecords: state.annotationRecords.map((r) =>
              r.id === existing.id
                ? {
                    ...r,
                    ...record,
                    id: r.id,
                    annotatedAt: r.annotatedAt,
                    updatedAt: now,
                  }
                : r
            ),
          }))
        } else {
          const newRecord: AnnotationRecord = {
            ...record,
            id: record.id || generateId(),
            annotatedAt: now,
            updatedAt: now,
          }
          set((state) => ({
            annotationRecords: [...state.annotationRecords, newRecord],
          }))
        }
      },
      getAnnotation: (datasetId, rowIndex) => {
        return get().annotationRecords.find(
          (r) => r.datasetId === datasetId && r.rowIndex === rowIndex
        )
      },
      getDatasetAnnotations: (datasetId) => {
        return get().annotationRecords.filter((r) => r.datasetId === datasetId)
      },

      setCurrentAnnotator: (name) => set({ currentAnnotator: name }),
    }),
    {
      name: 'annotation-platform-store',
    }
  )
)
