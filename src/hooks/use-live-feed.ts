import { useEffect, useState } from 'react';

import type { LiveFeed, LiveFeedSnapshot } from '@/core/liveFeed';

/** Subscribe to a LiveFeed; stops polling on unmount. */
export function useLiveFeed<T>(feed: LiveFeed<T>): LiveFeedSnapshot<T> {
  const [snapshot, setSnapshot] = useState(() => feed.getSnapshot());

  useEffect(() => {
    feed.start();
    void feed.refresh();
    const unsub = feed.subscribe(setSnapshot);

    return () => {
      unsub();
      feed.stop();
    };
  }, [feed]);

  return snapshot;
}
