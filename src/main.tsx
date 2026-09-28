import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./style.css";
const base = import.meta.env.BASE_URL;
const redirected = sessionStorage.getItem('tree-film-pages-redirect');
if (redirected) {
  sessionStorage.removeItem('tree-film-pages-redirect');
  history.replaceState(null, '', base + redirected.replace(/^\//, ''));
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={base}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
