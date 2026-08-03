export type FeedStatus = 'connecting' | 'error' | 'live';

export interface LiveFeedSnapshot<T> {
  data: T;
  status: FeedStatus;
  error: string | null;
  ts: number;
}

export interface LiveFeed<T> {
  getSnapshot: () => LiveFeedSnapshot<T>;
  subscribe: (listener: (snapshot: LiveFeedSnapshot<T>) => void) => () => void;
  start: () => void;
  stop: () => void;
  refresh: () => Promise<void>;
}

interface CreatePollingFeedOptions<T> {
  intervalMs: number;
  fetch: () => Promise<T>;
  initial: T;
}

/** Deep polling feed: callers only need subscribe/snapshot. */
export function createPollingFeed<T>(
  options: CreatePollingFeedOptions<T>,
): LiveFeed<T> {
  const listeners = new Set<(snapshot: LiveFeedSnapshot<T>) => void>();
  let snapshot: LiveFeedSnapshot<T> = {
    data: options.initial,
    status: 'connecting',
    error: null,
    ts: 0,
  };
  let timer: number | null = null;
  let activeRefresh: Promise<void> | null = null;

  function emit(): void {
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  function refresh(): Promise<void> {
    if (activeRefresh) {
      return activeRefresh;
    }

    const refreshPromise = options
      .fetch()
      .then((data) => {
        snapshot = {
          data,
          status: 'live',
          error: null,
          ts: Date.now(),
        };
        emit();
      })
      .catch((error: unknown) => {
        snapshot = {
          ...snapshot,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          ts: Date.now(),
        };
        emit();
      })
      .finally(() => {
        if (activeRefresh === refreshPromise) {
          activeRefresh = null;
        }
      });

    activeRefresh = refreshPromise;
    return refreshPromise;
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot);

      return () => {
        listeners.delete(listener);
      };
    },
    start() {
      if (timer != null) {
        return;
      }

      void refresh();
      timer = window.setInterval(() => {
        void refresh();
      }, options.intervalMs);
    },
    stop() {
      if (timer != null) {
        window.clearInterval(timer);
        timer = null;
      }
    },
    refresh,
  };
}
