import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import HomePage from './pages/HomePage';

/* Rutas secundarias con code-splitting: la Home carga primero y rápido. */
const ClinicasPage = lazy(() => import('./pages/ClinicasPage'));
const DiagnosticoPage = lazy(() => import('./pages/DiagnosticoPage'));
const SolucionesPage = lazy(() => import('./pages/SolucionesPage'));
const CasosPage = lazy(() => import('./pages/CasosPage'));
const CasoBlindafonPage = lazy(() => import('./pages/CasoBlindafonPage'));
const CasoInmobiliariaPage = lazy(() => import('./pages/CasoInmobiliariaPage'));
const NosotrosPage = lazy(() => import('./pages/NosotrosPage'));
const AvisoPrivacidadPage = lazy(() => import('./pages/AvisoPrivacidadPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function Deferred({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route
          path="clinicas"
          element={
            <Deferred>
              <ClinicasPage />
            </Deferred>
          }
        />
        <Route
          path="diagnostico"
          element={
            <Deferred>
              <DiagnosticoPage />
            </Deferred>
          }
        />
        <Route
          path="soluciones"
          element={
            <Deferred>
              <SolucionesPage />
            </Deferred>
          }
        />
        <Route
          path="casos"
          element={
            <Deferred>
              <CasosPage />
            </Deferred>
          }
        />
        <Route
          path="casos/blindafon"
          element={
            <Deferred>
              <CasoBlindafonPage />
            </Deferred>
          }
        />
        <Route
          path="casos/inmobiliaria"
          element={
            <Deferred>
              <CasoInmobiliariaPage />
            </Deferred>
          }
        />
        <Route
          path="nosotros"
          element={
            <Deferred>
              <NosotrosPage />
            </Deferred>
          }
        />
        <Route
          path="aviso-de-privacidad"
          element={
            <Deferred>
              <AvisoPrivacidadPage />
            </Deferred>
          }
        />
        <Route
          path="*"
          element={
            <Deferred>
              <NotFoundPage />
            </Deferred>
          }
        />
      </Route>
    </Routes>
  );
}
