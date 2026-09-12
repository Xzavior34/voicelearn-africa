import type { Metadata } from "next";
import VoiceTutor from "@/components/VoiceTutor";

export const metadata: Metadata = {
  title: "Learn — VoiceLearn Africa",
};

export default function LearnPage() {
  return <VoiceTutor />;
}
