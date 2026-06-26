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

import type { Store } from "../types";

type StoreFormProps = {
  store?: Store;
  action: (formData: FormData) => void | Promise<void>;
};

export function StoreForm({ store, action }: StoreFormProps) {
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">Namn</Label>
        <Input id="name" name="name" defaultValue={store?.name} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" defaultValue={store?.slug} placeholder="skapas från namn om tom" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Beskrivning</Label>
        <Textarea id="description" name="description" defaultValue={store?.description ?? ""} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="website_url">Webbplats</Label>
          <Input id="website_url" name="website_url" type="url" defaultValue={store?.website_url ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="logo_url">Logotyp-URL</Label>
          <Input id="logo_url" name="logo_url" type="url" defaultValue={store?.logo_url ?? ""} />
        </div>
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
        <Button type="submit">Spara butik</Button>
      </div>
    </form>
  );
}
