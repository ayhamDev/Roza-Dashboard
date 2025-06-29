export const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
};
