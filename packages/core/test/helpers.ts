export async function* streamable(chunks: Array<string>) {
	const encoder = new TextEncoder();
	for (const chunk of chunks) {
		yield encoder.encode(chunk);
	}
}
