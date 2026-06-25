import { useState } from 'react'
import { Plus, Trash2, Tags, Edit2, GripVertical, X } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { AnnotationTemplate, AnnotationField, AnnotationFieldType } from '@/types'

const fieldTypeLabels: Record<AnnotationFieldType, string> = {
  text: '单行文本',
  textarea: '多行文本',
  number: '数字',
  select: '单选',
  multiselect: '多选',
  boolean: '是/否',
}

export default function AnnotationTemplatesPage() {
  const { annotationTemplates, promptTemplates, addAnnotationTemplate, updateAnnotationTemplate, deleteAnnotationTemplate } =
    useAppStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AnnotationTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    promptTemplateId: '' as string | undefined,
    fields: [] as AnnotationField[],
  })

  const generateFieldId = () =>
    'field_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)

  const openCreateDialog = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      description: '',
      promptTemplateId: undefined,
      fields: [],
    })
    setDialogOpen(true)
  }

  const openEditDialog = (template: AnnotationTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      promptTemplateId: template.promptTemplateId,
      fields: [...template.fields],
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (editingTemplate) {
      updateAnnotationTemplate(editingTemplate.id, formData)
    } else {
      addAnnotationTemplate(formData)
    }
    setDialogOpen(false)
  }

  const addField = () => {
    const newField: AnnotationField = {
      id: generateFieldId(),
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: [],
    }
    setFormData({ ...formData, fields: [...formData.fields, newField] })
  }

  const updateField = (fieldId: string, updates: Partial<AnnotationField>) => {
    setFormData({
      ...formData,
      fields: formData.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    })
  }

  const removeField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((f) => f.id !== fieldId),
    })
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...formData.fields]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newFields.length) return
    ;[newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]]
    setFormData({ ...formData, fields: newFields })
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Tags className="h-8 w-8" />
            标注模版
          </h1>
          <p className="mt-2 text-muted-foreground">
            配置标注字段和类型，满足不同的标注需求
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              新建模版
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? '编辑标注模版' : '新建标注模版'}
              </DialogTitle>
              <DialogDescription>
                定义标注需要的字段和类型
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>模版名称</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如：用户行为分类"
                />
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="简短描述这个模版的用途"
                />
              </div>
              <div className="space-y-2">
                <Label>关联 Prompt 模版</Label>
                <Select
                  value={formData.promptTemplateId || ''}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      promptTemplateId: value || undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择一个 Prompt 模版（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    {promptTemplates.map((pt) => (
                      <SelectItem key={pt.id} value={pt.id}>
                        {pt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  关联后，标注时可使用该 Prompt 生成 AI 总结
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>标注字段</Label>
                  <Button variant="outline" size="sm" onClick={addField}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加字段
                  </Button>
                </div>

                {formData.fields.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      还没有字段，点击上方按钮添加
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="rounded-lg border border-border p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            字段 #{index + 1}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => moveField(index, 'up')}
                              disabled={index === 0}
                            >
                              <span className="text-xs">↑</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => moveField(index, 'down')}
                              disabled={index === formData.fields.length - 1}
                            >
                              <span className="text-xs">↓</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeField(field.id)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>字段名 (Key)</Label>
                            <Input
                              value={field.name}
                              onChange={(e) =>
                                updateField(field.id, { name: e.target.value })
                              }
                              placeholder="例如: category"
                              size={20}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>显示标签</Label>
                            <Input
                              value={field.label}
                              onChange={(e) =>
                                updateField(field.id, { label: e.target.value })
                              }
                              placeholder="例如: 行为类别"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>字段类型</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value) =>
                                updateField(field.id, {
                                  type: value as AnnotationFieldType,
                                  options:
                                    value === 'select' || value === 'multiselect'
                                      ? field.options || []
                                      : undefined,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">单行文本</SelectItem>
                                <SelectItem value="textarea">多行文本</SelectItem>
                                <SelectItem value="number">数字</SelectItem>
                                <SelectItem value="select">单选</SelectItem>
                                <SelectItem value="multiselect">多选</SelectItem>
                                <SelectItem value="boolean">是/否</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 pt-2">
                              <Checkbox
                                checked={field.required}
                                onCheckedChange={(checked) =>
                                  updateField(field.id, {
                                    required: checked === true,
                                  })
                                }
                              />
                              必填
                            </Label>
                          </div>
                        </div>
                        {(field.type === 'select' || field.type === 'multiselect') && (
                          <div className="space-y-2">
                            <Label>选项（每行一个）</Label>
                            <textarea
                              value={field.options?.join('\n') || ''}
                              onChange={(e) =>
                                updateField(field.id, {
                                  options: e.target.value
                                    .split('\n')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              placeholder="选项1&#10;选项2&#10;选项3"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || formData.fields.length === 0}
              >
                {editingTemplate ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {annotationTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Tags className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">暂无标注模版</p>
            <p className="mt-2 text-sm text-muted-foreground">
              创建一个标注模版来定义标注字段
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              新建模版
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {annotationTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || '暂无描述'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAnnotationTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {template.fields.map((field) => (
                    <Badge key={field.id} variant="outline">
                      {field.label || field.name}
                      <span className="ml-1 text-muted-foreground">
                        ({fieldTypeLabels[field.type]})
                      </span>
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{template.fields.length} 个字段</span>
                  <span>更新于 {formatDate(template.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
