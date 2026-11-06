import { SubscriptionActionPage } from "@/features/subscribers/components/subscription-action-page";
import { unsubscribeAction } from "@/features/subscribers/public-actions";
import { isValidToken } from "@/features/subscribers/subscribe";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Avsluta prenumeration",
  description: "Avsluta din prenumeration på erbjudanden från braerbjudanden.se.",
  path: "/nyhetsbrev/avregistrera",
  index: false,
});

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; resultat?: string }>;
}) {
  const { token, resultat } = await searchParams;

  if (resultat === "klart") {
    return (
      <SubscriptionActionPage
        title="Du är avregistrerad"
        description="Du får inga fler utskick från oss. Vill du att vi raderar din adress helt kan du mejla oss."
      />
    );
  }

  if (resultat === "ogiltig" || !isValidToken(token)) {
    return (
      <SubscriptionActionPage
        title="Vi hittade ingen prenumeration"
        description="Länken gäller inte. Hör av dig till oss om du fortfarande får utskick."
      />
    );
  }

  return (
    <SubscriptionActionPage
      title="Avsluta prenumerationen"
      description="Tryck på knappen så slutar vi skicka erbjudanden till dig."
      token={token}
      submitLabel="Avsluta prenumerationen"
      action={unsubscribeAction}
    />
  );
}
