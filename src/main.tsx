import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./style.css";
import "./shared/scrollbar.css";
const base = import.meta.env.BASE_URL;
const redirected = sessionStorage.getItem('tree-film-pages-redirect');
if (redirected) {
  sessionStorage.removeItem('tree-film-pages-redirect');
  history.replaceState(null, '', base + redirected.replace(/^\//, ''));
}
const router = createBrowserRouter([{ path: '*', element: <App /> }], { basename: base });
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
