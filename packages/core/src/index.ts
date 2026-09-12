import type {
	AnthropicStreamResponse,
	ContentBlock,
	Message,
	MessageCreateParams,
	MessageResponse,
	Model,
	Result,
	Role,
} from "./types.ts";

import { Client } from "./client.js";

export { Client };

export type {
	AnthropicStreamResponse,
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
