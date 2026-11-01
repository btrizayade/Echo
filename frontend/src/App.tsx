import { ViewTransition } from "react";

import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router";

import HomePage from "./pages/HomePage";
import WorkbenchPage from "./pages/WorkbenchPage";

function PageTransitionLayout() {
  return (
    <ViewTransition>
      <Outlet />
    </ViewTransition>
  );
}

function App() {
  return (
    <Routes>
      {/* Layout compartilhado com transições */}
      <Route element={<PageTransitionLayout />}>
        {/* Homepage de apresentação do Echo */}
        <Route path="/" element={<HomePage />} />

        {/* Ambiente de trabalho */}
        <Route path="/app/*" element={<WorkbenchPage />} />
      </Route>

      {/* Endereços desconhecidos retornam à homepage */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

export default App;