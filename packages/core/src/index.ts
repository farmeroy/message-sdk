import type {
	ContentBlock,
	Message,
	MessageCreateParams,
	MessageResponse,
	Model,
	Result,
	Role,
} from "./types.ts";

export type {
	ContentBlock,
	Message,
	MessageCreateParams,
	MessageResponse,
	Model,
	Result,
	Role,
};

export function createMessage({ role, content }: MessageCreateParams): Message {
	return {
		content,
		role,
	};
}

export function parseResponse(r: any): MessageResponse {
	const parsedContent: ContentBlock[] = [];
	if (r.content && Array.isArray(r.content)) {
		r.content.forEach((block: any) => {
			if (block.type === "text") {
				parsedContent.push({ text: block?.text ?? "", type: block.type });
			}
		});
	}
	const messageResponse: MessageResponse = {
		id: r.id ?? "",
		type: r.type ?? "message",
		role: r.role ?? "assistant",
		content: parsedContent,
		model: r.model ?? "",
		stop_reason: r.stop_reason ?? "none",
	};
	return messageResponse;
}
