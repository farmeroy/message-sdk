// We define only a subset of what is available
// our sdk will be a basic implementaiton of the agent
export type Message = {
	content: string | ContentBlock[];
	role: Role;
};

export type Role = "assistant" | "user";

export type ContentBlock = {
	citations?: object; // not using this at the moment so type obeject is enough
	text: string;
	type: string;
};

export type MessageCreateParams = {
	role: Role;
	content: string | ContentBlock[];
};

export type AnthropicModel = "claude-haiku-4-5" | "claude-sonnet-5";

export type AnthropicMessageBody = {
	model: string;
	maxTokens: number;
	messages: Message[];
	system: ContentBlock;
};

// TODO: we only use part of the response
export type AnthropicMessageResponse = {
	id: string;
	container?: object; // TODO: not parsed now
	type: string;
	role: Role;
	content: ContentBlock[];
	model: Model | string;
	stop_reason?: string; // TODO: not parsed now
	stop_details?: object; // TODO: not parsed now
	stop_sequence?: string | null; // TODO: not parsed now
	usage?: object; // TODO: not parsed now
};

export type Model = AnthropicModel;

export type MessageResponse = AnthropicMessageResponse;

export type RawAnthropicMessageResponse = {
	id: string;
	container?: object;
	type: string;
	role: string;
	content: ContentBlock[];
	model: string;
	stop_reason?: string;
	stop_details?: object;
	stop_sequence?: string | null;
	usage?: object;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
