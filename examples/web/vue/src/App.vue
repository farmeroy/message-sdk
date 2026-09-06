<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import { ref } from 'vue';
import { type Message } from '@agent-message-sdk/core';

const messages = ref<Message[]>([]);
const input = ref('');
const loading = ref(false);

async function sendMessage() {
  const text = input.value.trim();
  if (!text || loading.value) return;

  messages.value.push({ role: 'user', content: text });
  input.value = '';
  loading.value = true;

  try {
    const res = await fetch('http://localhost:8080/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    const reply = await res.text();
    messages.value.push({ role: 'assistant', content: reply });
  } catch (e) {
    console.error({e});
    messages.value.push({ role: 'assistant', content: 'Error: request failed' });
  } finally {
    loading.value = false;
  }
}

function getDisplayText(msg: Message): string {
  if (typeof msg.content === 'string') return msg.content;
  return msg.content.map(b => b.text).join('');
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
