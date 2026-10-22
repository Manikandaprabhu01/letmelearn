import { createFileRoute } from "@tanstack/react-router";
import { FreshworksBank } from "@/components/interview/FreshworksBank";

export const Route = createFileRoute("/interview-prep/freshworks-lead/")({
  component: FreshworksBank,
});
