"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resizeImageFile } from "@/shared/lib/image-resize";
import { StoreLogo } from "@/shared/ui/store-logo";

import { uploadStoreLogoAction } from "../actions";
import type { Store } from "../types";

type StoreFormProps = {
  store?: Store;
  action: (formData: FormData) => void | Promise<void>;
};

export function StoreForm({ store, action }: StoreFormProps) {
  const [name, setName] = useState(store?.name ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(store?.website_url ?? "");
  const [logoUrl, setLogoUrl] = useState(store?.logo_url ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError(null);

    startUpload(async () => {
      const optimized = await resizeImageFile(file, { maxDimension: 512 });
      const formData = new FormData();
      formData.set("file", optimized);
      const result = await uploadStoreLogoAction(formData);

      if (!result.ok || !result.url) {
        setUploadError(result.message ?? "Uppladdningen misslyckades.");
        return;
      }

      setLogoUrl(result.url);
    });

    event.target.value = "";
  }

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">Namn</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" defaultValue={store?.slug} placeholder="skapas från namn om tom" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Beskrivning</Label>
        <Textarea id="description" name="description" defaultValue={store?.description ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="website_url">Webbplats</Label>
        <Input
          id="website_url"
          name="website_url"
          type="url"
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
          placeholder="https://exempel.se"
        />
      </div>

      <div className="grid gap-2">
        <Label>Logotyp</Label>
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <StoreLogo name={name || "?"} logoUrl={logoUrl} websiteUrl={websiteUrl} size="lg" />
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {isUploading ? "Laddar upp..." : "Ladda upp bild"}
              </Button>
              {logoUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogoUrl("")}
                  disabled={isUploading}
                >
                  <X className="size-4" />
                  Ta bort
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP eller SVG. Max 2 MB. Lämnas detta tomt används butikens favicon.
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
          className="hidden"
          onChange={handleFileChange}
        />
        {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="logo_url">Logotyp-URL (valfritt)</Label>
        <Input
          id="logo_url"
          name="logo_url"
          type="url"
          value={logoUrl}
          onChange={(event) => setLogoUrl(event.target.value)}
          placeholder="Fylls i automatiskt vid uppladdning"
        />
      </div>

      <div className="grid gap-2">
        <Label>Status</Label>
        <Select name="status" defaultValue={store?.status ?? "active"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="inactive">Inaktiv</SelectItem>
            <SelectItem value="archived">Arkiverad</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isUploading}>
          Spara butik
        </Button>
      </div>
    </form>
  );
}
