import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DialogProps } from "@radix-ui/react-dialog";
import React from "react";

const UpdateClientSheet = (
  props: React.ComponentProps<React.FC<DialogProps>>
) => {
  const IsMobile = useIsMobile();
  if (IsMobile) {
  }
  return (
    <Sheet {...props}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Are you absolutely sure?</SheetTitle>
          <SheetDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

export default UpdateClientSheet;
