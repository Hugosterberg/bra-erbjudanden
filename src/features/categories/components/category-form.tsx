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

import type { Category } from "../types";

type CategoryFormProps = {
  category?: Category;
  action: (formData: FormData) => void | Promise<void>;
};

export function CategoryForm({ category, action }: CategoryFormProps) {
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">Namn</Label>
        <Input id="name" name="name" defaultValue={category?.name} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" defaultValue={category?.slug} placeholder="skapas från namn om tom" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Beskrivning</Label>
        <Textarea id="description" name="description" defaultValue={category?.description ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label>Status</Label>
        <Select name="status" defaultValue={category?.status ?? "active"}>
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
        <Button type="submit">Spara kategori</Button>
      </div>
    </form>
  );
}
