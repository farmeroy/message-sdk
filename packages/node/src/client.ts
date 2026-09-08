import { parseSSEStream } from "@agent-message-sdk/core";
import {
	type ContentBlock,
	AnthropicStreamEvent,
	type Message,
	type MessageResponse,
	type Model,
	parseResponse,
	type Result,
} from "@agent-message-sdk/core";

export class Client {
	// hardcoded now to v1 anthropic messages api
	#url = "https://api.anthropic.com/v1/messages";
	// here we store the messages in memory,
	// but we might want to specify a location
	// such as local storage
	// a database, etc.
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
			if (!response.body) {
				throw new Error("No response body");
			}
			const aggregateResponse: {
				role: "assistant";
				content: ContentBlock[];
			} = {
				role: "assistant",
				content: [],
			};
			// we need another pipeline
			for await (const delta of parseSSEStream(response.body)) {
				// we need to aggregate the raw message
				// this message aggregation should be part of the core package
				// so i can reuse it in browser node etc.
				const event = delta as AnthropicStreamEvent;
				if (event.event === "message_start") {
					aggregateResponse.role = "assistant";
				} else if (event.event === "content_block_start") {
					// we are keeping a 'buffer' in the last element of the array
					aggregateResponse.content.push(event.data.content_block);
				} else if (event.event === "content_block_delta") {
					// access the last element
					const currentBlock =
						aggregateResponse.content[aggregateResponse.content.length - 1];
					// right now we only handle text types anyway, but we should check
					if ((event.data.delta.type = "text_delta")) {
						currentBlock.text += event.data.delta.text;
					}
				}
				yield delta;
			}
			this.#messages.push(aggregateResponse);
			// console.log(this.#messages);
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
			this.#messages.push({
				role: "assistant",
				content: messageResponse.content,
			});
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
