import { createFileRoute, notFound } from "@tanstack/react-router";
import { ConceptView } from "@/components/content/ConceptView";
import { getLld } from "@/data/lld";

export const Route = createFileRoute("/lld/$slug")({
  loader: ({ params }) => {
    const concept = getLld(params.slug);
    if (!concept) throw notFound();
    return { concept };
  },
  component: LldPage,
});

function LldPage() {
  const { concept } = Route.useLoaderData();
  return <ConceptView concept={concept} kicker="LLD" id={`lld:${concept.slug}`} />;
}
