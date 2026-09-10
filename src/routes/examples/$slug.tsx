import { createFileRoute, notFound } from "@tanstack/react-router";
import { ExampleView } from "@/components/content/ExampleView";
import { getExample } from "@/data/examples";

export const Route = createFileRoute("/examples/$slug")({
  loader: ({ params }) => {
    const example = getExample(params.slug);
    if (!example) throw notFound();
    return { example };
  },
  component: ExamplePage,
});

function ExamplePage() {
  const { example } = Route.useLoaderData();
  return <ExampleView example={example} id={`ex:${example.slug}`} />;
}
