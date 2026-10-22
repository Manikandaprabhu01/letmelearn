import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProGate } from "@/components/billing/ProGate";
import { isFreeSample } from "@/lib/billing/free-preview";
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
  const view = <ConceptView concept={concept} kicker="HLD" id={`hld:${concept.slug}`} />;
  if (isFreeSample(concept.slug)) return view;
  return (
    <div className="px-5 py-8 sm:px-8 lg:px-12">
      <ProGate title={`"${concept.title}" is part of the full library`}>{view}</ProGate>
    </div>
  );
}
