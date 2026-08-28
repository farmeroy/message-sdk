// We define only a subset of what is available
// our sdk will be a basic implementaiton of the agent
export type Message = {
  id: string,
  content: string | ContentBlock[],
  type: "message"
  role: Role
}

export type Role = "assistant" | "user"

export type ContentBlock = {
  // citations: not implemented now
  text: string,
  type: "text"
}

export type MessageCreateParams = {
  role: Role,
  content: string | ContentBlock[]
}
