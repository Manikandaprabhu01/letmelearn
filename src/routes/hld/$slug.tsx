import { createFileRoute, notFound } from "@tanstack/react-router";
import { ConceptView } from "@/components/content/ConceptView";
import { getHld } from "@/data/hld";

export const Route = createFileRoute("/hld/$slug")({
  loader: ({ params }) => {
    const concept = getHld(params.slug);
    if (!concept) throw notFound();
    return { concept };
  },
  component: HldPage,
});

function HldPage() {
  const { concept } = Route.useLoaderData();
  return <ConceptView concept={concept} kicker="HLD" id={`hld:${concept.slug}`} />;
}
