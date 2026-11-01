// Servidor HTTP para desenvolvimento local e para hospedagens com processo contínuo (ex.: Render).
// Na Vercel, o app exportado em src/app.ts é usado diretamente como função.
try {
  process.loadEnvFile();
} catch {
  // sem arquivo .env: usa as variáveis do ambiente
}

const { default: app } = await import("./app.js");
const { config } = await import("./config.js");

app.listen(config.port, () => {
  console.log(`ReUse! API em http://localhost:${config.port} (docs: /api/docs · admin: /admin)`);
});
