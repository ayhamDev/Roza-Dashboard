/**
 * Copies a given text to the user's clipboard, with a label to indicate
 * success.
 *
 * @param {string} text The text to copy to the clipboard.
 * @param {string} label The label to display when the text is copied, e.g.
 *   "Copied to clipboard".
 */

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};
