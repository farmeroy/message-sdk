import type {
	AnthropicStreamResponse,
	ClientConfig,
	ContentBlock,
	HttpAdapter,
	Message,
	MessageCreateParams,
	MessageResponse,
	Model,
	Result,
	Role,
} from "./types.ts";

import { Client } from "./client";

export * from "./errors";

export { Client };

export type {
	AnthropicStreamResponse,
	ClientConfig,
	ContentBlock,
	HttpAdapter,
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
