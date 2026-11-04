const app = require("./app");
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Plateforme de gestion des stages : http://localhost:${PORT}`));
