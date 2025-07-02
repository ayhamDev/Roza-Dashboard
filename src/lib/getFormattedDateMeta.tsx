// utils/date-meta.ts
import { parseISO, format, formatDistanceToNow } from "date-fns";

export function getFormattedDateMeta(timestamp: string) {
  const date = parseISO(timestamp);

  return {
    full: format(date, "yyyy-MM-dd hh:mm a").toLowerCase(),
    relative: `${formatDistanceToNow(date)} ago`,
    iso: date.toISOString(),
  };
}
