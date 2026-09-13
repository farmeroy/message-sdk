import {
	readEventStream,
	parseResponse,
	parseAnthropicStreamResponse,
} from "./parser";
import {
	type ContentBlock,
	type Message,
	type MessageResponse,
	type Model,
	type Result,
} from "./types";

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
	async *streamMessage(text: string): AsyncGenerator<ContentBlock> {
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
				content: ContentBlock[]; // this only handles text blocks
			} = {
				role: "assistant",
				content: [{ type: "text", text: "" }],
			};
			// we need another pipeline
			for await (const streamResponse of parseAnthropicStreamResponse(
				readEventStream(response.body),
			)) {
				yield streamResponse;
				aggregateResponse.content[0].text += streamResponse.text;
			}
			this.#messages.push(aggregateResponse);
			console.log(this.#messages);
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
