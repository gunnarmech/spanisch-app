import { useState } from 'preact/hooks';
import type { Db } from '../store/db';
import { Diagnose } from './Diagnose';
import { Home } from './Home';
import { Round } from './Round';
import { Settings } from './Settings';
import { useAppState } from './useAppState';

type View = { name: 'home' } | { name: 'diagnose' } | { name: 'settings' } | { name: 'round'; focus?: string; key: number };

export function App({ db }: { db?: Db }) {
  const app = useAppState(db);
  const [view, setView] = useState<View>({ name: 'home' });

  return (
    <main>
      {view.name === 'settings' && app ? (
        <Settings app={app} onBack={() => setView({ name: 'home' })} onDiagnose={() => setView({ name: 'diagnose' })} />
      ) : view.name === 'diagnose' ? (
        <Diagnose onBack={() => setView({ name: 'home' })} />
      ) : view.name === 'round' && app ? (
        <Round
          key={view.key}
          app={app}
          focusSituationId={view.focus}
          onExit={() => setView({ name: 'home' })}
          onAgain={() => setView({ ...view, key: view.key + 1 })}
        />
      ) : (
        <Home app={app} onSettings={() => setView({ name: 'settings' })} onDiagnose={() => setView({ name: 'diagnose' })} onStart={(focus) => setView({ name: 'round', focus, key: 0 })} />
      )}
    </main>
  );
}
