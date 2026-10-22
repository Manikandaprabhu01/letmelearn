import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProGate } from "@/components/billing/ProGate";
import { isFreeSample } from "@/lib/billing/free-preview";
import { ConceptView } from "@/components/content/ConceptView";
import { getJava, javaChapterNumber } from "@/data/java";

export const Route = createFileRoute("/java/$slug")({
  loader: ({ params }) => {
    const concept = getJava(params.slug);
    if (!concept) throw notFound();
    return { concept, chapter: javaChapterNumber(params.slug) };
  },
  component: JavaPage,
});

function JavaPage() {
  const { concept, chapter } = Route.useLoaderData();
  const view = (
    <ConceptView
      concept={concept}
      kicker={`Java & Spring Boot · Chapter ${chapter}`}
      id={`java:${concept.slug}`}
    />
  );
  if (isFreeSample(concept.slug)) return view;
  return (
    <div className="px-5 py-8 sm:px-8 lg:px-12">
      <ProGate title={`"${concept.title}" is part of the full library`}>{view}</ProGate>
    </div>
  );
}
