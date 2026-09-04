import type {
	ContentBlock,
	Message,
	MessageCreateParams,
	MessageResponse,
	Model,
	RawAnthropicMessageResponse,
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

// just a simple function made for initially testing commonjs/module support
export function createMessage({ role, content }: MessageCreateParams): Message {
	return {
		content,
		role,
	};
}

// TODO: this should probably return a result type so the caller knows if response was malformed/empty
// rather than sending back a default response
// this also makes me wonder, should the MessageResponse be a class we can instantiate?
// we could then create a default response and use that at the caller if the parsing fails?
// lots of design possibilities here
export function parseResponse(r: RawAnthropicMessageResponse): MessageResponse {
	const parsedContent: ContentBlock[] = [];
	if (r.content && Array.isArray(r.content)) {
		r.content.forEach((block) => {
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
