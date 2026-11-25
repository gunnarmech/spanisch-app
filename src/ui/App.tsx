import { useState } from 'preact/hooks';
import type { Db } from '../store/db';
import { Diagnose } from './Diagnose';
import { Home } from './Home';
import { Placement } from './Placement';
import { Progress } from './Progress';
import { Round } from './Round';
import { Settings } from './Settings';
import { Sources } from './Sources';
import { useAppState } from './useAppState';

type View =
  | { name: 'home' }
  | { name: 'diagnose' }
  | { name: 'settings' }
  | { name: 'progress' }
  | { name: 'sources' }
  | { name: 'placement' }
  | { name: 'round'; focus?: string; key: number };

export function App({ db }: { db?: Db }) {
  const app = useAppState(db);
  const [view, setView] = useState<View>({ name: 'home' });

  return (
    <main data-view={view.name}>
      {view.name === 'settings' && app ? (
        <Settings
          app={app}
          onBack={() => setView({ name: 'home' })}
          onDiagnose={() => setView({ name: 'diagnose' })}
          onSources={() => setView({ name: 'sources' })}
        />
      ) : view.name === 'sources' && app ? (
        <Sources app={app} onBack={() => setView({ name: 'settings' })} />
      ) : view.name === 'progress' && app ? (
        <Progress app={app} onBack={() => setView({ name: 'home' })} />
      ) : view.name === 'placement' && app ? (
        <Placement app={app} onFinish={() => setView({ name: 'home' })} />
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
        <Home
          app={app}
          onProgress={() => setView({ name: 'progress' })}
          onPlacement={() => setView({ name: 'placement' })}
          onSettings={() => setView({ name: 'settings' })}
          onDiagnose={() => setView({ name: 'diagnose' })}
          onStart={(focus) => setView({ name: 'round', focus, key: 0 })}
        />
      )}
    </main>
  );
}
