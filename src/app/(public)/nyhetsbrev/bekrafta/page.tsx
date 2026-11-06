import { SubscriptionActionPage } from "@/features/subscribers/components/subscription-action-page";
import { confirmSubscriptionAction } from "@/features/subscribers/public-actions";
import { isValidToken } from "@/features/subscribers/subscribe";
import { createMetadata } from "@/shared/lib/seo";

export const metadata = createMetadata({
  title: "Bekräfta prenumeration",
  description: "Bekräfta din prenumeration på erbjudanden från braerbjudanden.se.",
  path: "/nyhetsbrev/bekrafta",
  index: false,
});

export default async function ConfirmSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; resultat?: string }>;
}) {
  const { token, resultat } = await searchParams;

  if (resultat === "klart") {
    return (
      <SubscriptionActionPage
        title="Tack, din adress är bekräftad"
        description="Du får nu våra utskick med erbjudanden. Du kan avsluta när du vill via länken i varje mejl."
      />
    );
  }

  if (resultat === "ogiltig" || !isValidToken(token)) {
    return (
      <SubscriptionActionPage
        title="Länken gäller inte längre"
        description="Du kan redan ha bekräftat adressen. Annars kan du anmäla dig på nytt längst ner på sidan."
      />
    );
  }

  return (
    <SubscriptionActionPage
      title="Bekräfta din prenumeration"
      description="Tryck på knappen för att börja få erbjudanden från braerbjudanden.se via e-post."
      token={token}
      submitLabel="Bekräfta prenumerationen"
      action={confirmSubscriptionAction}
    />
  );
}
