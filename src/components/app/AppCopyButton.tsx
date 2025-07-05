import { copyToClipboard } from "@/lib/copyToClipboard";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

const AppCopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000); // 2 seconds
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("h-6 w-6 ml-auto", copied && "pointer-events-none")}
      title="Copy"
      onClick={handleClick}
    >
      {copied ? <Check size={16} className="text-green-300" /> : <Copy />}
    </Button>
  );
};

export default AppCopyButton;
