import type { Metadata } from "next";
import VoiceTutor from "@/components/VoiceTutor";

export const metadata: Metadata = {
  title: "Learn — VoiceLearn Africa",
};

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const { prompt } = await searchParams;
  return <VoiceTutor initialPrompt={prompt} />;
}
