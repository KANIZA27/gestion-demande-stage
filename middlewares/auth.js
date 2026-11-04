// Vérifie que l'utilisateur est connecté, et qu'il a le bon rôle.
function connecte(req, res, next) {
  if (!req.session.user) return res.redirect("/connexion");
  next();
}
function role(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.redirect("/connexion");
    if (!roles.includes(req.session.user.role)) return res.status(403).render("erreur", { titre: "Accès refusé", message: "Vous n'avez pas les droits pour accéder à cette page." });
    next();
  };
}
module.exports = { connecte, role };
