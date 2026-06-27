"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import type { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import type { Category } from "@/features/categories/types";
import type { Store } from "@/features/stores/types";
import { resizeImageFile } from "@/shared/lib/image-resize";

import { createOfferAction, updateOfferAction, uploadOfferImageAction } from "../actions";
import { offerSchema } from "../schemas";
import type { OfferWithRelations } from "../types";

type OfferFormValues = z.input<typeof offerSchema>;

type OfferFormProps = {
  offer?: OfferWithRelations;
  stores: Store[];
  categories: Category[];
};

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 16);
}

export function OfferForm({ offer, stores, categories }: OfferFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: offer?.title ?? "",
      slug: offer?.slug ?? "",
      description: offer?.description ?? "",
      store_id: offer?.store_id ?? "",
      category_id: offer?.category_id ?? "",
      redemption_type: offer?.redemption_type ?? (offer?.discount_code ? "discount_code" : "direct_link"),
      discount_type: offer?.discount_type ?? "percentage",
      discount_value: offer?.discount_value ?? 10,
      discount_code: offer?.discount_code ?? "",
      affiliate_url: offer?.affiliate_url ?? "",
      terms: offer?.terms ?? "",
      image_url: offer?.image_url ?? "",
      starts_at: toDateTimeLocal(offer?.starts_at),
      ends_at: toDateTimeLocal(offer?.ends_at),
      status: offer?.status ?? "draft",
      rank_position: offer?.rank_position ?? 100,
      is_featured: offer?.is_featured ?? false,
    },
  });

  function onSubmit(values: OfferFormValues) {
    const formData = new FormData();

    for (const [key, value] of Object.entries(values)) {
      if (typeof value === "boolean") {
        if (value) {
          formData.set(key, "on");
        }
      } else if (value !== undefined && value !== null) {
        formData.set(key, String(value));
      }
    }

    startTransition(async () => {
      const result = offer
        ? await updateOfferAction(offer.id, formData)
        : await createOfferAction(formData);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      router.push("/admin/erbjudanden");
      router.refresh();
    });
  }

  const errors = form.formState.errors;
  const redemptionType = useWatch({
    control: form.control,
    name: "redemption_type",
  });
  const imageUrl = useWatch({ control: form.control, name: "image_url" });

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError(null);

    startUpload(async () => {
      const optimized = await resizeImageFile(file, { maxDimension: 1200 });
      const uploadData = new FormData();
      uploadData.set("file", optimized);
      const result = await uploadOfferImageAction(uploadData);

      if (!result.ok || !result.url) {
        setUploadError(result.message ?? "Uppladdningen misslyckades.");
        return;
      }

      form.setValue("image_url", result.url, { shouldDirty: true });
    });

    event.target.value = "";
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      {message ? (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" {...form.register("title")} />
        {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" {...form.register("slug")} placeholder="skapas från titeln om tom" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Kort beskrivning</Label>
        <Textarea id="description" rows={4} {...form.register("description")} />
        {errors.description ? (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>Butik</Label>
          <Controller
            control={form.control}
            name="store_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj butik" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.store_id ? (
            <p className="text-sm text-destructive">{errors.store_id.message}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label>Kategori</Label>
          <Controller
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen kategori</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label>Erbjudandetyp</Label>
          <Controller
            control={form.control}
            name="redemption_type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount_code">Rabattkod</SelectItem>
                  <SelectItem value="direct_link">Direktlänk</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid gap-2">
          <Label>Rabatten anges i</Label>
          <Controller
            control={form.control}
            name="discount_type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Procent</SelectItem>
                  <SelectItem value="fixed_amount">Kronor</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="discount_value">Rabattvärde</Label>
          <Input id="discount_value" type="number" step="0.01" {...form.register("discount_value")} />
          {errors.discount_value ? (
            <p className="text-sm text-destructive">{errors.discount_value.message}</p>
          ) : null}
        </div>
      </div>

      {redemptionType === "discount_code" ? (
        <div className="grid gap-2">
          <Label htmlFor="discount_code">Rabattkod</Label>
          <Input id="discount_code" {...form.register("discount_code")} />
          {errors.discount_code ? (
            <p className="text-sm text-destructive">{errors.discount_code.message}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="affiliate_url">
          {redemptionType === "discount_code" ? "Länk efter kopierad kod" : "Direktlänk"}
        </Label>
        <Input id="affiliate_url" type="url" {...form.register("affiliate_url")} />
        {errors.affiliate_url ? (
          <p className="text-sm text-destructive">{errors.affiliate_url.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="terms">Villkor (valfritt)</Label>
        <Input
          id="terms"
          {...form.register("terms")}
          placeholder="T.ex. Vid köp över 500 kr"
        />
        {errors.terms ? (
          <p className="text-sm text-destructive">{errors.terms.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Kort villkor som visas på erbjudandet, t.ex. minsta köpbelopp.
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label>Bild på produkt eller företag (valfritt)</Label>
        <input type="hidden" {...form.register("image_url")} />
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Förhandsvisning"
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <ImagePlus className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {isUploading ? "Laddar upp..." : "Ladda upp bild"}
              </Button>
              {imageUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => form.setValue("image_url", "", { shouldDirty: true })}
                  disabled={isUploading}
                >
                  <X className="size-4" />
                  Ta bort
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP eller SVG. Max 4 MB. Visas i kortet där rabatten står.
            </p>
          </div>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleImageChange}
        />
        {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="starts_at">Startdatum</Label>
          <Input id="starts_at" type="datetime-local" {...form.register("starts_at")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ends_at">Slutdatum</Label>
          <Input id="ends_at" type="datetime-local" {...form.register("ends_at")} />
          {errors.ends_at ? (
            <p className="text-sm text-destructive">{errors.ends_at.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label>Status</Label>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Utkast</SelectItem>
                  <SelectItem value="published">Publicerad</SelectItem>
                  <SelectItem value="archived">Arkiverad</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rank_position">Ranking</Label>
          <Input id="rank_position" type="number" min={0} {...form.register("rank_position")} />
        </div>
        <label className="flex items-end gap-2 pb-3 text-sm font-medium">
          <input type="checkbox" className="size-4" {...form.register("is_featured")} />
          Utvalt erbjudande
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
        <Button type="submit" disabled={isPending || isUploading}>
          {isPending ? "Sparar..." : "Spara erbjudande"}
        </Button>
      </div>
    </form>
  );
}
