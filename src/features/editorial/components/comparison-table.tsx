import { formatAward, formatComparedPrice, type ComparedProduct } from "../types";
import { ProductRating } from "./product-rating";

export function ComparisonTable({ products }: { products: ComparedProduct[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {products.map((product) => (
          <li
            key={product.name}
            className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <p className="font-medium">
              {product.brand ? `${product.brand} ` : ""}
              {product.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <ProductRating score={product.editorial_score} />
              <span className="text-muted-foreground">{formatAward(product)}</span>
            </div>
            <p className="mt-2 text-sm" data-numeric>
              {formatComparedPrice(product.current_price)}
            </p>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-2xl bg-card ring-1 ring-foreground/10 md:block">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Jämförelsetabell</caption>
          <thead className="border-b bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Produkt</th>
              <th className="px-4 py-3 font-medium">Betyg</th>
              <th className="px-4 py-3 font-medium">Utmärkelse</th>
              <th className="px-4 py-3 font-medium">Pris</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.name} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">
                  {product.brand ? `${product.brand} ` : ""}
                  {product.name}
                </td>
                <td className="px-4 py-3">
                  <ProductRating score={product.editorial_score} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatAward(product, "–")}
                </td>
                <td className="px-4 py-3" data-numeric>
                  {formatComparedPrice(product.current_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
