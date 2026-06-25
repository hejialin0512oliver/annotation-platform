import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Database,
  FileText,
  Tags,
  Settings,
  ArrowRight,
  CheckCircle2,
  Clock,
  ListTodo,
  Download,
  Upload,
  HardDrive,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/app-store'

export default function DashboardPage() {
  const { datasets, annotationTemplates, promptTemplates, llmConfigs, annotationRecords, exportData, importData } =
    useAppStore()
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge')
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalAnnotated = annotationRecords.length
  const totalRows = datasets.reduce((sum, d) => sum + d.rowCount, 0)
  const progress = totalRows > 0 ? Math.round((totalAnnotated / totalRows) * 100) : 0

  const stats = [
    {
      label: '数据集',
      value: datasets.length,
      icon: Database,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      link: '/datasets',
    },
    {
      label: '标注模版',
      value: annotationTemplates.length,
      icon: Tags,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      link: '/templates/annotation',
    },
    {
      label: 'Prompt 模版',
      value: promptTemplates.length,
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      link: '/templates/prompts',
    },
    {
      label: 'LLM 配置',
      value: llmConfigs.length,
      icon: Settings,
      color: 'text-green-600',
      bg: 'bg-green-50',
      link: '/settings/llm',
    },
  ]

  const quickActions = [
    {
      title: '上传数据集',
      description: '上传 CSV 文件开始标注工作',
      link: '/datasets',
      icon: Database,
    },
    {
      title: '配置 LLM',
      description: '设置大模型 API 用于智能总结',
      link: '/settings/llm',
      icon: Settings,
    },
    {
      title: '创建标注模版',
      description: '定义标注字段和类型',
      link: '/templates/annotation',
      icon: Tags,
    },
  ]

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `annotation-platform-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    setImportDialogOpen(true)
    setImportError(null)
    setImportSuccess(false)
    setImportMode('merge')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const result = importData(content, importMode)
      if (result.success) {
        setImportSuccess(true)
        setImportError(null)
      } else {
        setImportError(result.error || '导入失败')
        setImportSuccess(false)
      }
    }
    reader.onerror = () => {
      setImportError('文件读取失败')
    }
    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">概览</h1>
        <p className="mt-2 text-muted-foreground">
          用户行为序列标注平台 - 高效管理您的标注工作流程
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="group transition-opacity hover:opacity-90"
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  查看详情
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              标注进度
            </CardTitle>
            <CardDescription>整体标注完成情况</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>已标注</span>
              </div>
              <span className="font-medium">{totalAnnotated} 条</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>待标注</span>
              </div>
              <span className="font-medium">{totalRows - totalAnnotated} 条</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-foreground transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-right text-sm text-muted-foreground">{progress}% 完成</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快速开始</CardTitle>
            <CardDescription>开始您的标注工作</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.link}
                className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="rounded-lg bg-secondary p-2">
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              数据管理
            </CardTitle>
            <CardDescription>导入导出配置数据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={handleExport}
              className="flex w-full items-center gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-secondary/50"
            >
              <div className="rounded-lg bg-secondary p-2">
                <Download className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">导出数据</p>
                <p className="text-sm text-muted-foreground">导出所有配置和标注数据为 JSON</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleImportClick}
              className="flex w-full items-center gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-secondary/50"
            >
              <div className="rounded-lg bg-secondary p-2">
                <Upload className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">导入数据</p>
                <p className="text-sm text-muted-foreground">从 JSON 文件导入配置和数据</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入数据</DialogTitle>
            <DialogDescription>
              选择导入方式，然后选择 JSON 文件进行导入
            </DialogDescription>
          </DialogHeader>

          {importSuccess ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <p className="mt-4 text-lg font-medium">导入成功！</p>
              <p className="mt-2 text-sm text-muted-foreground">
                数据已成功导入
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <Label>导入方式</Label>
                  <RadioGroup
                    value={importMode}
                    onValueChange={(v: string) => setImportMode(v as 'replace' | 'merge')}
                    className="space-y-2"
                  >
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                      <RadioGroupItem value="merge" id="merge" />
                      <Label htmlFor="merge" className="flex-1 cursor-pointer font-normal">
                        <span className="font-medium">合并导入</span>
                        <p className="text-sm text-muted-foreground">
                          保留现有数据，按 ID 合并，相同 ID 的数据会被覆盖
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                      <RadioGroupItem value="replace" id="replace" />
                      <Label htmlFor="replace" className="flex-1 cursor-pointer font-normal">
                        <span className="font-medium">替换全部</span>
                        <p className="text-sm text-muted-foreground">
                          清空现有数据，完全替换为导入的内容
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {importError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {importError}
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          )}

          <DialogFooter>
            {importSuccess ? (
              <Button onClick={() => setImportDialogOpen(false)}>完成</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  选择文件
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
