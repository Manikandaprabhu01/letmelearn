import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProGate } from "@/components/billing/ProGate";
import { ConceptView } from "@/components/content/ConceptView";
import { getPython, pythonChapterNumber } from "@/data/python";
import { isFreeSample } from "@/lib/billing/free-preview";

export const Route = createFileRoute("/python/$slug")({
  loader: ({ params }) => {
    const concept = getPython(params.slug);
    if (!concept) throw notFound();
    return { concept, chapter: pythonChapterNumber(params.slug) };
  },
  component: PythonPage,
});

function PythonPage() {
  const { concept, chapter } = Route.useLoaderData();
  const view = (
    <ConceptView
      concept={concept}
      kicker={`Python for AI · Chapter ${chapter}`}
      id={`py:${concept.slug}`}
    />
  );
  if (isFreeSample(concept.slug)) return view;
  return (
    <div className="px-5 py-8 sm:px-8 lg:px-12">
      <ProGate title={`"${concept.title}" is part of the full library`}>{view}</ProGate>
    </div>
  );
}
