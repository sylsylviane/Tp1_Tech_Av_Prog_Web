// IMPORTATION DES LIBRAIRIES
const express = require("express");
const routeur = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//CONNEXION À LA BASE DE DONNEÉS
const db = require("../config/db");

//IMPORTER LES FONCTIONS DE VALIDATION
const { check, validationResult } = require("express-validator");

//CRÉATION DES ROUTES
/**
 * Route permettant de s'inscrire en tant qu'utilisateur avec un courriel et un mot de passe
 */
routeur.post(
  "/inscription",
  [
    check("courriel").escape().trim().notEmpty().isEmail().normalizeEmail(),
    check("mdp")
      .escape()
      .trim()
      .notEmpty()
      .isLength({ min: 8, max: 20 })
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      }),
  ],
  async (req, res) => {
    try {
      const erreurValidation = validationResult(req);
      if (!erreurValidation.isEmpty()) {
        return res
          .status(400)
          .json({ message: "Données invalides.", erreurValidation });
      }

      const { courriel, mdp } = req.body;

      const utilisateurDonnees = await db
        .collection("utilisateurs")
        .where("courriel", "==", courriel)
        .get();
      console.log(utilisateurDonnees.docs);

      if (utilisateurDonnees.docs.length > 0) {
        return res
          .status(400)
          .json({ message: "Cet utilisateur existe déjà." });
      }

      const mdpEncrypte = await bcrypt.hash(mdp, 10);

      let utilisateur = { ...req.body, mdp: mdpEncrypte };

      await db.collection("utilisateurs").add(utilisateur);
      return res
        .status(201)
        .json({ message: "L'utilisateur a été créé.", utilisateur });
    } catch (erreur) {
      return res.status(500).json({
        message: "Une erreur est survenue. Réessayez dans quelques instants.",
      });
    }
  }
);

/**
 * Route permettant à l'utilisateur de se connecter avec un courriel et un mot de passe
 */
routeur.post(
  "/connexion",
  [
    check("courriel").escape().trim().notEmpty().isEmail().normalizeEmail(),
    check("mdp")
      .escape()
      .trim()
      .notEmpty()
      .isLength({ min: 8, max: 20 })
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      }),
  ],
  async (req, res) => {
    try {
      const erreurValidation = validationResult(req);
      if (!erreurValidation.isEmpty) {
        return res.status(400).json({ msg: "Données invalides." });
      }
      const { courriel, mdp } = req.body;

      const utilisateurDonnees = await db
        .collection("utilisateurs")
        .where("courriel", "==", courriel)
        .get();

      if (utilisateurDonnees.docs.length == 0) {
        return res.status(400).json({ message: "Le courriel n'existe pas." });
      }

      const utilisateur = utilisateurDonnees.docs[0].data();
      const mdpIdentique = await bcrypt.compare(mdp, utilisateur.mdp);

      if (mdpIdentique) {
        delete utilisateur.mdp;
        const options = {
          expiresIn: "1d",
        };

        jwt.sign(utilisateur, process.env.JWT_SECRET, options);
        return res.status(200).json({ message: "Utilisateur connecté." });
      } else {
        return res.status(400).json({ message: "Mot de passe invalide." });
      }
    } catch (erreur) {
      return res.status(500).json({
        message: "Une erreur est survenue. Réessayez dans quelques instants.",
      });
    }
  }
);

/**
 * Route servant à modifier un utilisateur
 */
routeur.put(
  "/:id",
  [
    check("courriel").escape().trim().notEmpty().isEmail().normalizeEmail(),
    check("mdp")
      .escape()
      .trim()
      .notEmpty()
      .isLength({ min: 8, max: 20 })
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      }),
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
      const { courriel, mdp } = req.body;

      await db
        .collection("utilisateurs")
        .where("courriel", "==", courriel)
        .get();

      const mdpEncrypte = await bcrypt.hash(mdp, 10);

      let utilisateur = { ...req.body, mdp: mdpEncrypte };

      await db.collection("utilisateurs").doc(id).update(utilisateur);
      return res
        .status(201)
        .json({ message: "L'utilisateur a été modifié.", utilisateur });
    } catch (erreur) {
      return res.status(500).json({
        message: "Une erreur est survenue. Réessayez dans quelques instants.",
      });
    }
  }
);

/**
 * Route servant à supprimer un utilisateur
 */
routeur.delete(
  "/:id",
  [
    check("courriel").escape().trim().notEmpty().isEmail().normalizeEmail(),
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
      const { courriel } = req.body;

      await db
        .collection("utilisateurs")
        .where("courriel", "==", courriel)
        .get();

      await db.collection("utilisateurs").doc(id).delete();
      return res.status(201).json({ message: "L'utilisateur a été supprimé." });
    } catch (erreur) {
      return res.status(500).json({
        message: "Une erreur est survenue. Réessayez dans quelques instants.",
      });
    }
  }
);

module.exports = routeur;
