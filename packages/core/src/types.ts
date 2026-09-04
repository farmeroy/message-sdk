// We define only a subset of what is available
// our sdk will be a basic implementaiton of the agent
export type Message = {
  content: string | ContentBlock[],
  role: Role
}

export type Role = "assistant" | "user"

export type ContentBlock = {
  // citations: not implemented now
  text: string,
  type: "text" // only implementing text content
}

export type MessageCreateParams = {
  role: Role,
  content: string | ContentBlock[]
}

export type AnthropicModel = "claude-haiku-4-5" | "claude-sonnet-5"



export type AnthropicMessageBody = {
  model: string,
  maxTokens: number,
  messages: Message[],
  system: ContentBlock
}

export type AnthropicMessageResponse = {
  id: string,
  type: "message",
  role: "assistant",
  content: ContentBlock[],
  model: Model,
  stop_reason: string,
}

export type Model = AnthropicModel

export type MessageResponse = AnthropicMessageResponse

export type Result<T> = {
  ok: boolean,
  value: T | string
}
