export const extractAgentMarkdown = (data: any): string => {
  const visited = new WeakSet();

  const search = (node: any): string | null => {
    if (!node) return null;

    // Prevent circular references
    if (typeof node === "object") {
      if (visited.has(node)) return null;
      visited.add(node);
    }

    // Direct string
    if (typeof node === "string") {
      return cleanMarkdown(node);
    }

    // Array
    if (Array.isArray(node)) {
      for (const item of node) {
        const result = search(item);
        if (result) return result;
      }
    }

    // Object
    if (typeof node === "object") {
      const priorityKeys = [
        "response",
        "text",
        "content",
        "message",
        "output",
        "result"
      ];

      for (const key of priorityKeys) {
        if (node[key]) {
          const result = search(node[key]);
          if (result) return result;
        }
      }

      // fallback: search all keys
      for (const key in node) {
        const result = search(node[key]);
        if (result) return result;
      }
    }

    return null;
  };

  const cleanMarkdown = (content: string) => {
    try {
      // detect JSON wrapped strings
      if (
        (content.startsWith("{") && content.endsWith("}")) ||
        (content.startsWith("[") && content.endsWith("]"))
      ) {
        const parsed = JSON.parse(content);
        const nested = search(parsed);
        if (nested) return nested;
      }
    } catch {}

    return content
      .replace(/\\\\/g, "\\")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .replace(/\\"/g, '"')
      .trim();
  };

  const result = search(data);

  if (result) return result;

  // absolute fallback
  return typeof data === "string"
    ? cleanMarkdown(data)
    : JSON.stringify(data, null, 2);
};
