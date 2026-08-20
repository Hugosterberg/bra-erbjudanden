import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/features/categories/types";

import type { Product } from "../types";

type ProductFormProps = {
  product?: Product;
  categories: Category[];
  action: (formData: FormData) => void | Promise<void>;
};

export function ProductForm({ product, categories, action }: ProductFormProps) {
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">Namn</Label>
        <Input id="name" name="name" defaultValue={product?.name} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={product?.slug} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="brand">Varumärke</Label>
          <Input id="brand" name="brand" defaultValue={product?.brand ?? ""} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="category_id">Kategori</Label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={product?.category_id ?? ""}
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Ingen</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Beskrivning</Label>
        <Textarea id="description" name="description" defaultValue={product?.description ?? ""} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="image_url">Bild-URL</Label>
          <Input id="image_url" name="image_url" type="url" defaultValue={product?.image_url ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product_url">Produkt-URL</Label>
          <Input
            id="product_url"
            name="product_url"
            type="url"
            defaultValue={product?.product_url ?? ""}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="current_price">Känt pris (valfritt)</Label>
        <Input
          id="current_price"
          name="current_price"
          type="number"
          step="0.01"
          defaultValue={product?.current_price ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="specifications">Specifikationer (JSON-objekt)</Label>
        <Textarea
          id="specifications"
          name="specifications"
          defaultValue={
            product?.specifications
              ? JSON.stringify(product.specifications, null, 2)
              : ""
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={product?.status ?? "active"}
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
        >
          <option value="active">Aktiv</option>
          <option value="inactive">Inaktiv</option>
          <option value="archived">Arkiverad</option>
        </select>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Spara produkt</Button>
      </div>
    </form>
  );
}
