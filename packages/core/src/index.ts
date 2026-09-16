import type {
	AnthropicStreamResponse,
  ClientConfig,
  ClientMessageStore,
	ContentBlock,
	HttpAdapter,
	Message,
	MessageCreateParams,
	MessageResponse,
	Model,
	Result,
	Role,
} from "./types.ts";

import { Client, InMemoryMessageStore } from "./client";

export * from "./errors";

export { Client, InMemoryMessageStore };

export type {
	AnthropicStreamResponse,
  ClientConfig,
  ClientMessageStore,
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
