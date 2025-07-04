"use client";

import { Mention, MentionsInput } from "react-mentions";
import { cn } from "@/lib/utils";

interface MentionData {
  id: string | number;
  display: string;
}

interface MentionsTextareaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  mentions?: MentionData[];
  className?: string;
  rows?: number;
}

const defaultMentions: MentionData[] = [
  { id: "name", display: "name" },
  { id: "firstName", display: "firstName" },
  { id: "lastName", display: "lastName" },
  { id: "email", display: "email" },
  { id: "company", display: "company" },
  { id: "phone", display: "phone" },
  { id: "address", display: "address" },
  { id: "date", display: "date" },
  { id: "time", display: "time" },
];

export function MentionsTextarea({
  value = "",
  onChange,
  placeholder = "Type your message...",
  mentions = defaultMentions,
  className,
  rows = 4,
}: MentionsTextareaProps) {
  const handleChange = (_: any, newValue: string) => {
    onChange?.(newValue);
  };

  // shadcn textarea styles
  const textareaStyles = {
    control: {
      backgroundColor: "transparent",
      fontSize: "14px",
      fontWeight: "normal",
      border: "1px solid hsl(var(--border))",
      borderRadius: "calc(var(--radius) - 2px)",
      padding: "12px",
      minHeight: `${rows * 1.5 + 1.5}rem`,
      fontFamily:
        'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      lineHeight: "1.5",
      resize: "vertical" as const,
      transition: "border-color 0.2s",
    },
    "&multiLine": {
      control: {
        fontFamily:
          'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        minHeight: `${rows * 1.5 + 1.5}rem`,
      },
      highlighter: {
        padding: "12px",
        border: "1px solid transparent",
        borderRadius: "calc(var(--radius) - 2px)",
        fontSize: "14px",
        lineHeight: "1.5",
        fontFamily:
          'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      },
      input: {
        padding: "12px",
        border: "none",
        outline: "none",
        fontSize: "14px",
        lineHeight: "1.5",
        fontFamily:
          'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        resize: "vertical" as const,
        minHeight: `${rows * 1.5 + 1.5}rem`,
      },
    },
    suggestions: {
      list: {
        backgroundColor: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "calc(var(--radius) - 2px)",
        fontSize: "14px",
        boxShadow:
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        maxHeight: "200px",
        overflowY: "auto" as const,
      },
      item: {
        padding: "8px 12px",
        borderBottom: "1px solid hsl(var(--border))",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        "&focused": {
          backgroundColor: "hsl(var(--accent))",
        },
      },
    },
  };

  const mentionStyle = {
    backgroundColor: "hsl(var(--primary) / 0.1)",
    color: "hsl(var(--primary))",
    padding: "2px 4px",
    borderRadius: "4px",
    fontWeight: "500",
    border: "1px solid hsl(var(--primary) / 0.2)",
  };

  return (
    <div className={cn("relative", className)}>
      <MentionsInput
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={textareaStyles}
        className="mentions-input"
        allowSpaceInQuery
      >
        <Mention
          trigger="{"
          data={mentions}
          style={mentionStyle}
          displayTransform={(id: string) => `{${id}}`}
          markup="{__display__}"
          appendSpaceOnAdd={false}
          renderSuggestion={(suggestion: any) => (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                {suggestion.display}
              </span>
              <span className="text-sm text-gray-900">
                {suggestion.display}
              </span>
            </div>
          )}
        />
      </MentionsInput>

      <style>{`
        .mentions-input {
          width: 100%;
        }
        
        .mentions-input:focus-within {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }
        
        .mentions-input textarea:focus {
          outline: none;
        }
        
        .mentions-input__control:focus-within {
          border-color: hsl(var(--ring));
        }
        
        .mentions-input__suggestions__item--focused {
          background-color: hsl(var(--accent)) !important;
        }
      `}</style>
    </div>
  );
}
