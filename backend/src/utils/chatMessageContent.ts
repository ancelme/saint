export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
}

interface StoredChatEnvelope {
  type: 'school-chat-message';
  version: 1;
  text: string;
  attachments: ChatAttachment[];
}

export function encodeChatMessage(text: string, attachments: ChatAttachment[]) {
  if (attachments.length === 0) return text;
  const envelope: StoredChatEnvelope = {
    type: 'school-chat-message',
    version: 1,
    text,
    attachments,
  };
  return JSON.stringify(envelope);
}

export function decodeChatMessage(value: string): { body: string; attachments: ChatAttachment[] } {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'type' in parsed &&
      parsed.type === 'school-chat-message' &&
      'version' in parsed &&
      parsed.version === 1 &&
      'text' in parsed &&
      typeof parsed.text === 'string' &&
      'attachments' in parsed &&
      Array.isArray(parsed.attachments)
    ) {
      return { body: parsed.text, attachments: parsed.attachments as ChatAttachment[] };
    }
  } catch {
    return { body: value, attachments: [] };
  }
  return { body: value, attachments: [] };
}

export function getChatMessagePreview(value: string) {
  const { body, attachments } = decodeChatMessage(value);
  if (body) return body;
  if (attachments.length === 0) return '';
  return attachments.length === 1 ? `📎 ${attachments[0].name}` : `📎 ${attachments.length} attachments`;
}
