import { noviPrijeGotov } from "@/main";
import "@/main";
import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent, NijeNadjeno } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  if (noviPrijeGotov && typeof document !== "undefined") {
    document.documentElement.dataset.blagoNovi = "1";
  }
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NijeNadjeno,
  });
}
