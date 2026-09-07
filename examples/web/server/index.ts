import { Client } from "@agent-message-sdk/node";
import cors from "@fastify/cors";
import Fastify, { type RouteShorthandOptions } from "fastify";

const fastify = Fastify({
	logger: true,
});

fastify.register(cors, {
	origin: true,
	// origin: (origin, cb) => {
	// 	if (!origin) {
	// 		cb(new Error("no origin"), false);
	// 		return;
	// 	}
	// 	const hostname = new URL(origin).hostname;
	// 	if (hostname === "localhost") {
	// 		cb(null, true);
	// 		return;
	// 	}
	// 	cb(new Error("Not allowed"), false);
	// },
});

fastify.get("/health", async (_request, reply) => {
	reply.send("healthy");
});

const opts: RouteShorthandOptions = {
	schema: {
		body: {
			type: "object",
			properties: {
				message: { type: "string" },
			},
		},
	},
};

fastify.post<{ Body: { message: string } }>(
	"/",
	opts,
	async (request, reply) => {
		const clientMessage: string = request.body.message;
		const client = new Client("be concise");
		try {
			const clientResponse = await client.sendMessage(clientMessage);
			if (clientResponse.ok) {
				const { text } = clientResponse.value.content[0];
				reply.code(200).send(text);
			} else {
				const { error } = clientResponse;
				reply.code(400).send({ error });
			}
		} catch (e) {
			reply.code(500).send({ error: e });
		}
	},
);

const start = async () => {
	try {
		await fastify.listen({ port: 8080 });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
