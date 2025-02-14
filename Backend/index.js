//IMPORTATIONS DES LIBRAIRIES
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

//CONNEXION À LA BASE DE DONNÉES
const db = require("./config/db");

//DEMARRER LES VARIABLES D'ENVIRONNEMENT
const serveur = express();
dotenv.config();

//PERMETTRE DE RECEVOIR UN BODY SOUS FORME DE JSON
serveur.use(express.json());

//PERMETTRE L'ACCES AU DOSSIER PUBLIC
const dossierPublic = path.join(__dirname, "public");
serveur.use(express.static(dossierPublic));

//CRÉATION DES ROUTES
/**
 * Route servant à récupérer tous les livres de la bases de données
 */
serveur.get("/livres", async (req, res) => {
  try {

    const {
      ordre = "titre",
      direction = "asc",
      limite = 100,
      depart = 0.
    } = req.query;

    const livres = [];
    const donnees = await db.collection("livres").orderBy(ordre, direction).limit(Number(limite)).offset(Number(depart)).get();

    donnees.forEach((donnee) => {
      const livre = { id: donnee.id, ...donnee.data() };
      livres.push(livre);
    });

    if (livres.length == 0) {
      return res.status(404).json({ message: "Aucun livre trouvé" });
    }

    return res.status(200).json(livres);
  } catch (erreur) {
    return res
      .status(500)
      .json({
        message:
          "La liste des livres n'a pas pu être récupéré. Réessayer dans quelques instants.",
      });
  }
});

/**
 * Route servant à récupérer un livre de la bases de données
 */
serveur.get("/livres/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection("livres").doc(id).get();

    const livre = doc.data();

    if (livre == null) {
      return res
        .status(404)
        .json({ message: "Le livre que vous recherchez n'existe pas." });
    }else{
      return res.status(200).json(livre);
    }


  } catch (erreur) {
    return res
      .status(500)
      .json({
        message: "Une erreur est survenue. Réessayer dans quelques instants.",
      });
  }
});

/**
 * Route servant à ajouter un livre dans la base de données
 */
serveur.post("/livres", async (req, res) => {
  try {
    const livres = [];
    const donnees = await db.collection("livres").get();

    donnees.forEach((donnee) => {
      const livre = { id: donnee.id, ...donnee.data() };
      livres.push(livre);
    });
  
    const { body } = req;
    let livreExiste = false;
    //Vérifier si le livre existe
    livres.forEach((livre) => {
      if (body.isbn === livre.isbn) {
        livreExiste = true;
      }
    });

    if (livreExiste) {
      return res
        .status(404)
        .json({
          message:
            "Ce livre est déjà présent dans la base de données. Veuillez entrer un autre livre",
        });
    } else {
      await db.collection("livres").add(body);
      return res.status(201).json({ message: "Le livre a été ajouté." });
    }
  } catch (erreur) {
    return res
      .status(500)
      .json({
        message: "Une erreur est survenue. Réessayez dans quelques instants.",
      });
  }
});

/**
 * Route servant à initialiser la bases de données avec le fichier livresDepart.js
 */
serveur.post("/livres/initialiser", async (req, res) => {
  try {
    const livresDeDepart = require("./data/livresDepart");
    const livres = [];
    const donnees = await db.collection("livres").get();

    donnees.forEach((donnee) => {
      const livre = { id: donnee.id, ...donnee.data() };
      livresDeDepart.push(livre);
    });
    //Vérifier si les films sont déjà dans la base de données
    if(livresDeDepart !== null){
      return res.status(400).json({message: "La base de données a déjà été initialisée."})
    }else{
      livres.forEach(async (livre) => {
      await db.collection("livres").add(livre);
      });
      return res.status(201).json({ message: "Base de données initialisée." });
    }

  } catch (erreur) {
    return res.status(500).json({ message: "Une erreur est survenues." });
  }
});

/**
 * Route servant à modifier un livre de la bases de données
 */
serveur.put("/livres/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;
    const livres = [];
    let idExiste = false;
    const donnees = await db.collection("livres").get();

    donnees.forEach((donnee) => {
      const livre = { id: donnee.id, ...donnee.data() };
      livres.push(livre);
    });
    
    livres.forEach((livre) => {
      if(id === livre.id){
        idExiste = true;
      }
    })

    if(idExiste){
      await db.collection("livres").doc(id).update(body);
      return res
        .status(201)
        .json({ message: "Le livre a été modifié", livre: body });
    }else{
      return res.status(404).json({message: "Le livre n'existe pas. Réessayer avec un autre identifiant."});
    }
  } catch (erreur) {
    return res.status(500).json({ message: "Une erreur est survenues. Veuillez réessayer dans quelques instants" });
  }
});

/**
 * Route servant à effacer un livre de la bases de données
 */
serveur.delete("/livres/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const livres = [];
    let idExiste = false;
    const donnees = await db.collection("livres").get();

    donnees.forEach((donnee) => {
      const livre = { id: donnee.id, ...donnee.data() };
      livres.push(livre);
    });

    livres.forEach((item) => {
      if (id === item.id) {
        idExiste = true;    
      }
    });
    if (idExiste) {
      await db.collection("livres").doc(id).delete();
      return res.status(200).json({ message: "Le livre a été supprimé." });
    } else {
      return res
        .status(404)
        .json({
          message:
            "Le livre n'existe pas. Réessayer avec un autre identifiant.",
        });
    }
  } catch (erreur) {
    return res.status(500).json({ message: "Le livre n'a pas pu être supprimé. Veuillez réessayer dans quelques instants" });
  }
});

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
