import { createFileRoute, notFound } from "@tanstack/react-router";
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
  return (
    <ConceptView
      concept={concept}
      kicker={`Java & Spring Boot · Chapter ${chapter}`}
      id={`java:${concept.slug}`}
    />
  );
}
