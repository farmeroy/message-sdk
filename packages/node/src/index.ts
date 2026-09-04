import {createMessage} from "@agent-message-sdk/core"

const message = createMessage({role: 'user', content: "hello"})

console.log({message})
