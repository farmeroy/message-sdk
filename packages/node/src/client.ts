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
	async sendMessage(text: string): Promise<Result<MessageResponse>> {
		const message: Message = { content: text, role: "user" };
		this.#messages.push(message);
		try {
			const response = await fetch(this.#url, {
				method: "POST",
				headers: [
					["x-api-key", process.env?.ANTHROPIC_API_KEY ?? ""],
					["anthropic-version", "2023-06-01"],
				],
				body: JSON.stringify({
					system: {
						type: "text",
						text: this.#systemPrompt,
					},
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
				return { ok: false, value: error.message };
			} else {
				return { ok: false, value: String(error) };
			}
		}
	}
}
