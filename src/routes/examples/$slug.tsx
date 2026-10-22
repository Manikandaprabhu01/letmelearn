import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProGate } from "@/components/billing/ProGate";
import { isFreeSample } from "@/lib/billing/free-preview";
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
  const view = <ExampleView example={example} id={`ex:${example.slug}`} />;
  if (isFreeSample(example.slug)) return view;
  return (
    <div className="px-5 py-8 sm:px-8 lg:px-12">
      <ProGate title={`"${example.title}" is part of the full library`}>{view}</ProGate>
    </div>
  );
}
