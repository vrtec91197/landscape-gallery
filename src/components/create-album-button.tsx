"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateAlbumButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      setName("");
      setDescription("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to create album:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Album</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Album</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="album-name">Name</Label>
              <Input
                id="album-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mountain Landscapes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="album-desc">Description (optional)</Label>
              <Textarea
                id="album-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A collection of mountain photos..."
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!name.trim() || loading}
            >
              {loading ? "Creating..." : "Create Album"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
