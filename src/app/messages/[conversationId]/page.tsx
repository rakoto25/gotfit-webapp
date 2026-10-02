import { redirect } from "next/navigation";

type LegacyConversationPageProps = {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyConversationPage({
  params,
  searchParams,
}: LegacyConversationPageProps) {
  const [{ conversationId }, incomingSearch] = await Promise.all([
    params,
    searchParams,
  ]);
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(incomingSearch)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  query.set("conversation_id", conversationId);
  redirect(`/messages?${query.toString()}`);
}
