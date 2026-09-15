import { createFileRoute, notFound } from "@tanstack/react-router";
import { CompanyAnswers } from "@/components/interview/CompanyAnswers";
import { ConsoleLayout } from "@/components/interview/ConsoleLayout";
import { getCompany } from "@/data/interview/companies";
import { getCompanyMeta } from "@/data/interview/meta";
import { isFreeInterviewCompany } from "@/lib/billing/free-preview";

export const Route = createFileRoute("/interview-prep/$slug/answers")({
  loader: ({ params }) => {
    if (!getCompanyMeta(params.slug)) throw notFound();
    return { slug: params.slug };
  },
  component: CompanyAnswersPage,
});

function CompanyAnswersPage() {
  const { slug } = Route.useLoaderData();
  const company = getCompany(slug);
  if (!company) return null;
  return (
    <ConsoleLayout current={{ id: slug, view: "answers" }}>
      <CompanyAnswers company={company} locked={!isFreeInterviewCompany(slug)} />
    </ConsoleLayout>
  );
}
