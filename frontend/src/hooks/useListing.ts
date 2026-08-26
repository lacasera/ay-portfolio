import { useEffect, useState } from "react";
import type { ListingResponse, ListingSort, Segment } from "@ay/shared";
import { ApiClient } from "../api/client";
import { PAGE_SIZE } from "../constants";

const client = new ApiClient();

export interface ListingFilters {
  category: string | null;
  segment: Segment | null;
  premium: boolean | null;
  inStock: boolean | null;
  sort: ListingSort;
  page: number;
}

export interface ListingState {
  data: ListingResponse | null;
  loading: boolean;
  error: string | null;
}

export function useListing(
  filters: ListingFilters,
  active: boolean
): ListingState {
  const [state, setState] = useState<ListingState>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!active) {
      return;
    }

    const controller = new AbortController();

    setState((prev) => ({ ...prev, loading: true }));

    client
      .listProducts({ ...filters, size: PAGE_SIZE }, controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({ data: null, loading: false, error: messageOf(error) });
      });

    return () => controller.abort();
  }, [active, filters]);

  return state;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
