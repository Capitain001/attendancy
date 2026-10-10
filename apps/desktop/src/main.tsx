import React from "react";
import ReactDOM from "react-dom/client";
import ReactQueryProvider from "./providers/react-query-provider";
import { AppRouter } from "./app/router";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <AppRouter />
    </ReactQueryProvider>
  </React.StrictMode>,
);
