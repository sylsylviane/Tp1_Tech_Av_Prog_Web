//IMPORTATIONS DES LIBRAIRIES
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

const routeLivres = require("./routes/livres");
const routeUtilisateurs = require("./routes/utilisateurs");

//DEMARRER LES VARIABLES D'ENVIRONNEMENT
const serveur = express();
dotenv.config();

//PERMETTRE DE RECEVOIR UN BODY SOUS FORME DE JSON
serveur.use(express.json());

//PERMETTRE L'ACCES AU DOSSIER PUBLIC
const dossierPublic = path.join(__dirname, "public");
serveur.use(express.static(dossierPublic));

serveur.use("/livres", routeLivres);
serveur.use("/utilisateurs", routeUtilisateurs);

//RESSOURCES 404
/**
 * Récupère toutes les erreur potentielles pour les url non prévues
 */
serveur.use((req, res) => {
  return res.status(404).json({ message: "Ressources non trouvées " });
});

/**
 * Permet de démarrer un serveur Node.js sur un port spécifié et affiche un message de confirmation lorsque le serveur est prêt.
 */
serveur.listen(process.env.PORT, () => {
  console.log(`Le serveur est démarré sur le port ${process.env.PORT}`);
});
