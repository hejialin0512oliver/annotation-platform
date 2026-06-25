import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Papa from 'papaparse'
import { Database, Upload, Trash2, Play, FileText } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Dataset } from '@/types'

export default function DatasetsPage() {
  const {
    datasets,
    annotationTemplates,
    annotationRecords,
    addDataset,
    deleteDataset,
    setDatasetAnnotationTemplate,
  } = useAppStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{
    headers: string[]
    rows: Record<string, string>[]
    fileName: string
  } | null>(null)
  const [datasetName, setDatasetName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        const headers = results.meta.fields || []
        setPreviewData({
          headers,
          rows,
          fileName: file.name,
        })
        setDatasetName(file.name.replace(/\.csv$/i, ''))
        setDialogOpen(true)
      },
      error: (error) => {
        console.error('CSV parse error:', error)
        alert('CSV 文件解析失败，请检查文件格式')
      },
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file)
    } else {
      alert('请上传 CSV 文件')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleCreateDataset = () => {
    if (!previewData) return
    addDataset({
      name: datasetName || previewData.fileName,
      fileName: previewData.fileName,
      headers: previewData.headers,
      rows: previewData.rows,
    })
    setDialogOpen(false)
    setPreviewData(null)
    setDatasetName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getAnnotatedCount = (datasetId: string) => {
    return annotationRecords.filter((r) => r.datasetId === datasetId).length
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDelete = (dataset: Dataset) => {
    if (confirm(`确定要删除数据集 "${dataset.name}" 吗？所有标注记录也会被删除。`)) {
      deleteDataset(dataset.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Database className="h-8 w-8" />
            数据集
          </h1>
          <p className="mt-2 text-muted-foreground">
            上传 CSV 数据文件，开始标注工作
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              上传 CSV
            </Button>
          </DialogTrigger>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInput}
          />
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {previewData ? '确认上传' : '上传 CSV 文件'}
              </DialogTitle>
              <DialogDescription>
                {previewData
                  ? `文件包含 ${previewData.rows.length} 行数据，${previewData.headers.length} 个字段`
                  : '上传 CSV 格式的数据文件'}
              </DialogDescription>
            </DialogHeader>

            {!previewData ? (
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 transition-colors hover:border-primary/50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">拖拽 CSV 文件到这里</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  或者点击下方按钮选择文件
                </p>
                <Button
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  选择文件
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>数据集名称</Label>
                  <Input
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label>数据预览</Label>
                    <Badge variant="outline">
                      显示前 5 行 / 共 {previewData.rows.length} 行
                    </Badge>
                  </div>
                  <div className="max-h-[300px] overflow-auto rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          {previewData.headers.map((header) => (
                            <TableHead key={header} className="whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.rows.slice(0, 5).map((row, i) => (
                          <TableRow key={i}>
                            {previewData.headers.map((header) => (
                              <TableCell
                                key={header}
                                className="max-w-[200px] truncate text-sm"
                              >
                                {row[header]}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  setPreviewData(null)
                }}
              >
                取消
              </Button>
              {previewData && (
                <Button onClick={handleCreateDataset}>
                  <Database className="mr-2 h-4 w-4" />
                  创建数据集
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {datasets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Database className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">暂无数据集</p>
            <p className="mt-2 text-sm text-muted-foreground">
              上传 CSV 文件来创建您的第一个数据集
            </p>
            <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              上传 CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {datasets.map((dataset) => {
            const annotated = getAnnotatedCount(dataset.id)
            const progress =
              dataset.rowCount > 0
                ? Math.round((annotated / dataset.rowCount) * 100)
                : 0
            const template = annotationTemplates.find(
              (t) => t.id === dataset.annotationTemplateId
            )

            return (
              <Card key={dataset.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {dataset.name}
                      {dataset.annotationTemplateId && (
                        <Badge variant="outline">
                          {template?.name || '已关联模版'}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {dataset.fileName} · {dataset.rowCount} 行 · {dataset.headers.length} 字段
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/annotate/${dataset.id}`}>
                      <Button size="sm">
                        <Play className="mr-2 h-4 w-4" />
                        开始标注
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(dataset)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">标注进度</span>
                    <span className="font-medium">
                      {annotated} / {dataset.rowCount} ({progress}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-foreground transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">标注模版</Label>
                      <Select
                        value={dataset.annotationTemplateId || ''}
                        onValueChange={(value) =>
                          setDatasetAnnotationTemplate(
                            dataset.id,
                            value || undefined
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-[180px]">
                          <SelectValue placeholder="选择模版" />
                        </SelectTrigger>
                        <SelectContent>
                          {annotationTemplates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      创建于 {formatDate(dataset.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
