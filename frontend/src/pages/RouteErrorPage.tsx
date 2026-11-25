import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/display/ErrorState";
import { Button } from "@/components/ui/button";

/** Shown by the router when a page throws while rendering. */
export function RouteErrorPage() {
  const error = useRouteError();
  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "This page crashed";

  return (
    <Page>
      <PageHeader title="Something went wrong" />
      <ErrorState
        title={title}
        error={error}
        onRetry={() => window.location.reload()}
      />
      <div>
        <Button variant="outline" nativeButton={false} render={<Link to="/" />}>
          Back to Home
        </Button>
      </div>
    </Page>
  );
}
