// We define only a subset of what is available
// our sdk will be a basic implementaiton of the agent
export type Message = {
	content: string | ContentBlock[];
	role: Role;
};

export type Role = "assistant" | "user";

export type ContentBlock = {
  citations: object; // not using this at the moment so type obeject is enough
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
  container: object;
	type: string;
	role: "assistant";
	content: ContentBlock[];
	model: Model;
  stop_reason: string;
  stop_details: object;
  stop_sequence: string | null;
  usage: object;
};

export type Model = AnthropicModel;

export type MessageResponse = AnthropicMessageResponse;
export type RawAnthropicMessageResponse = AnthropicMessageResponse;

export type Result<T> = 
  | {ok: true; value: T}
  | {ok: false; error: string}
