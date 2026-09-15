import { AuthenticationError } from "@agent-message-sdk/core";
import { createNodeClient } from "@agent-message-sdk/node";
import readline from "node:readline";

async function main() {
	if (process.argv.length < 3) {
		console.error("missing argument: message");
		process.exitCode = 1;
		return;
	}
	if (process.argv[2] === "chat") {
		const client = createNodeClient({
			systemPrompt: "you are a helpful and creative soul",
		});
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		const prompt = (q: string) =>
			new Promise<string>((resolve) => rl.question(q, resolve));
		while (true) {
			try {
				const input = await prompt("> ");
				if (input === "exit") {
					rl.close();
					return;
				}
				rl.pause();
				process.stdout.write("\n");

				// here we will have to manually handle each event
				// this is good if the application has to do custom things,
				// but maybe it makes sense to pass the stream or read method a writer to write to?
				// or call client.display(stream)?
				for await (const delta of client.streamMessage(input)) {
					if (delta.type === "text") {
						process.stdout.write(delta.text);
					} else if (delta.type === "error") {
						process.stdout.write("Error: " + delta.text);
					}
				}

				process.stdout.write("\n");
				rl.resume();
			} catch (e) {
				if (e instanceof AuthenticationError) {
					process.stdout.write(e.message + "\n");
					process.stdout.write("Is your ANTHROPIC_API_KEY correct?\n");
				} else {
					if (e instanceof Error) {
						console.log(e.message);
					} else {
						console.error(e);
					}
				}
			}
		}
	} else {
		const m = process.argv[2];
		const client = createNodeClient({ systemPrompt: "You are a poet" });
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
