"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface DeleteAdminDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * A responsive confirmation dialog/drawer. Pass in title, description,
 * and callbacks to reuse for any entity.
 */
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  loading = false,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: DeleteAdminDialogProps) {
  const media = useMediaQuery("(min-width: 768px)");

  // Data for rendering
  const actions = [
    {
      label: cancelText,
      variant: "outline",
      handler: () => onOpenChange(false),
      disabled: loading,
    },
    {
      label: loading ? `${confirmText}...` : confirmText,
      variant: "default",
      handler: onConfirm,
      disabled: loading,
    },
  ];

  // Render for desktop dialog
  if (media.isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange} modal={true}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="space-x-2">
            {actions.map((btn, idx) => (
              <Button
                key={idx}
                variant={btn.variant as never}
                onClick={btn.handler}
                disabled={btn.disabled}
              >
                {btn.label}
              </Button>
            ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Render for mobile drawer
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex flex-col-reverse pb-6 gap-4">
          {actions.map((btn, idx) => (
            <Button
              key={idx}
              variant={btn.variant as never}
              onClick={btn.handler}
              disabled={btn.disabled}
            >
              {btn.label}
            </Button>
          ))}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
