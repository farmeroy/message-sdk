import type {
	AnthropicStreamEvent,
	ContentBlock,
	MessageResponse,
	RawAnthropicMessageResponse,
	Role,
} from "./types.ts";

// TODO: this should probably return a result type so the caller knows if response was malformed/empty
// rather than sending back a default response
// this also makes me wonder, should the MessageResponse be a class we can instantiate?
// we could then create a default response and use that at the caller if the parsing fails?
// lots of design possibilities here
// TODO: we aren't really parsing, just passing through
export function parseResponse(r: RawAnthropicMessageResponse): MessageResponse {
	console.log({ r });
	const parsedContent: ContentBlock[] = [];
	if (r.content && Array.isArray(r.content)) {
		r.content.forEach((block) => {
			if (block.type === "text") {
				parsedContent.push({ text: block?.text ?? "", type: block.type });
			}
		});
	}
	const messageResponse: MessageResponse = {
		id: r.id ?? "",
		type: r.type ?? "message",
		role: (r.role as Role) ?? "assistant", // TODO parse the role or return parse error
		content: parsedContent,
		model: r.model ?? "",
		stop_reason: r.stop_reason ?? "none",
	};
	return messageResponse;
}

// TODO read https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events
// this parser is specific to the events defined in anthropic v1 messages api
export async function* parseSSEStream(
	body: AsyncIterable<Uint8Array<ArrayBuffer>>,
): AsyncGenerator<AnthropicStreamEvent> {
	const textDecoder = new TextDecoder("utf-8");
	let buffer = "";
	for await (const chunk of body) {
		// we need to accumulate chunks into buffer until we have a complete event
		const text = textDecoder.decode(chunk, { stream: true });
		// accumulate the decoded text
		buffer += text;
		// complete events are separated by two new lines
		// while there is \n\n in the buffer we need to process events
		while (buffer.indexOf("\n\n") > -1) {
			// everything until the double new line is a single complete event
			const [completeData, rest] = splitOnce(buffer, "\n\n");
			// send the rest to the buffer
			buffer = rest;
			// event and data are separated by a new line char
			// anthropic only sends event and data fields
			// this does not implement the mime type correctly
			const lines = splitOnce(completeData, "\n");
			const event = splitOnce(lines[0], ":");
			const data = splitOnce(lines[1], ":");
			// generic event-stream data isn't always valid json so this should be handled differently
			yield { event: event[1].trim(), data: JSON.parse(data[1]) };
		}
	}
}

function splitOnce(s: string, c: string): Array<string> {
	const index = s.indexOf(c);
	if (index < 0) return [];
	return [s.substring(0, index), s.substring(index + c.length)];
}
