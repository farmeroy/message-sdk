import { type MessageResponse } from "../src/types";
import { expect, test } from "vitest";
import { clean, fullResponseFixture, splitMid } from "./fixtures";
import { readEventStream, parseResponse } from "../src/parser";

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

async function* streamable(chunks: Array<string>) {
	const encoder = new TextEncoder();
	for (const chunk of chunks) {
		yield encoder.encode(chunk);
	}
}

test("parse clean stream", async () => {
	const expected = [
		{
			event: "content_block_delta",
			data: {
				type: "content_block_delta",
				index: 0,
				delta: {
					type: "text_delta",
					text: "Hello",
				},
			},
		},
	];
	const result = [];
	for await (const chunk of readEventStream(streamable(clean))) {
		result.push(chunk);
	}
	expect(result).toEqual(expected);
});

test("parse a split event stream", async () => {
	const expected = [
		{
			event: "content_block_delta",
			data: {
				type: "content_block_delta",
				index: 0,
				delta: {
					type: "text_delta",
					text: "Hello",
				},
			},
		},
	];
	const result = [];
	for await (const chunk of readEventStream(streamable(splitMid))) {
		result.push(chunk);
	}
	expect(result).toEqual(expected);
});
