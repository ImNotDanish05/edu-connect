"use client";

import { Bookmark } from "lucide-react";
import { Button, IconButton, toast, cn } from "@open-lms/ui";
import { useToggleSaveOpportunity } from "@/lib/educonnect/hooks";

export function BookmarkToggle({
  slugOrId,
  saved,
  title,
  variant = "icon",
  className,
}: {
  slugOrId: string;
  saved: boolean;
  title?: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const toggle = useToggleSaveOpportunity();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle.mutate(slugOrId, {
      onSuccess: (res) => {
        toast.success({
          title: res.saved ? "Disimpan ke Peluang Tersimpan" : "Dihapus dari Peluang Tersimpan",
          description: title,
        });
      },
    });
  };

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant={saved ? "secondary" : "outline"}
        onClick={handleClick}
        loading={toggle.isPending}
        data-testid="bookmark-toggle-btn"
        className={className}
      >
        <Bookmark className={cn("size-4", saved && "fill-current text-primary")} />
        <span>{saved ? "Tersimpan" : "Simpan Peluang"}</span>
      </Button>
    );
  }

  return (
    <IconButton
      label={saved ? "Hapus dari simpanan" : "Simpan peluang"}
      variant="ghost"
      size="sm"
      onClick={handleClick}
      data-testid="bookmark-toggle"
      className={cn(saved ? "text-primary" : "text-muted-foreground hover:text-foreground", className)}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} />
    </IconButton>
  );
}
