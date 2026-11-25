import { Link } from "react-router";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <Page>
      <PageHeader title="Page not found" subtitle="This address doesn't match any page." />
      <div>
        <Button nativeButton={false} render={<Link to="/" />}>Back to Home</Button>
      </div>
    </Page>
  );
}
