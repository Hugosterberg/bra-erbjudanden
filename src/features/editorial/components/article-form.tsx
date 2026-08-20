import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/features/categories/types";
import type { Product } from "@/features/products/types";
import type { Store } from "@/features/stores/types";

import { METHODOLOGY_LABELS } from "../methodology";
import { ARTICLE_TYPE_LABELS, type ArticleWithRelations } from "../types";

type ArticleFormProps = {
  article?: ArticleWithRelations;
  categories: Category[];
  stores: Store[];
  products: Product[];
  action: (formData: FormData) => void | Promise<void>;
};

export function ArticleForm({
  article,
  categories,
  stores,
  products,
  action,
}: ArticleFormProps) {
  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="article_type">Typ</Label>
          <select
            id="article_type"
            name="article_type"
            defaultValue={article?.article_type ?? "guide"}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            {Object.entries(ARTICLE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="methodology">Metod</Label>
          <select
            id="methodology"
            name="methodology"
            defaultValue={article?.methodology ?? "editorial_evaluation"}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            {Object.entries(METHODOLOGY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="title">Titel</Label>
        <Input id="title" name="title" defaultValue={article?.title} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" defaultValue={article?.slug} placeholder="skapas från titel om tom" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="excerpt">Ingress</Label>
        <Textarea id="excerpt" name="excerpt" defaultValue={article?.excerpt ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="body">Brödtext</Label>
        <Textarea id="body" name="body" rows={12} defaultValue={article?.body} required />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="category_id">Kategori</Label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={article?.category_id ?? ""}
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
          <Label htmlFor="store_id">Butik</Label>
          <select
            id="store_id"
            name="store_id"
            defaultValue={article?.store_id ?? ""}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Ingen</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product_id">Produkt (för recension)</Label>
          <select
            id="product_id"
            name="product_id"
            defaultValue={article?.product_id ?? ""}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Ingen</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="author_name">Författare</Label>
          <Input
            id="author_name"
            name="author_name"
            defaultValue={article?.author_name ?? "braerbjudanden.se"}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="editorial_score">Redaktionellt betyg (0–10)</Label>
          <Input
            id="editorial_score"
            name="editorial_score"
            type="number"
            step="0.1"
            min={0}
            max={10}
            defaultValue={article?.editorial_score ?? ""}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="verdict">Omdöme</Label>
        <Textarea id="verdict" name="verdict" defaultValue={article?.verdict ?? ""} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="pros">Plus (en per rad)</Label>
          <Textarea id="pros" name="pros" defaultValue={article?.pros.join("\n") ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cons">Minus (en per rad)</Label>
          <Textarea id="cons" name="cons" defaultValue={article?.cons.join("\n") ?? ""} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="best_for">Passar dig som</Label>
          <Textarea id="best_for" name="best_for" defaultValue={article?.best_for ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="not_best_for">Passar mindre bra om</Label>
          <Textarea
            id="not_best_for"
            name="not_best_for"
            defaultValue={article?.not_best_for ?? ""}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="compared_products">Jämförda produkter (JSON, för Bäst i test)</Label>
        <Textarea
          id="compared_products"
          name="compared_products"
          rows={10}
          defaultValue={
            article?.compared.length
              ? JSON.stringify(article.compared, null, 2)
              : ""
          }
          placeholder='[{"name":"Produkt","editorial_score":8.5,"verdict":"Kort omdöme","pros":["..."],"cons":["..."],"award":"best_overall"}]'
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="featured_image_url">Bild-URL</Label>
        <Input
          id="featured_image_url"
          name="featured_image_url"
          type="url"
          defaultValue={article?.featured_image_url ?? ""}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={article?.status ?? "draft"}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            <option value="draft">Utkast</option>
            <option value="published">Publicerad</option>
            <option value="archived">Arkiverad</option>
          </select>
        </div>
        <label className="flex items-end gap-2 pb-3 text-sm font-medium">
          <input
            type="checkbox"
            name="is_sponsored"
            defaultChecked={article?.is_sponsored}
            className="size-4"
          />
          Sponsrat innehåll
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Använd aldrig metoden “Testad av oss” om produkten inte faktiskt har
        testats. Fabricera inte omdömen eller testantal.
      </p>
      <div className="flex justify-end">
        <Button type="submit">Spara artikel</Button>
      </div>
    </form>
  );
}
