import { createMessage } from "@agent-message-sdk/core";

function main() {
	if (process.argv.length < 3) {
		console.error("missing argument: message");
		process.exitCode = 1;
		return;
	}
	const m = process.argv[2];
	const message = createMessage({ role: "user", content: m });
	console.log({ message });
}

main();
