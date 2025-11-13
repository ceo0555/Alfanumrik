export interface NewInteractionEvent {
  userId?: string;
  profileId?: number;
  sessionId?: string;
  eventType: string;
  contentId?: string;
  skillIds?: string[];
  success?: boolean;
  score?: number;
  durationMs?: number;
  payload?: Record<string, unknown>;
  occurredAt?: string;
}

export interface InteractionEvent extends NewInteractionEvent {
  id: string;
  createdAt: string;
}
