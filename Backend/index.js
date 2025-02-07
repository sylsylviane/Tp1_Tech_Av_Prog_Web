//IMPORTATIONS DES LIBRAIRIES
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

//DEMARRER LES VARIABLES D'ENVIRONNEMENT
const serveur = express();
dotenv.config();

//TODO: //CREER DOSSIER PUBLIC POUR CSS 
const dossierPublic = path.join(__dirname, "public");
serveur.use(express.static(dossierPublic));

//CRÉATION DES ROUTES
/**
 * Route servant à récupérer tous les livres de la bases de données
 */
serveur.get("/livres", (req, res) => {
  return res.json({ msg: "livres" }); 
});

/**
 * Route servant à récupérer un livre de la bases de données
 */
serveur.get("/livres/:id", (req, res) => {
  return res.json({ msg: "livres id" }); 
});

/**
 * Route servant à créer un livre dans la bases de données
 */
serveur.post("/livres", (req, res) => {
  return res.json({ msg: "livres post" }); 
});

/**
 * Route servant à modifier un livre de la bases de données
 */
serveur.put("/livres/:id", (req, res) => {
  return res.json({ msg: "livres put" }); 
});

/**
 * Route servant à effacer un livre de la bases de données
 */
serveur.delete("/livres/:id", (req, res) => {
  return res.json({ msg: "livres delete" }); 
});

//RESSOURCES 404
/**
 * Récupère toutes les erreur potentielles pour les url non prévues
 */
serveur.use((req, res) => {
    return res.status(404).json({ msg: "Ressources non trouvée "});
});

/**
 * Permet de démarrer un serveur Node.js sur un port spécifié et affiche un message de confirmation lorsque le serveur est prêt.
 */
serveur.listen(process.env.PORT, () => {
    console.log(`Le serveur est démarré sur le port ${process.env.PORT}`); 
});