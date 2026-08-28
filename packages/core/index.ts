import {Role, Message, ContentBlock, MessageCreateParams} from "./types";

export {
  Role,
  Message,
  ContentBlock,
  MessageCreateParams
}


export function createMessage(content: string, role: Role): Message {
  return {
    id: 'id',
    content,
    type: "message",
    role
  }
}
