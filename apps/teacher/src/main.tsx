import { createRoot } from "react-dom/client";
import { AppRouter } from "@attendancy/app";
import { router } from "./router";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AppRouter router={router} />,
);

