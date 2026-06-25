import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { callLLM, buildSummaryPrompt } from '@/services/llm'
import { exportToCSV } from '@/services/export'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  AnnotationField,
  AnnotationFieldType,
} from '@/types'

export default function AnnotatePage() {
  const { datasetId } = useParams<{ datasetId: string }>()
  const navigate = useNavigate()

  const {
    datasets,
    annotationTemplates,
    promptTemplates,
    llmConfigs,
    activeLlmConfigId,
    currentAnnotator,
    addOrUpdateAnnotation,
    getAnnotation,
    getDatasetAnnotations,
  } = useAppStore()

  const dataset = datasets.find((d) => d.id === datasetId)
  const template = annotationTemplates.find(
    (t) => t.id === dataset?.annotationTemplateId
  )
  const promptTemplate = promptTemplates.find(
    (p) => p.id === template?.promptTemplateId
  )
  const activeLlmConfig = llmConfigs.find((c) => c.id === activeLlmConfigId)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [annotations, setAnnotations] = useState<Record<string, string | string[] | number | boolean>>({})
  const [llmSummary, setLlmSummary] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [llmError, setLlmError] = useState('')
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedExportFields, setSelectedExportFields] = useState<string[]>([])
  const [selectedLlmId, setSelectedLlmId] = useState<string | null>(null)

  const totalRecords = dataset?.rowCount || 0
  const datasetAnnotations = datasetId ? getDatasetAnnotations(datasetId) : []
  const annotatedCount = datasetAnnotations.length

  const currentRow = dataset?.rows[currentIndex]
  const existingAnnotation = datasetId
    ? getAnnotation(datasetId, currentIndex)
    : undefined

  useEffect(() => {
    if (existingAnnotation) {
      setAnnotations(existingAnnotation.annotations)
      setLlmSummary(existingAnnotation.llmSummary || '')
    } else {
      setAnnotations({})
      setLlmSummary('')
    }
    setLlmError('')
  }, [currentIndex, datasetId])

  useEffect(() => {
    setSelectedLlmId(activeLlmConfigId)
  }, [activeLlmConfigId])

  const handleFieldChange = (fieldName: string, value: string | string[] | number | boolean) => {
    setAnnotations((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleGenerateSummary = async () => {
    if (!selectedLlmId || !activeLlmConfig || !promptTemplate || !currentRow) {
      return
    }

    const config = llmConfigs.find((c) => c.id === selectedLlmId)
    if (!config) return

    setIsGenerating(true)
    setLlmError('')

    try {
      const messages = buildSummaryPrompt(
        promptTemplate.systemPrompt,
        promptTemplate.userPrompt,
        currentRow
      )
      const response = await callLLM(config, messages)
      setLlmSummary(response.content)
    } catch (error) {
      setLlmError(error instanceof Error ? error.message : '生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    if (!datasetId) return
    addOrUpdateAnnotation({
      datasetId,
      rowIndex: currentIndex,
      annotations,
      llmSummary,
      annotatedBy: currentAnnotator,
    })
  }

  const handleSaveAndNext = () => {
    handleSave()
    if (currentIndex < totalRecords - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleExport = (fields: string[]) => {
    if (!dataset || !template) return
    exportToCSV({
      dataset,
      template,
      annotations: datasetAnnotations,
      selectedFields: fields,
    })
    setExportDialogOpen(false)
  }

  const allExportFields = useMemo(() => {
    if (!dataset || !template) return []
    const dataFields = dataset.headers.map((h) => ({
      key: h,
      label: h,
      group: '原始数据',
    }))
    const annotationFields = template.fields.map((f) => ({
      key: `annotation_${f.name}`,
      label: f.label || f.name,
      group: '标注字段',
    }))
    const metaFields = [
      { key: 'row_index', label: '行号', group: '元数据' },
      { key: 'llm_summary', label: 'LLM 总结', group: '元数据' },
      { key: 'annotated_by', label: '标注人', group: '元数据' },
      { key: 'annotated_at', label: '标注时间', group: '元数据' },
    ]
    return [...dataFields, ...annotationFields, ...metaFields]
  }, [dataset, template])

  useEffect(() => {
    if (selectedExportFields.length === 0 && allExportFields.length > 0) {
      setSelectedExportFields(allExportFields.map((f) => f.key))
    }
  }, [allExportFields])

  if (!dataset) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg">数据集不存在</p>
        <Button className="mt-4" onClick={() => navigate('/datasets')}>
          返回数据集列表
        </Button>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-amber-500" />
        <p className="text-lg font-medium">未设置标注模版</p>
        <p className="mt-2 text-sm text-muted-foreground">
          请先在数据集管理中关联一个标注模版
        </p>
        <Button className="mt-4" onClick={() => navigate('/datasets')}>
          返回数据集列表
        </Button>
      </div>
    )
  }

  const isAnnotated = !!existingAnnotation
  const progress = totalRecords > 0 ? Math.round((annotatedCount / totalRecords) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/datasets')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{dataset.name}</h1>
            <p className="text-sm text-muted-foreground">
              {template.name} · {totalRecords} 条数据
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1">
            进度: {annotatedCount}/{totalRecords} ({progress}%)
          </Badge>
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                导出 CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>导出 CSV</DialogTitle>
                <DialogDescription>
                  选择要导出的字段，共 {annotatedCount} 条标注记录
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[400px] overflow-y-auto py-4">
                <div className="space-y-4">
                  {['原始数据', '标注字段', '元数据'].map((group) => {
                    const groupFields = allExportFields.filter(
                      (f) => f.group === group
                    )
                    if (groupFields.length === 0) return null
                    return (
                      <div key={group} className="space-y-2">
                        <h4 className="text-sm font-medium">{group}</h4>
                        <div className="space-y-2">
                          {groupFields.map((field) => (
                            <div
                              key={field.key}
                              className="flex items-center space-x-3"
                            >
                              <Checkbox
                                id={`export-${field.key}`}
                                checked={selectedExportFields.includes(field.key)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedExportFields((prev) => [
                                      ...prev,
                                      field.key,
                                    ])
                                  } else {
                                    setSelectedExportFields((prev) =>
                                      prev.filter((k) => k !== field.key)
                                    )
                                  }
                                }}
                              />
                              <label
                                htmlFor={`export-${field.key}`}
                                className="text-sm font-normal leading-none"
                              >
                                {field.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedExportFields(allExportFields.map((f) => f.key))}
                >
                  全选
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setExportDialogOpen(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={() => handleExport(selectedExportFields)}
                  disabled={selectedExportFields.length === 0 || annotatedCount === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  导出
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  数据行 #{currentIndex + 1}
                  {isAnnotated && (
                    <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">
                      <Check className="mr-1 h-3 w-3" />
                      已标注
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    LLM:
                  </span>
                  <Select
                    value={selectedLlmId || ''}
                    onValueChange={setSelectedLlmId}
                  >
                    <SelectTrigger className="w-[160px] h-8">
                      <SelectValue placeholder="选择模型" />
                    </SelectTrigger>
                    <SelectContent>
                      {llmConfigs.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {promptTemplate && activeLlmConfig ? (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label>AI 智能总结</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSummary}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          生成总结
                        </>
                      )}
                    </Button>
                  </div>
                  {llmError && (
                    <div className="mb-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {llmError}
                    </div>
                  )}
                  <Textarea
                    value={llmSummary}
                    onChange={(e) => setLlmSummary(e.target.value)}
                    placeholder="点击上方按钮生成 AI 总结，或手动输入..."
                    className="min-h-[120px] text-sm"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {!promptTemplate
                      ? '当前标注模版未关联 Prompt 模版'
                      : '请先配置 LLM API'}
                  </p>
                </div>
              )}

              <Tabs defaultValue="table" className="w-full">
                <TabsList>
                  <TabsTrigger value="table">表格视图</TabsTrigger>
                  <TabsTrigger value="json">原始数据</TabsTrigger>
                </TabsList>
                <TabsContent value="table">
                  <div className="max-h-[300px] overflow-auto rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead className="w-[30%]">字段</TableHead>
                          <TableHead>值</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataset.headers.map((header) => (
                          <TableRow key={header}>
                            <TableCell className="font-medium text-muted-foreground">
                              {header}
                            </TableCell>
                            <TableCell className="max-w-[300px] break-all">
                              {currentRow?.[header] || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="json">
                  <pre className="max-h-[300px] overflow-auto rounded-md border bg-muted/50 p-4 text-xs">
                    {JSON.stringify(currentRow, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">标注表单</CardTitle>
              <CardDescription>{template.description || '请填写以下标注字段'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {template.fields.map((field) => (
                <AnnotationFieldInput
                  key={field.id}
                  field={field}
                  value={annotations[field.name]}
                  onChange={(value) => handleFieldChange(field.name, value)}
                />
              ))}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              上一条
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSave}>
                保存
              </Button>
              <Button
                onClick={handleSaveAndNext}
                disabled={currentIndex === totalRecords - 1}
              >
                保存并下一条
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div>
              <p className="text-sm font-medium">标注进度</p>
              <p className="text-xs text-muted-foreground">
                已标注 {annotatedCount} / {totalRecords} 条
              </p>
            </div>
            <div className="w-48">
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted-foreground">{progress}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AnnotationFieldInputProps {
  field: AnnotationField
  value: string | string[] | number | boolean | undefined
  onChange: (value: string | string[] | number | boolean) => void
}

function AnnotationFieldInput({ field, value, onChange }: AnnotationFieldInputProps) {
  const label = (
    <Label>
      {field.label || field.name}
      {field.required && <span className="ml-1 text-destructive">*</span>}
      {field.description && (
        <span className="ml-2 text-xs text-muted-foreground">
          ({field.description})
        </span>
      )}
    </Label>
  )

  const renderInput = () => {
    switch (field.type as AnnotationFieldType) {
      case 'text':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`请输入${field.label || field.name}`}
          />
        )
      case 'textarea':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`请输入${field.label || field.name}`}
            className="min-h-[100px]"
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={`请输入${field.label || field.name}`}
          />
        )
      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={`请选择${field.label || field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'multiselect': {
        const selected = (value as string[]) || []
        return (
          <div className="space-y-2 rounded-md border p-3">
            {field.options?.map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selected, opt])
                    } else {
                      onChange(selected.filter((v) => v !== opt))
                    }
                  }}
                />
                <label className="text-sm">{opt}</label>
              </div>
            ))}
          </div>
        )
      }
      case 'boolean':
        return (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={field.name}
                checked={value === true}
                onChange={() => onChange(true)}
                className="h-4 w-4"
              />
              <span className="text-sm">是</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={field.name}
                checked={value === false}
                onChange={() => onChange(false)}
                className="h-4 w-4"
              />
              <span className="text-sm">否</span>
            </label>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      {label}
      {renderInput()}
    </div>
  )
}
