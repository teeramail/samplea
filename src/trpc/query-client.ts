import {
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import { type AppRouter } from "~/server/api/root";
import { dbQueryConfig } from "~/utils/cache-config";

export const api = createTRPCReact<AppRouter>();

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        ...dbQueryConfig,
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
