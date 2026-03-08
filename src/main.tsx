import { createRoot } from "react-dom/client";
import { I18nProvider } from "./lib/i18n.tsx";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);
