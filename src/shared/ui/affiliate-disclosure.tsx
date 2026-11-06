import Link from "next/link";

export function AffiliateDisclosure() {
  return (
    <p className="text-xs leading-5 text-muted-foreground">
      Innehåller annonslänkar. Köper du något via en länk kan vi få provision från butiken. Det
      kostar inget extra för dig och påverkar inte Deal Score.{" "}
      <Link href="/affiliatedisclosure" className="underline underline-offset-2 hover:text-foreground">
        Så tjänar vi pengar
      </Link>
      .
    </p>
  );
}
