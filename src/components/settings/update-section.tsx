import { useCallback, useEffect, useState } from 'react';

import type { Update } from '@/core/updater';

import { Button } from '@/components/ui/button';
import { checkForUpdate, installUpdate } from '@/core/updater';

type UpdateState =
  | { kind: 'available'; update: Update }
  | { kind: 'checking' }
  | { kind: 'current' }
  | { kind: 'error' }
  | { kind: 'installing'; progress: number | null };

function statusText(state: UpdateState): string {
  switch (state.kind) {
    case 'available':
      return `Version ${state.update.version} is available.`;

    case 'checking':
      return 'Checking for updates…';

    case 'current':
      return 'Arc is up to date.';

    case 'error':
      return 'Could not check for updates.';

    case 'installing':
      return state.progress == null
        ? 'Downloading update…'
        : `Downloading update… ${Math.round(state.progress * 100)}%`;
  }
}

/** Checks the update feed on open; installs in place, no uninstall step. */
export function UpdateSection() {
  const [state, setState] = useState<UpdateState>({ kind: 'checking' });

  const runCheck = useCallback(() => {
    setState({ kind: 'checking' });
    checkForUpdate()
      .then((update) =>
        setState(update ? { kind: 'available', update } : { kind: 'current' }),
      )
      .catch((error: unknown) => {
        console.error('[updater] check failed', error);
        setState({ kind: 'error' });
      });
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  function install(update: Update): void {
    setState({ kind: 'installing', progress: null });
    installUpdate(update, (progress) =>
      setState({ kind: 'installing', progress }),
    ).catch((error: unknown) => {
      console.error('[updater] install failed', error);
      setState({ kind: 'error' });
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[12px] text-muted-foreground" role="status">
        {statusText(state)}
      </p>
      {state.kind === 'available' ? (
        <Button type="button" size="sm" onClick={() => install(state.update)}>
          Update &amp; restart
        </Button>
      ) : null}
      {state.kind === 'current' || state.kind === 'error' ? (
        <Button type="button" variant="outline" size="sm" onClick={runCheck}>
          Check for updates
        </Button>
      ) : null}
    </div>
  );
}
