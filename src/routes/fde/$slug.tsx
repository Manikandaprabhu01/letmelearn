import { createFileRoute, notFound } from "@tanstack/react-router";
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
  return (
    <ConceptView
      concept={concept}
      kicker={`AI FDE Roadmap · Step ${step}`}
      id={`fde:${concept.slug}`}
    />
  );
}
