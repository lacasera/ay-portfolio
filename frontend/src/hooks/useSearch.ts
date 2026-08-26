import { useEffect, useState } from "react";
import type { SearchMode, SearchResponse } from "@ay/shared";
import { ApiClient } from "../api/client";
import { PAGE_SIZE, buildSearchConfig } from "../constants";

const client = new ApiClient();
const DEBOUNCE_MS = 300;

export interface SearchState {
  data: SearchResponse | null;
  loading: boolean;
  error: string | null;
}

export function useSearch(query: string, mode: SearchMode): SearchState {
  const [state, setState] = useState<SearchState>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState((prev) => ({ ...prev, loading: true }));
      client
        .search(
          { q: trimmed, size: PAGE_SIZE, config: buildSearchConfig(mode) },
          controller.signal
        )
        .then((data) => setState({ data, loading: false, error: null }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return;
          }
          setState({ data: null, loading: false, error: messageOf(error) });
        });
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, mode]);

  return state;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
