import { useState } from 'preact/hooks';
import type { Db } from '../store/db';
import { Home } from './Home';
import { Round } from './Round';
import { useAppState } from './useAppState';

type View = { name: 'home' } | { name: 'round'; focus?: string; key: number };

export function App({ db }: { db?: Db }) {
  const app = useAppState(db);
  const [view, setView] = useState<View>({ name: 'home' });

  return (
    <main>
      {view.name === 'round' && app ? (
        <Round
          key={view.key}
          app={app}
          focusSituationId={view.focus}
          onExit={() => setView({ name: 'home' })}
          onAgain={() => setView({ ...view, key: view.key + 1 })}
        />
      ) : (
        <Home app={app} onStart={(focus) => setView({ name: 'round', focus, key: 0 })} />
      )}
    </main>
  );
}
