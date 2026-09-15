import { createFileRoute, notFound } from "@tanstack/react-router";
import { CompanyBank } from "@/components/interview/CompanyBank";
import { ConsoleLayout } from "@/components/interview/ConsoleLayout";
import { getCompany } from "@/data/interview/companies";
import { getCompanyMeta } from "@/data/interview/meta";

export const Route = createFileRoute("/interview-prep/$slug/")({
  // The light index only: the loader ships in the main bundle, the question
  // banks load with the page.
  loader: ({ params }) => {
    if (!getCompanyMeta(params.slug)) throw notFound();
    return { slug: params.slug };
  },
  component: CompanyBankPage,
});

function CompanyBankPage() {
  const { slug } = Route.useLoaderData();
  const company = getCompany(slug);
  if (!company) return null;
  return (
    <ConsoleLayout current={{ id: slug, view: "bank" }} showLang={false}>
      <CompanyBank company={company} />
    </ConsoleLayout>
  );
}
