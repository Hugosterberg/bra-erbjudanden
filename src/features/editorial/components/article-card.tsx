import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMethodologyLabel } from "../methodology";
import { articlePublicPath, type ArticleWithRelations } from "../types";

export function ArticleCard({ article }: { article: ArticleWithRelations }) {
  const typeLabel =
    article.article_type === "best_in_test"
      ? "Bäst i test"
      : article.article_type === "review"
        ? "Recension"
        : "Guide";

  return (
    <Link href={articlePublicPath(article)} className="group">
      <Card className="h-full rounded-2xl shadow-none ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:ring-primary/25">
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{typeLabel}</Badge>
            <Badge variant="outline">{formatMethodologyLabel(article.methodology)}</Badge>
          </div>
          <h2 className="text-lg font-semibold tracking-tight group-hover:text-primary">
            {article.title}
          </h2>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {article.excerpt ?? article.verdict ?? "Redaktionell guide från braerbjudanden.se."}
          </p>
          {article.category ? (
            <p className="text-xs text-muted-foreground">{article.category.name}</p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
