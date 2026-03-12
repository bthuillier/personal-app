import createClient, { type Middleware } from "openapi-fetch";
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";
import type { paths } from "./schema";
import { ApiError, getErrorMessage } from "./error";

const errorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (response.ok) return;

    let body: unknown;
    try {
      body = await response.clone().json();
    } catch {
      // non-JSON response, that's fine
    }

    const message = getErrorMessage(response.status, body);
    throw new ApiError(message, response.status);
  },
};

export const api = createClient<paths>({ baseUrl: "/api" });
api.use(errorMiddleware);

function showErrorToast(error: Error) {
  toast.error(error.message || "An unexpected error occurred");
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: showErrorToast }),
  mutationCache: new MutationCache({ onError: showErrorToast }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 1;
      },
    },
  },
});
