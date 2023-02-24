export function truncateString(str: string, maxChars: number): string {
  if (str.length > maxChars) {
    return `${str.slice(0, maxChars - 3)}...`;
  }
  return str;
}

export default {
  truncateString,
};
