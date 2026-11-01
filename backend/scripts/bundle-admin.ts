// Gera os arquivos JS do painel (AdminJS) em public/admin-assets durante o build.
// Na Vercel eles são servidos pela CDN; o servidor não precisa empacotar nada em tempo de execução.
import { bundle } from "@adminjs/bundler";
import { componentLoader } from "../src/admin/components.js";

await bundle({
  componentLoader,
  destinationDir: "public/admin-assets",
});
