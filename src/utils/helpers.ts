/**
 * Escapes special characters for Telegram's MarkdownV2 format
 * @param text The text to escape
 * @returns Escaped text safe for MarkdownV2
 */
export function escapeMarkdown(text: string): string {
  // Characters that need to be escaped in MarkdownV2:
  // '_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'
  return text.replace(/([_*[\]()~`>#+=|{}.!\\])/g, '\\$1').replace(/•/g, '\\•'); // Additional character commonly used in output
}
