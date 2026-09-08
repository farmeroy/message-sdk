import { Client } from "@agent-message-sdk/node";
import readline from "node:readline";

async function main() {
	if (process.argv.length < 3) {
		console.error("missing argument: message");
		process.exitCode = 1;
		return;
	}
	if (process.argv[2] === "chat") {
		const client = new Client("you are a helpful and creative soul");
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		const prompt = (q) => new Promise((resolve) => rl.question(q, resolve));
		while (true) {
			try {
				const input = await prompt("> ");
				if (input === "exit") {
					rl.close();
					return;
				}
				rl.pause();

				for await (const delta of client.streamMessage(input)) {
					if (delta.event == "content_block_delta") {
						rl.output.write(delta.data.delta.text);
					}
				}
				process.stdout.write("\n");
				rl.resume();
			} catch (e) {
				console.error(e);
			}
		}
	} else {
		const m = process.argv[2];
		const client = new Client("You are a poet");
		try {
			const response = await client.sendMessage(m);
			console.log(response);
			if (response.ok) {
				console.log(response.value.content);
			} else {
				console.error(response.error);
			}
		} catch (e) {
			console.error(e);
		}
	}
}

main();
