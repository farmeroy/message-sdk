import type { RawAnthropicMessageResponse } from "../src/types";

export const emptyResponse = {};

export const noAuthRespone = {
	type: "error",
	error: {
		type: "authentication_error",
		message: "x-api-key header is required",
	},
	request_id: "req_011CeiqrRWQU9NRKGCLeXTFH",
};

export const badSystemPromptResponse = {
	type: "error",
	error: {
		type: "invalid_request_error",
		message: "system: Input should be a valid array",
	},
	request_id: "req_011CeirTTD5M9j8LbxPCir7d",
};

export const fullResponseFixture: RawAnthropicMessageResponse = {
	id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
	container: {
		id: "container_011CpZohnwH4vuy7gazohgSP",
		expires_at: "2019-12-27T18:11:19.117Z",
		skills: [
			{
				skill_id: "pdf",
				type: "anthropic",
				version: "latest",
			},
		],
	},
	content: [
		{
			citations: [
				{
					cited_text: "The grass is green. The sky is blue.",
					document_index: 0,
					document_title: "My Document",
					end_char_index: 0,
					file_id: "file_011CNha8iCJcU1wXNR6q4V8w",
					start_char_index: 0,
					type: "char_location",
				},
			],
			text: "Hi! My name is Claude.",
			type: "text",
		},
	],
	model: "claude-sonnet-5",
	role: "assistant",
	stop_details: {
		category: "cyber",
		explanation:
			"This request was declined because it conflicts with Anthropic's Usage Policy.",
		type: "refusal",
	},
	stop_reason: "end_turn",
	stop_sequence: null,
	type: "message",
	usage: {
		cache_creation: {
			ephemeral_1h_input_tokens: 0,
			ephemeral_5m_input_tokens: 0,
		},
		cache_creation_input_tokens: 2051,
		cache_read_input_tokens: 2051,
		inference_geo: "global",
		input_tokens: 2095,
		output_tokens: 503,
		output_tokens_details: {
			thinking_tokens: 0,
		},
		server_tool_use: {
			web_fetch_requests: 2,
			web_search_requests: 0,
		},
		service_tier: "standard",
	},
} as const;
