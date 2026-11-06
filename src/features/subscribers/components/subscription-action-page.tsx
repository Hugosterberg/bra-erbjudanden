import Link from "next/link";

import { Button } from "@/components/ui/button";

type SubscriptionActionPageProps = {
  title: string;
  description: string;
  token?: string;
  submitLabel?: string;
  action?: (formData: FormData) => Promise<void>;
};

/**
 * Links in mail only open this page and the visitor presses a button, because
 * mail security scanners follow every link and would otherwise confirm or
 * unsubscribe people without their involvement.
 */
export function SubscriptionActionPage({
  title,
  description,
  token,
  submitLabel,
  action,
}: SubscriptionActionPageProps) {
  return (
    <section className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      {action && token ? (
        <form action={action} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <Button type="submit">{submitLabel}</Button>
        </form>
      ) : (
        <Button asChild variant="outline" className="mt-6">
          <Link href="/erbjudanden">Se aktuella erbjudanden</Link>
        </Button>
      )}
    </section>
  );
}
