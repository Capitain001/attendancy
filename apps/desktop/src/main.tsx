import React from "react";
import ReactDOM from "react-dom/client";
import ReactQueryProvider from "./providers/react-query-provider";
import { AuthProvider } from "./hooks/useAuth";
import { AppRouter } from "./app/router";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ReactQueryProvider>
  </React.StrictMode>,
);
