export function analyze(text) {
  if (!text || typeof text !== 'string') {
    return { wordCount: 0, error: 'Invalid input' };
  }

  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);

  return {
    wordCount: words.length,
    characterCount: text.length,
    lineCount: text.split('\n').length
  };
}

if (typeof self !== 'undefined') {
  self.addEventListener('message', (event) => {
    const result = analyze(event.data.text);
    self.postMessage(result);
  });
}
