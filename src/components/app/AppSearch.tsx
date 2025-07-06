"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchWithDebounceProps {
  onSearchChange: (search: string) => void;
  placeholder?: string;
  initialValue?: string;
  delay?: number;
}

export function SearchWithDebounce({
  onSearchChange,
  placeholder = "Search...",
  initialValue = "",
  delay = 300,
}: SearchWithDebounceProps) {
  // Local state for immediate UI updates
  const [searchTerm, setSearchTerm] = useState(initialValue);

  // Debounced value for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  // Call the callback when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearchChange]);

  // Update local state when initial value changes (for URL sync)
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 h-12"
      />
      {/* Show loading indicator when search is different from debounced search */}
      {searchTerm !== debouncedSearchTerm && searchTerm && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
