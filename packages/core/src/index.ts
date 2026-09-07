import type {
	ContentBlock,
	Message,
	MessageCreateParams,
	MessageResponse,
	Model,
	Result,
	Role,
} from "./types.ts";

import {parseResponse, parseSSEStream} from "./parser.js";

export {parseResponse, parseSSEStream};


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
