import type { LLMConfig } from '@/types'

export interface LLMChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export async function callLLM(
  config: LLMConfig,
  messages: LLMChatMessage[]
): Promise<LLMResponse> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: config.temperature ?? 0.7,
  }

  if (config.maxTokens) {
    body.max_tokens = config.maxTokens
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `LLM API error (${response.status}): ${errorText || response.statusText}`
    )
  }

  const data = await response.json()

  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  }
}

export function buildSummaryPrompt(
  systemPrompt: string,
  userPromptTemplate: string,
  rowData: Record<string, string>
): LLMChatMessage[] {
  let userPrompt = userPromptTemplate

  if (userPrompt.includes('{{row_data}}')) {
    userPrompt = userPrompt.replace(
      /\{\{row_data\}\}/g,
      JSON.stringify(rowData, null, 2)
    )
  }

  Object.entries(rowData).forEach(([key, value]) => {
    userPrompt = userPrompt.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
      value || ''
    )
  })

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}
