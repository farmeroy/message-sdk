<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue";
import { ref } from "vue";
import { Client, type ClientMessageStore, type HttpAdapter, type Message } from "@agent-message-sdk/core";

const messages = ref<Message[]>([]);

const messageStore: ClientMessageStore = {
push(message) {messages.value.push(message)},
getAll() {
  return messages.value 
}
}

const httpAdapter: HttpAdapter = {
url: "http://localhost:8080/stream",
headers: {
  "anthropic-version": "2023-06-01",
  "content-type": "application/json"
}
}

const client = new Client({systemPrompt: "you are a robot", httpAdapter, messageStore })

const input = ref("");
const loading = ref(false);
const streamText = ref("");

async function sendMessage() {
	const text = input.value.trim();
	if (!text || loading.value) return;

	input.value = "";
	loading.value = true;

	try {
   for await (const res of client.streamMessage(text)) {
    streamText.value += res.text
   }
	} catch (e) {
		console.error({ e });
		messages.value.push({
			role: "assistant",
			content: "Error: request failed",
		});
	} finally {
		loading.value = false;
    streamText.value = "";
	}
}

function getDisplayText(msg: Message): string {
	if (typeof msg.content === "string") return msg.content;
	return msg.content.map((b) => b.text).join("");
}
</script>

<template>
  <header>
    <div class="wrapper">
      <HelloWorld msg="Message SDK" />
    </div>
  </header>

  <main>
    <h2>chat</h2>
    <div>
      <p v-for="(msg, i) in messages" :key="i">
        {{ msg.role }}: {{ getDisplayText(msg) }}
      </p>
      <p>{{streamText }}</p>
    </div>
    <form @submit.prevent="sendMessage">
      <textarea v-model="input" :disabled="loading"></textarea>
      <button :disabled="loading">{{ loading ? 'Sending...' : 'Send' }}</button>
    </form>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
