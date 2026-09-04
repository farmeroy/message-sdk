import { type MessageResponse, parseResponse } from "@agent-message-sdk/core";
import { expect, test } from "vitest";
import { fullResponseFixture } from "./test/fixtures";

test("parses full anthropic response", () => {
	const expected: MessageResponse = {
		id: "msg_013Zva2CMHLNnXjNJJKqJ2EF",
		type: "message",
		content: [{ text: "Hi! My name is Claude.", type: "text" }],
		model: "claude-sonnet-5",
		stop_reason: "end_turn",
		role: "assistant",
	};
	expect(parseResponse(fullResponseFixture)).toEqual(expected);
});
