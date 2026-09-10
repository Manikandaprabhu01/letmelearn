import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { PLAYGROUND_UI } from "@/components/playgrounds/registry";
import { PageHeader } from "@/components/content/PageHeader";
import { RelatedList } from "@/components/content/RelatedList";
import { getPlayground } from "@/data/playgrounds";

export const Route = createFileRoute("/playgrounds/$slug")({
  loader: ({ params }) => {
    const meta = getPlayground(params.slug);
    const Ui = PLAYGROUND_UI[params.slug];
    if (!meta || !Ui) throw notFound();
    return { meta };
  },
  component: LabPage,
});

function LabPage() {
  const { meta } = Route.useLoaderData();
  const Ui = PLAYGROUND_UI[meta.slug];
  const related = [meta.relatedConcept, meta.relatedExample].filter((x): x is string => Boolean(x));
  return (
    <article>
      <PageHeader
        kicker="Lab"
        title={meta.title}
        subtitle={meta.subtitle}
        tags={meta.tags}
        id={`lab:${meta.slug}`}
      />
      <div className="px-5 py-8 sm:px-8 lg:px-12">
        <Ui />
        {related.length ? <RelatedList paths={related} /> : null}
        <p className="mt-10 text-sm text-muted">
          Prefer a static walkthrough?{" "}
          <Link to="/examples" className="text-accent hover:underline">
            System Design Examples
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
