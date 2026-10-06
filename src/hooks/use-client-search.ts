import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getClients } from '@/services/clients';
import { errorMessage } from '@/services/resources';
import type { Client } from '@/types/client';

export function useClientSearch() {
  const [search, setSearchValue] = useState('');
  const query = search.trim();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const page = useRef(0);
  const generation = useRef(0);
  const request = useRef<AbortController | null>(null);
  const latestSearch = useRef('');
  const failedNext = useRef(false);

  const load = useCallback(async (next = false, retry = false) => {
    if (latestSearch.current !== query || (next && (request.current || !hasMore || (error && !retry)))) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const version = ++generation.current;
    failedNext.current = next;
    if (next) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const response = await getClients({ search: query, page: next ? page.current + 1 : 1, signal: controller.signal });
      if (version !== generation.current || controller.signal.aborted) return;
      page.current = response.meta.current_page;
      setTotal(response.meta.total);
      setHasMore(response.meta.current_page < response.meta.last_page);
      setClients(current => next ? [...current, ...response.data.filter(c => !current.some(existing => existing.id === c.id))] : response.data);
    } catch (e) {
      if (version === generation.current && !controller.signal.aborted) setError(errorMessage(e));
    } finally {
      if (version === generation.current) { request.current = null; setLoading(false); setLoadingMore(false); }
    }
  }, [query, hasMore, error]);

  // hasMore is read through loadMore; it must not trigger an initial-page refetch.
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);
  useFocusEffect(useCallback(() => {
    const timer = setTimeout(() => { void loadRef.current(); }, query ? 300 : 0);
    return () => { clearTimeout(timer); generation.current += 1; request.current?.abort(); request.current = null; };
  }, [query]));

  function setSearch(value: string) {
    if (value.trim() !== latestSearch.current) {
      generation.current += 1; request.current?.abort(); request.current = null;
      setLoading(true); setLoadingMore(false); setClients([]); setHasMore(false); setError(null); page.current = 0;
    }
    latestSearch.current = value.trim();
    setSearchValue(value);
  }
  return { search, setSearch, clients, loading, loadingMore, error, total, hasMore, refresh: () => load(), loadMore: () => load(true), retry: () => load(failedNext.current, true) };
}
