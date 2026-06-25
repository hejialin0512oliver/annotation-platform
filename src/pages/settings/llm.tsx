import { useState } from 'react'
import { Plus, Trash2, Check, Settings2 } from 'lucide-react'
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
import type { LLMConfig } from '@/types'

const defaultConfigs: Record<string, Partial<LLMConfig>> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1024,
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 1024,
  },
  azure: {
    baseUrl: '',
    model: '',
    temperature: 0.7,
    maxTokens: 1024,
  },
  custom: {
    baseUrl: '',
    model: '',
    temperature: 0.7,
    maxTokens: 1024,
  },
}

export default function LLMSettingsPage() {
  const {
    llmConfigs,
    activeLlmConfigId,
    addLLMConfig,
    updateLLMConfig,
    deleteLLMConfig,
    setActiveLLMConfig,
  } = useAppStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LLMConfig | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai' as LLMConfig['provider'],
    apiKey: '',
    baseUrl: '',
    model: '',
    temperature: 0.7,
    maxTokens: 1024,
  })

  const openCreateDialog = () => {
    setEditingConfig(null)
    setFormData({
      name: '',
      provider: 'openai',
      apiKey: '',
      baseUrl: defaultConfigs.openai.baseUrl || '',
      model: defaultConfigs.openai.model || '',
      temperature: 0.7,
      maxTokens: 1024,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (config: LLMConfig) => {
    setEditingConfig(config)
    setFormData({
      name: config.name,
      provider: config.provider,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    })
    setDialogOpen(true)
  }

  const handleProviderChange = (provider: string) => {
    const p = provider as LLMConfig['provider']
    const defaults = defaultConfigs[p] || {}
    setFormData((prev) => ({
      ...prev,
      provider: p,
      baseUrl: defaults.baseUrl || prev.baseUrl,
      model: defaults.model || prev.model,
      temperature: defaults.temperature ?? prev.temperature,
      maxTokens: defaults.maxTokens ?? prev.maxTokens,
    }))
  }

  const handleSubmit = () => {
    if (editingConfig) {
      updateLLMConfig(editingConfig.id, formData)
    } else {
      addLLMConfig(formData)
    }
    setDialogOpen(false)
  }

  const providerLabels: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    azure: 'Azure OpenAI',
    custom: '自定义',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings2 className="h-8 w-8" />
            LLM 设置
          </h1>
          <p className="mt-2 text-muted-foreground">
            配置大语言模型 API，用于数据行的智能总结
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              添加配置
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? '编辑 LLM 配置' : '添加 LLM 配置'}
              </DialogTitle>
              <DialogDescription>
                配置大模型 API 连接信息
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>配置名称</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如：我的 GPT-4"
                />
              </div>
              <div className="space-y-2">
                <Label>服务商</Label>
                <Select
                  value={formData.provider}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="azure">Azure OpenAI</SelectItem>
                    <SelectItem value="custom">自定义</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  placeholder="sk-..."
                />
              </div>
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  value={formData.baseUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, baseUrl: e.target.value })
                  }
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div className="space-y-2">
                <Label>模型名称</Label>
                <Input
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  placeholder="gpt-3.5-turbo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Temperature</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        temperature: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxTokens}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxTokens: parseInt(e.target.value) || 1024,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.name || !formData.apiKey}>
                {editingConfig ? '保存' : '添加'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {llmConfigs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Settings2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">暂无 LLM 配置</p>
            <p className="mt-2 text-sm text-muted-foreground">
              添加一个 LLM 配置来启用智能总结功能
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              添加配置
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {llmConfigs.map((config) => (
            <Card key={config.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  <Badge variant="outline">{providerLabels[config.provider]}</Badge>
                  {activeLlmConfigId === config.id && (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      <Check className="mr-1 h-3 w-3" />
                      活跃
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {activeLlmConfigId !== config.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveLLMConfig(config.id)}
                    >
                      设为活跃
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(config)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteLLMConfig(config.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">模型</p>
                    <p className="font-medium">{config.model || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Base URL</p>
                    <p className="font-medium truncate">{config.baseUrl || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Temperature</p>
                    <p className="font-medium">{config.temperature}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Tokens</p>
                    <p className="font-medium">{config.maxTokens}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>
            LLM 配置用于对每一行数据进行智能总结
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 支持 OpenAI、Anthropic、Azure OpenAI 及兼容 OpenAI 格式的自定义接口</p>
          <p>• 所有配置保存在浏览器本地存储中，不会上传到任何服务器</p>
          <p>• API Key 仅在调用 LLM 时使用，直接从浏览器发送到配置的 API 地址</p>
          <p>• 可以配置多个 LLM，并在标注时选择使用哪一个</p>
        </CardContent>
      </Card>
    </div>
  )
}
