import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProGate } from "@/components/billing/ProGate";
import { isFreeSample } from "@/lib/billing/free-preview";
import { ConceptView } from "@/components/content/ConceptView";
import { fdeStepNumber, getFde } from "@/data/fde";

export const Route = createFileRoute("/fde/$slug")({
  loader: ({ params }) => {
    const concept = getFde(params.slug);
    if (!concept) throw notFound();
    return { concept, step: fdeStepNumber(params.slug) };
  },
  component: FdePage,
});

function FdePage() {
  const { concept, step } = Route.useLoaderData();
  const view = (
    <ConceptView
      concept={concept}
      kicker={`AI FDE Roadmap · Step ${step}`}
      id={`fde:${concept.slug}`}
    />
  );
  if (isFreeSample(concept.slug)) return view;
  return (
    <div className="px-5 py-8 sm:px-8 lg:px-12">
      <ProGate title={`"${concept.title}" is part of the full library`}>{view}</ProGate>
    </div>
  );
}
