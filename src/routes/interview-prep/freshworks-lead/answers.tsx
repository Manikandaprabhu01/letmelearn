import { createFileRoute } from "@tanstack/react-router";
import { FreshworksAnswers } from "@/components/interview/FreshworksAnswers";

export const Route = createFileRoute("/interview-prep/freshworks-lead/answers")({
  component: FreshworksAnswers,
});
