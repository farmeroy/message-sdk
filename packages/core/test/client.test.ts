import { expect, test } from "vitest";
import { Client } from "../src/client";
import { type HttpAdapter, type ContentBlock } from "../src/types";

const mockStreamResponse = async () =>
	new Response(
		new ReadableStream({
			start(controller) {
				controller.enqueue(
					new TextEncoder().encode(
						`event: content_block_delta\ndata: 
  {"type":"content_block_delta","index":0,"delta":{"type"
  :"text_delta","text":"Hello"}}\n\n`,
					),
				);
				controller.close();
			},
		}),
		{ status: 200 },
	);

const mockHttpAdapter: HttpAdapter = {
	fetch: mockStreamResponse,
	url: "https://test",
	headers: {},
};

test("streamMessage returns a content block", async () => {
	const expected = {
		type: "text",
		text: "Hello",
	};
	const result: ContentBlock[] = [];

	const client = new Client({
		httpAdapter: mockHttpAdapter,
	});
	for await (const res of client.streamMessage("hello")) {
		result.push(res);
	}
	expect(result).toContainEqual(expected);
});
