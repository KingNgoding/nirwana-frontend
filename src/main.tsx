import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { routes } from "./app/routes";
import { queryClient } from "./shared/query-client";
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root element missing");
const router = createBrowserRouter(routes);

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
