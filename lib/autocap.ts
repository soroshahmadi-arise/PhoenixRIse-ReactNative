function firstDiffIndex(a: string, b: string): number {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return i;
}

export function autoCapitalize(prev: string, next: string): string {
  if (next.length <= prev.length) return next;

  const diffStart = firstDiffIndex(prev, next);

  if (diffStart === 0 && next.length > 0 && /[a-z]/.test(next[0])) {
    return next[0].toUpperCase() + next.slice(1);
  }

  const before = next.slice(0, diffStart);
  const typedChar = next[diffStart];
  if (typedChar && /[a-z]/.test(typedChar) && /[.!?]\s+$/.test(before)) {
    return before + typedChar.toUpperCase() + next.slice(diffStart + 1);
  }

  return next;
}

export function autoCapitalizeStandaloneI(prev: string, next: string): string {
  if (next.length <= prev.length) return next;

  const lastChar = next[next.length - 1];
  if (!/[\s.,!?;:'"]/.test(lastChar)) return next;

  const beforeLast = next.slice(0, -1);
  if (!/(^|[^a-zA-Z])i$/.test(beforeLast)) return next;

  return beforeLast.slice(0, -1) + 'I' + lastChar;
}

export function autoCorrectText(prev: string, next: string): string {
  return autoCapitalizeStandaloneI(prev, autoCapitalize(prev, next));
}

export function capitalizeVoiceTranscript(text: string): string {
  if (!text) return text;
  let result = text[0].toUpperCase() + text.slice(1);
  result = result.replace(/([.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  result = result.replace(/(^|[^a-zA-Z])i(?=[\s.,!?;:'"]|$)/g, '$1I');
  return result;
}
