import {
	type Message,
	type MessageResponse,
	type Model,
	parseResponse,
	type Result,
} from "@agent-message-sdk/core";

export class Client {
	#url = "https://api.anthropic.com/v1/messages";
	#messages: Message[] = [];
	#systemPrompt: string;
	#model: Model; // fix to haiku for now
	#maxTokens = 1024;
	constructor(systemPrompt = "", model: Model = "claude-haiku-4-5") {
		this.#systemPrompt = systemPrompt;
		this.#model = model;
	}
	async *streamMessage(text: string): AsyncGenerator {
		const message: Message = { content: text, role: "user" };
		this.#messages.push(message);
		try {
			if (!process.env.ANTHROPIC_API_KEY) {
				throw new Error("no api key in env");
			}
			const response = await fetch(this.#url, {
				method: "POST",
				headers: [
					["X-Api-Key", process.env?.ANTHROPIC_API_KEY ?? ""],
					["anthropic-version", "2023-06-01"],
					["Content-Type", "application/json"],
				],
				body: JSON.stringify({
					system: [
						{
							type: "text",
							text: this.#systemPrompt,
						},
					],
					max_tokens: this.#maxTokens,
					model: this.#model,
					messages: this.#messages,
					stream: true,
				}),
			});
			// the response.body itself is an async iterable
			if (response.body) {
        const textDecoder = new TextDecoder("utf-8");
        let buffer = ""; 
				for await (const chunk of response.body) {
					// we need to parse each chun
          const text = textDecoder.decode(chunk, {stream: true});
          buffer += text;
          const sep = buffer.indexOf("\n\n");
          if (sep >= 0) {
            const completeData = buffer.slice(0,sep)
            buffer = buffer.slice(sep + 2)
            const lines = splitOnce(completeData, '\n');
            const event = splitOnce(lines[0], ":");
            const data = splitOnce(lines[1], ":");
            yield {event: event[1].trim(), data: JSON.parse(data[1])}
          }
				}
			} else {
				throw new Error("No response body");
			}
		} catch (err) {
			console.error(err);
		}
	}
	async sendMessage(text: string): Promise<Result<MessageResponse>> {
		const message: Message = { content: text, role: "user" };
		this.#messages.push(message);
		try {
			if (process.env.ANTHROPIC_API_KEY == null) {
				throw new Error("no api key in env");
			}
			const response = await fetch(this.#url, {
				method: "POST",
				headers: [
					["X-Api-Key", process.env?.ANTHROPIC_API_KEY ?? ""],
					["anthropic-version", "2023-06-01"],
					["Content-Type", "application/json"],
				],
				body: JSON.stringify({
					system: [
						{
							type: "text",
							text: this.#systemPrompt,
						},
					],
					max_tokens: this.#maxTokens,
					model: this.#model,
					messages: this.#messages,
				}),
			});
			const r = await response.json();
			const messageResponse = parseResponse(r);
			return { ok: true, value: messageResponse };
		} catch (error) {
			if (error instanceof Error) {
				return { ok: false, error: error.message };
			} else {
				return { ok: false, error: String(error) };
			}
		}
	}
}

function splitOnce(s: string, c: string): Array<string> {
  const index = s.indexOf(c);
  if (!index) return [];
  return [s.substring(0, index), s.substring(index + c.length)]
}
