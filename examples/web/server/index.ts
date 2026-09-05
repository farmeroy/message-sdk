import { Client } from "@agent-message-sdk/node";
import Fastify from 'fastify'


const fastify = Fastify({
  logger: true
})

fastify.get('/health', function (_request, reply) {
  reply.send("healthy")
})

fastify.post('/', async function (request, reply) {
  const clientMessage: string = request.body.message;
  const client = new Client("be concise");
  try {
    const clientResponse = await client.sendMessage(clientMessage);
    const text = clientResponse.value.content[0].text;
    reply
      .code(200)
      .send(text);
  } catch (e) {
    reply
      .code(500)
      .send({error: e})
  }
})

fastify.listen({port: 8080}, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`server listening on ${address}`)
})
