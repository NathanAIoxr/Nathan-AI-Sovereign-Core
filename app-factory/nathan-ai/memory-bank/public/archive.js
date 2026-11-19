const archiveCategory = 'chatgpt-history';

function orderedMessages(conversation) {
  const mapping = conversation.mapping;
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) return [];
  let id = conversation.current_node;
  if (!Object.hasOwn(mapping, id)) {
    const leaves = Object.keys(mapping).filter(key => !mapping[key]?.children?.length);
    leaves.sort((a, b) => (mapping[b]?.message?.create_time ?? 0) - (mapping[a]?.message?.create_time ?? 0));
    id = leaves[0];
  }
  const chain = [];
  const seen = new Set();
  while (typeof id === 'string' && Object.hasOwn(mapping, id) && !seen.has(id)) {
    seen.add(id);
    const node = mapping[id];
    if (!node || typeof node !== 'object') break;
    const message = node.message;
    if (message && ['user', 'assistant'].includes(message.author?.role)
      && !message.metadata?.is_visually_hidden_from_conversation
      && Array.isArray(message.content?.parts)) {
      const content = message.content.parts.map(part => typeof part === 'string' ? part : part?.text)
        .filter(part => typeof part === 'string').join('\n');
      if (content.trim()) chain.push({ id, role: message.author.role, time: message.create_time, content });
    }
    id = node.parent;
  }
  return chain.reverse();
}

export function availableChats(data) {
  const chats = Array.isArray(data) ? data : data?.conversations;
  if (!Array.isArray(chats)) throw new Error('Choose the conversations JSON from your ChatGPT export.');
  const byId = new Map();
  for (const chat of chats) {
    const id = chat?.id ?? chat?.conversation_id;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,128}$/.test(id) || byId.has(id)) continue;
    const title = typeof chat.title === 'string' ? chat.title.trim().slice(0, 170) : '';
    const messages = orderedMessages(chat);
    if (messages.length) byId.set(id, { id, title: title || 'Untitled conversation', messages });
  }
  return [...byId.values()];
}

function* messageParts(content) {
  let cursor = 0;
  while (cursor < content.length) {
    let end = Math.min(cursor + 12000, content.length);
    if (end < content.length && /[\uD800-\uDBFF]/.test(content.charAt(end - 1))) end--;
    const part = content.slice(cursor, end);
    if (part.trim()) yield part;
    cursor = end;
  }
}

export function* chatEntries(chats) {
  for (const { id, title, messages } of chats) {
    for (const [index, message] of messages.entries()) {
      const created = typeof message.time === 'number' ? new Date(message.time * 1000) : null;
      const date = created && Number.isFinite(created.getTime()) ? created.toISOString() : '';
      const turn = index + 1;
      let fragment = 0;
      for (const content of messageParts(message.content)) {
        fragment++;
        const recordTitle = `${title} (${message.role} ${turn}${fragment > 1 ? '.' + fragment : ''})`;
        yield {
          category: archiveCategory,
          title: recordTitle,
          content,
          tags: ['ChatGPT transcript', `conversation ${id}`, date].filter(Boolean).join(', '),
          source_ai: 'ChatGPT'
        };
      }
    }
  }
}

export async function importChatEntries(chats, send) {
  let rows = [];
  let size = 0;
  let saved = 0;
  let duplicates = 0;
  const encoder = new TextEncoder();
  async function flush() {
    if (!rows.length) return;
    const result = await send({ entries: rows });
    saved += result.saved;
    duplicates += result.duplicates;
    rows = [];
    size = 0;
  }
  for (const row of chatEntries(chats)) {
    const bytes = encoder.encode(JSON.stringify(row)).byteLength + 1;
    if (rows.length === 40 || size + bytes > 490 * 1024) await flush();
    rows.push(row);
    size += bytes;
  }
  await flush();
  return { saved, duplicates };
}
