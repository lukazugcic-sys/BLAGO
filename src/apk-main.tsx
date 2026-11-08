import { noviPrijeGotov } from "@/main";
import "@/main";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { GameApp } from "@/components/game/GameApp";
import { AuthProvider } from "@/lib/auth/provider";
import { AppErrorComponent, NijeNadjeno } from "@/lib/error-component";
import "./styles.css";

const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GameApp,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: GameApp,
});

const routeTree = rootRoute.addChildren([indexRoute, loginRoute]);

const router = createRouter({
  routeTree,
  history: createMemoryHistory({ initialEntries: ["/"] }),
  defaultErrorComponent: AppErrorComponent,
  defaultNotFoundComponent: NijeNadjeno,
});

if (noviPrijeGotov) document.documentElement.dataset.blagoNovi = "1";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
