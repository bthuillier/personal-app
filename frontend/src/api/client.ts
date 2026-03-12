import createClient from "openapi-fetch";
import { QueryClient } from "@tanstack/react-query";
import type { paths } from "./schema";

export const api = createClient<paths>({ baseUrl: "/api" });

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
