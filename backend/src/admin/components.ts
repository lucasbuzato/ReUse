import path from "node:path";
import { fileURLToPath } from "node:url";
import { ComponentLoader } from "adminjs";

export const componentLoader = new ComponentLoader();

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Registra um componente React do painel. Em produção o bundle já vem pronto
 * (public/admin-assets/components.bundle.js), então basta o nome do componente
 * caso o arquivo-fonte não esteja presente no pacote da função serverless.
 */
function register(name: string, relativeFile: string) {
  try {
    return componentLoader.add(name, path.join(here, relativeFile));
  } catch {
    return name;
  }
}

export const Components = {
  Dashboard: register("Dashboard", "components/dashboard"),
  ImagePreview: register("ImagePreview", "components/image-preview"),
  StatusBadge: register("StatusBadge", "components/status-badge"),
};
