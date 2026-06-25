import { useState } from 'react'
import { Plus, Trash2, FileText, Edit2 } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PromptTemplate } from '@/types'

const defaultSystemPrompt = `你是一个数据标注助手。请根据用户提供的埋点数据，用简洁的语言总结这条数据的内容。

要求：
1. 准确理解数据含义
2. 输出简洁明了
3. 重点关注用户行为和事件
4. 如果有时间信息，请包含时间`

const defaultUserPrompt = `请总结以下数据行的内容：

{{data}}

请用简短的语言概括这条数据的主要内容。`

export default function PromptTemplatesPage() {
  const { promptTemplates, addPromptTemplate, updatePromptTemplate, deletePromptTemplate } =
    useAppStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    userPrompt: '',
  })

  const openCreateDialog = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      description: '',
      systemPrompt: defaultSystemPrompt,
      userPrompt: defaultUserPrompt,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (template: PromptTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      systemPrompt: template.systemPrompt,
      userPrompt: template.userPrompt,
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (editingTemplate) {
      updatePromptTemplate(editingTemplate.id, formData)
    } else {
      addPromptTemplate(formData)
    }
    setDialogOpen(false)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Prompt 模版
          </h1>
          <p className="mt-2 text-muted-foreground">
            管理用于数据总结的 Prompt 模版，支持变量替换
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
                {editingTemplate ? '编辑 Prompt 模版' : '新建 Prompt 模版'}
              </DialogTitle>
              <DialogDescription>
                配置系统提示词和用户提示词，使用 {'{{变量名}}'} 作为占位符
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>模版名称</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如：用户行为总结"
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
                <Label>
                  System Prompt
                  <Badge variant="outline" className="ml-2">系统提示词</Badge>
                </Label>
                <Textarea
                  value={formData.systemPrompt}
                  onChange={(e) =>
                    setFormData({ ...formData, systemPrompt: e.target.value })
                  }
                  placeholder="定义 AI 的角色和行为..."
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  User Prompt
                  <Badge variant="outline" className="ml-2">用户提示词</Badge>
                </Label>
                <Textarea
                  value={formData.userPrompt}
                  onChange={(e) =>
                    setFormData({ ...formData, userPrompt: e.target.value })
                  }
                  placeholder="使用 {{字段名}} 引用 CSV 中的字段..."
                  className="min-h-[150px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  提示：使用 {'{{字段名}}'} 的格式引用 CSV 中的列，例如 {'{{user_id}}'}、{'{{event_name}}'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name}>
                {editingTemplate ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {promptTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">暂无 Prompt 模版</p>
            <p className="mt-2 text-sm text-muted-foreground">
              创建一个 Prompt 模版来启用 AI 智能总结
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              新建模版
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promptTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col">
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
                      onClick={() => deletePromptTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    System Prompt
                  </p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {template.systemPrompt}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    User Prompt
                  </p>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {template.userPrompt}
                  </p>
                </div>
                <div className="pt-2 text-xs text-muted-foreground">
                  更新于 {formatDate(template.updatedAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
