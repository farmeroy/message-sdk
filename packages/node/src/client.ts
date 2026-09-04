import type {Message, MessageResponse, Result, Model} from "@agent-message-sdk/core"


export class Client {
  #url = "https://api.anthropic.com/v1/messages"
  #messages: Message[] = []
  #systemPrompt: string
  #model: Model // fix to haiku for now
  #maxTokens = 1024
  constructor(systemPrompt = "", model: Model = "claude-haiku-4-5" ) {
    this.#systemPrompt = systemPrompt
    this.#model = model
  }
  async sendMessage(text: string): Promise<Result<MessageResponse>> {
    const message: Message = {content: text, role: "user"};
    this.#messages.push(message);
    try {
      const response = await fetch(this.#url, {
        method: "GET",
        headers: [
         ['x-api-key', process.env?.ANTHROPIC_API_KEY ?? '']
        ],
        body: JSON.stringify({
          system: {
            type: "text",
            text: this.#systemPrompt
          },
          max_tokens: this.#maxTokens,
          model: this.#model,
          messages: this.#messages
        })
      })
      const r = await response.json()
      const messageResponse: MessageResponse = {
        id: r['id'] ?? '',
        type: r['type'] ?? 'message',
        role: r['role'] ?? 'assistant',
        content: r['content'] ?? [],
        model: r['model'] ?? this.#model,
        stop_reason: r['stop_reason'] ?? 'none',
      }
      return {ok: true, value: messageResponse}
    } catch (error) {
      if (error instanceof Error) {
        return  {ok: false, value: error.message}
      } else {
        return {ok: false, value: String(error)}
      }
    }
  }
}

