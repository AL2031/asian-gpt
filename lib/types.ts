export type Role = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  image?: string; // data URL - either an upload attached by the user, or a generated/edited result
  kind?: "text" | "generated-image" | "edited-image";
  pending?: boolean;
}
