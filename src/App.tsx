import { lazy, Suspense, useMemo, type ComponentType } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { routeDefs } from './routes';

/**
 * Rutas del sitio a partir de la tabla compartida `routeDefs`.
 * La Home viaja en el chunk principal; el resto usa code-splitting.
 *
 * `resolved` permite al prerender inyectar los componentes ya cargados
 * (renderToString no espera a React.lazy y dejaría el HTML vacío).
 */
export default function App({
  resolved,
}: {
  resolved?: Map<string, ComponentType>;
} = {}) {
  const routes = useMemo(
    () =>
      routeDefs.map((def) => {
        const key = def.index ? 'index' : (def.path as string);
        const Eager = def.Component ?? resolved?.get(key);
        const element = Eager ? (
          <Eager />
        ) : (
          <Suspense fallback={null}>{createLazy(key, def.load!)}</Suspense>
        );

        return def.index ? (
          <Route key={key} index element={element} />
        ) : (
          <Route key={key} path={def.path} element={element} />
        );
      }),
    [resolved],
  );

  return (
    <Routes>
      <Route element={<Layout />}>{routes}</Route>
    </Routes>
  );
}

/* React.lazy debe crearse una sola vez por ruta, no en cada render. */
const lazyCache = new Map<string, ComponentType>();

function createLazy(key: string, load: () => Promise<{ default: ComponentType }>) {
  let Comp = lazyCache.get(key);
  if (!Comp) {
    Comp = lazy(load);
    lazyCache.set(key, Comp);
  }
  return <Comp />;
}
