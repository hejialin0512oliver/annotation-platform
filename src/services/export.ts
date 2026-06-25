import Papa from 'papaparse'
import type { Dataset, AnnotationTemplate, AnnotationRecord } from '@/types'

interface ExportOptions {
  dataset: Dataset
  template: AnnotationTemplate
  annotations: AnnotationRecord[]
  selectedFields: string[]
}

export function exportToCSV(options: ExportOptions) {
  const { dataset, annotations, selectedFields } = options

  const annotationMap = new Map<number, AnnotationRecord>()
  annotations.forEach((a) => {
    annotationMap.set(a.rowIndex, a)
  })

  const rows: Record<string, string>[] = dataset.rows.map((row, index) => {
    const annotation = annotationMap.get(index)
    const result: Record<string, string> = {}

    selectedFields.forEach((fieldKey) => {
      if (fieldKey === 'row_index') {
        result[fieldKey] = String(index + 1)
      } else if (fieldKey === 'llm_summary') {
        result[fieldKey] = annotation?.llmSummary || ''
      } else if (fieldKey === 'annotated_by') {
        result[fieldKey] = annotation?.annotatedBy || ''
      } else if (fieldKey === 'annotated_at') {
        result[fieldKey] = annotation
          ? new Date(annotation.annotatedAt).toLocaleString('zh-CN')
          : ''
      } else if (fieldKey.startsWith('annotation_')) {
        const fieldName = fieldKey.replace('annotation_', '')
        const value = annotation?.annotations[fieldName]
        if (Array.isArray(value)) {
          result[fieldKey] = value.join('; ')
        } else if (typeof value === 'boolean') {
          result[fieldKey] = value ? '是' : '否'
        } else if (value !== undefined && value !== null) {
          result[fieldKey] = String(value)
        } else {
          result[fieldKey] = ''
        }
      } else {
        result[fieldKey] = row[fieldKey] || ''
      }
    })

    return result
  })

  const csv = Papa.unparse(rows, {
    columns: selectedFields,
  })

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${dataset.name}_annotations_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
