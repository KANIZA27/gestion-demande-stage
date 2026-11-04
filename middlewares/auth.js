// Vérifie que l'utilisateur est connecté, et qu'il a le bon rôle.
function versConnexion(req, res) {
  // On retient la page demandée pour y revenir après la connexion.
  if (req.method === "GET") req.session.retour = req.originalUrl;
  req.session.flash = "Connectez-vous ou créez un compte pour continuer.";
  return res.redirect("/connexion");
}
function connecte(req, res, next) {
  if (!req.session.user) return versConnexion(req, res);
  next();
}
function role(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return versConnexion(req, res);
    if (!roles.includes(req.session.user.role)) return res.status(403).render("erreur", { titre: "Accès refusé", message: "Vous n'avez pas les droits pour accéder à cette page." });
    next();
  };
}
module.exports = { connecte, role };
