import React from "react";
import ReactDOM from "react-dom/client";
import ReactQueryProvider from "./providers/react-query-provider";
import { AuthView } from "./views/AuthView";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <AuthView />
    </ReactQueryProvider>
  </React.StrictMode>,
);
