import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import ReactQueryProvider from "./providers/react-query-provider";
import { AppRouter } from "./app/router";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <HashRouter>
        <AppRouter />
      </HashRouter>
    </ReactQueryProvider>
  </React.StrictMode>,
);
