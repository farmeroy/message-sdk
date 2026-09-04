import type {Role, Message, ContentBlock, MessageCreateParams, MessageResponse, Result, Model} from "./types.ts";

export type {
  Role,
  Message,
  ContentBlock,
  MessageCreateParams,
  MessageResponse,
  Result,
  Model
}


export function createMessage({role, content}: MessageCreateParams): Message {
  return {
    content,
    role
  }
}
