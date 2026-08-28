import {Role, Message} from "./types";

export function createMessage(content: string, role: Role): Message {
  return {
    id: 'id',
    content,
    type: "message",
    role
  }
}
