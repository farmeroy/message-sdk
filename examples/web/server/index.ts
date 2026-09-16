import cors from "@fastify/cors";
import Fastify, { type RouteShorthandOptions } from "fastify";
import proxy from "@fastify/http-proxy";
import { createNodeClient } from "@agent-message-sdk/node";

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
		const client = createNodeClient({ systemPrompt: "be concise" });
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

// fastify.register(proxy, {
// 	upstream: "https://api.anthropic.com/v1/messages",
//   prefix: "/stream",
//   replyOptions: {
//     rewriteRequestHeaders: (_originalReq, headers) => ({
//       ...headers,
//       'X-Api-Key': process.env?.ANTHROPIC_API_KEY ?? ""
//     })
//   }
// });
//

fastify.post("/stream", async(request, reply) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request.body)
  })
  reply.header("Content-Type", "text/event-stream");
  return reply.send(res.body);
})

const start = async () => {
	try {
		await fastify.listen({ port: 8080 });
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
