import { Client } from "@agent-message-sdk/node";

async function main() {
	if (process.argv.length < 3) {
		console.error("missing argument: message");
		process.exitCode = 1;
		return;
	}
	const m = process.argv[2];
	const client = new Client("You are a poet");
	try {
		const response = await client.sendMessage(m);
    console.log(response);
    if (response.ok) {
		  console.log(response.value.content);
    } else {
      console.error(response.value);
    }
		return;
	} catch (e) {
		console.error(e);
	}
	return;
}

main();
