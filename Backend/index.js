//IMPORTATIONS DES LIBRAIRIES
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

//CONNEXION À LA BASE DE DONNÉES
const db = require("./config/db");

//IMPORTER LES FONCTIONS DE VALIDATION
const { check, validationResult } = require("express-validator");
const { log } = require("console");
const { exists } = require("fs");

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
serveur.get(
  "/livres",
  [
    check("ordre")
      .escape()
      .trim()
      .optional()
      .isLength({ max: 100 })
      .isIn(["titre", "auteur", "editeur", "pages", "categories", "date"])
      .withMessage(
        "Vous pouvez ordonner par titre, auteur, éditeur, nombre de pages, catégories ou date"
      ),
    check("direction")
      .escape()
      .trim()
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("Choisissez entre asc ou desc."),
    check("limite").escape().trim().optional().isLength({ max: 1000 }),
    check("depart").escape().trim().optional().isLength({ max: 1000 }),
  ],
  async (req, res) => {
    try {
      const erreurValidation = validationResult(req);
      if (!erreurValidation.isEmpty()) {
        return res
          .status(400)
          .json({ msg: "Données invalides", erreurValidation });
      }
      const {
        ordre = "titre",
        direction = "asc",
        limite = 100,
        depart = 0,
      } = req.query;

      const livres = [];
      const donnees = await db
        .collection("livres")
        .orderBy(ordre, direction)
        .limit(Number(limite))
        .offset(Number(depart))
        .get();

      donnees.forEach((donnee) => {
        const livre = { id: donnee.id, ...donnee.data() };
        livres.push(livre);
        if (ordre == "titre") {
          livres.sort(function (a, b) {
            return a.titre.localeCompare(b.titre);
          });
        }
        if (ordre == "auteur") {
          livres.sort(function (a, b) {
            return a.auteur.localeCompare(b.auteur);
          });
        }
        if (ordre == "editeur") {
          livres.sort(function (a, b) {
            return a.editeur.localeCompare(b.editeur);
          });
        }
        if (ordre == "categories") {
          livres.sort(function (a, b) {
            return a.categories.localeCompare(b.categories);
          });
        }
      });

      if (livres.length == 0) {
        return res.status(404).json({ message: "Aucun livre trouvé" });
      }

      return res.status(200).json(livres);
    } catch (erreur) {
      return res.status(500).json({
        message:
          "La liste des livres n'a pas pu être récupéré. Réessayer dans quelques instants.",
      });
    }
  }
);

/**
 * Route permettant de filtrer les livres par auteur.
 */
serveur.get(
  "/livres/auteur/:auteur",
  [
    check("auteur")
      .escape()
      .trim()
      .notEmpty()
      .isString()
      .isLength({ max: 100 })
      .withMessage(
        "Veuillez entrer un nom d'auteur de 100 caractères et moins."
      ),
  ],
  async (req, res) => {
    try {
      const erreurValidation = validationResult(req);
      if (!erreurValidation.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Données invalides.", erreurValidation });
      }
      let { auteur } = req.params;

      auteur = auteur.split("-");
      auteur.forEach((mot, index) => {
        auteur[index] = mot[0].toUpperCase() + mot.slice(1);
      });
      auteur = auteur.join(" ");
      // auteur = auteur.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const livres = [];

      const donnees = await db.collection("livres").orderBy("auteur").get();

      donnees.forEach((donnee) => {
        const livre = { id: donnee.id, ...donnee.data() };
        let livreAuteurNormalize = livre.auteur
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        if (livreAuteurNormalize == auteur) {
          livres.push(livre);
        }
      });
      if (livres.length == 0) {
        return res
          .status(404)
          .json({ msg: "Aucun livre trouvé pour cet auteur." });
      }
      return res.status(200).json(livres);
    } catch (erreur) {
      return res.status(500).json({
        message: "Une erreur est survenue. Réessayer dans quelques instants.",
      });
    }
  }
);

/**
 * Route permettant de filtrer les livres par catégorie (genre).
 */
serveur.get(
  "/livres/categories/:categories",
  [
    check("categories")
      .escape()
      .trim()
      .notEmpty()
      .isString()
      .isLength({ max: 100 })
      .withMessage(
        "Veuillez entrer un nom de catégorie de 100 caractères et moins."
      ),
  ],
  async (req, res) => {
    try {
      const erreurValidation = validationResult(req);
      if (!erreurValidation.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Données invalides.", erreurValidation });
      }
      let { categories } = req.params;
      categories = categories.split("-");

      categories.forEach((mot, index) => {
        categories[index] = mot[0].toUpperCase() + mot.slice(1);
      });

      categories = categories.join(" ");

      const livres = [];

      const donnees = await db
        .collection("livres")
        .where("categories", "array-contains", categories)
        .get();

      donnees.forEach((donnee) => {
        const livre = { id: donnee.id, ...donnee.data() };
        livres.push(livre);
      });

      if (livres.length == 0) {
        return res
          .status(404)
          .json({ msg: "Aucun livre trouvé pour cette catégorie." });
      }

      return res.status(200).json(livres);
    } catch (erreur) {
      return res.status(500).json({
        message: "Une erreur est survenue. Réessayer dans quelques instants.",
      });
    }
  }
);

/**
 * Route permettant de filtrer les livres par isbn.
 */
serveur.get(
  "/livres/isbn/:isbn",
  [
    check("isbn")
      .escape()
      .trim()
      .notEmpty()
      .isISBN()
      .withMessage(
        "Veuillez entrer un ISBN valide."
      ),
  ],
  async (req, res) => {
    try {
      const erreurValidation = validationResult(req);
      if (!erreurValidation.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Données invalides.", erreurValidation });
      }
      let { isbn } = req.params;

      const livres = [];

      const donnees = await db
        .collection("livres")
        .where("isbn", "==", isbn)
        .get();

      donnees.forEach((donnee) => {
        const livre = { id: donnee.id, ...donnee.data() };
        livres.push(livre);
      });
      if (livres.length == 0) {
        return res
          .status(404)
          .json({ msg: "Aucun livre trouvé pour cet isbn." });
      }
      return res.status(200).json(livres);
    } catch (erreur) {
      return res.status(500).json({
        message: "Une erreur est survenue. Réessayer dans quelques instants.",
      });
    }
  }
);

/**
 * Route servant à récupérer un livre de la bases de données
 */
serveur.get(
  "/livres/:id",
  [
    check("id")
      .escape()
      .trim()
      .notEmpty()
      .isString()
      .isLength({ min: 20, max: 20 })
      .matches(/([A-z0-9\-\_]){20}/),
  ],
  async (req, res) => {
    try {
      const erreurValidation = validationResult(req);
      if (!erreurValidation.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Données invalides.", erreurValidation });
      }
      const { id } = req.params;

      const doc = await db.collection("livres").doc(id).get();

      const livre = doc.data();

      if (livre == null) {
        return res
          .status(404)
          .json({ message: "Le livre que vous recherchez n'existe pas." });
      } else {
        return res.status(200).json(livre);
      }
    } catch (erreur) {
      return res.status(500).json({
        message: "Une erreur est survenue. Réessayer dans quelques instants.",
      });
    }
  }
);

/**
 * Route servant à ajouter un livre dans la base de données
 */
serveur.post(
  "/livres",
  [
    check("titre")
      .escape()
      .trim()
      .notEmpty()
      .isLength({ max: 250 })
      .withMessage("Le titre est obligatoire."),
    check("auteur")
      .escape()
      .trim()
      .notEmpty()
      .isLength({ max: 100 })
      .withMessage("L'auteur est obligatoire."),
    check("description")
      .escape()
      .trim()
      .optional()
      .isLength({ max: 2000 })
      .withMessage(
        "Veuillez entrer une description de 2000 caractères et moins."
      ),
    check("editeur")
      .escape()
      .trim()
      .optional()
      .isLength({ max: 100 })
      .withMessage(
        "Veuillez entrer un nom d'éditeur de 100 caractères et moins."
      ),
    check("isbn")
      .escape()
      .trim()
      .notEmpty()
      .isISBN()
      .withMessage("Veuillez entrer un ISBN valide."),
    check("pages")
      .escape()
      .trim()
      .optional()
      .isLength({ max: 10 })
      .withMessage("Veuillez entrer un nombre de pages valides."),
    check("categories")
      .escape()
      .trim()
      .exists()
      .isArray()
      .notEmpty()
      .isLength({ max: 1000 })
      .withMessage(
        "Veuillez entrer une catégories de 1000 caractères et moins."
      ),
    check("date")
      .escape()
      .trim()
      .optional()
      .isLength({ max: 4 })
      .withMessage("Veuillez entrer une année de publication valide. Ex: 2025"),
    check("image")
      .escape()
      .trim()
      .exists()
      .notEmpty()
      .isLength({ max: 1000 })
      .matches(/\.(jpeg|gif|png|jpg)$/)
      .withMessage(
        "Veuillez entrer une image de format .jpeg, .gif, .png ou .jpg."
      ),
  ],
  async (req, res) => {
    try {
      const erreurValidation = validationResult(req);
      if (!erreurValidation.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Données invalides.", erreurValidation });
      }
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
        return res.status(404).json({
          message:
            "Ce livre est déjà présent dans la base de données. Veuillez entrer un autre livre",
        });
      } else {
        await db.collection("livres").add(body);
        return res.status(201).json({ message: "Le livre a été ajouté." });
      }
    } catch (erreur) {
      return res.status(500).json({
        message: "Une erreur est survenue. Réessayez dans quelques instants.",
      });
    }
  }
);

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
    if (livresDeDepart !== null) {
      return res
        .status(400)
        .json({ message: "La base de données a déjà été initialisée." });
    } else {
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
serveur.put(
  "/livres/:id",
  [
    check("id")
      .escape()
      .trim()
      .notEmpty()
      .isString()
      .isLength({ min: 20, max: 20 })
      .matches(/([A-z0-9\-\_]){20}/),
  ],
  async (req, res) => {
    try {
      const erreurValidation = validationResult(req);
      if (!erreurValidation.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Données invalides.", erreurValidation });
      }
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
        if (id === livre.id) {
          idExiste = true;
        }
      });

      if (idExiste) {
        await db.collection("livres").doc(id).update(body);
        return res
          .status(201)
          .json({ message: "Le livre a été modifié", livre: body });
      } else {
        return res.status(404).json({
          message:
            "Le livre n'existe pas. Réessayer avec un autre identifiant.",
        });
      }
    } catch (erreur) {
      return res.status(500).json({
        message:
          "Une erreur est survenue. Veuillez réessayer dans quelques instants",
      });
    }
  }
);

/**
 * Route servant à effacer un livre de la bases de données
 */
serveur.delete(
  "/livres/:id",
  [
    check("id")
      .escape()
      .trim()
      .notEmpty()
      .isString()
      .isLength({ min: 20, max: 20 })
      .matches(/([A-z0-9\-\_]){20}/),
  ],
  async (req, res) => {
    try {
      const erreurValidation = validationResult(req);
      if (!erreurValidation.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Données invalides.", erreurValidation });
      }
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
        return res.status(404).json({
          message:
            "Le livre n'existe pas. Réessayer avec un autre identifiant.",
        });
      }
    } catch (erreur) {
      return res.status(500).json({
        message:
          "Le livre n'a pas pu être supprimé. Veuillez réessayer dans quelques instants",
      });
    }
  }
);

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
