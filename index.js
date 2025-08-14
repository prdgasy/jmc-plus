// index.js
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { deserialize } from 'v8';

// Fonction principale pour compiler un fichier JMC-Plus
function compileJMCPlus(inputFilePath, outputFilePath, namespace, packformat, cwd) {
    console.log(`[JMC-Plus] Démarrage de la compilation: inputFilePath=${inputFilePath}, outputFilePath=${outputFilePath}, namespace=${namespace}, packformat=${packformat}, cwd=${cwd}`);

    // Vérifie si le fichier d'entrée existe
    if (!fs.existsSync(inputFilePath)) {
        console.error(`[JMC-Plus] Erreur : Le fichier d'entrée n'existe pas à l'emplacement ${inputFilePath}`);
        return;
    }

    try {
        // Lecture du contenu du fichier .jmcplus
        let fileContent = fs.readFileSync(inputFilePath, 'utf-8');


        // Liste des mots réservés à interdire comme nom de constante
        const reservedWords = ['function', 'const', 'let', 'if', 'else', 'for', 'while', 'return'];

        // Regex pour trouver les déclarations de constantes comme "const hi = say 'hi';"
        const constantRegex = /(?:const|let)\s+(\w+)\s*=\s*(.*?);/g;
        // Regex pour trouver les déclarations incorrectes
        const invalidConstRegex = /(?:const|let)\s+(\w+)\s*=\s*([^;]*)(?!;)/g;
        // Regex pour trouver les déclarations incomplètes
        const incompleteConstRegex = /(?:const|let)\s+(\w+)\s*=\s*;/g;
        // Regex pour trouver les déclarations syntaxiquement invalides
        const syntaxErrorRegex = /(?:const|let)\s+(\w+)\s*([^=;]*);/g;

        // Vérification des erreurs de déclaration
        if (invalidConstRegex.test(fileContent)) {
            console.error('[JMC-Plus] Erreur : Déclaration de constante sans point-virgule.');
            return;
        }
        if (incompleteConstRegex.test(fileContent)) {
            console.error('[JMC-Plus] Erreur : Déclaration de constante incomplète (valeur manquante).');
            return;
        }
        if (syntaxErrorRegex.test(fileContent)) {
            console.error('[JMC-Plus] Erreur : Syntaxe invalide dans la déclaration de constante.');
            return;
        }

        // On extrait toutes les constantes
        const constants = new Map();
        let match;
        while ((match = constantRegex.exec(fileContent)) !== null) {
            const varName = match[1];
            const varValue = match[2];
            if (reservedWords.includes(varName)) {
                console.error(`[JMC-Plus] Erreur : Le nom de constante '${varName}' est un mot réservé.`);
                return;
            }
            if (constants.has(varName)) {
                console.error(`[JMC-Plus] Erreur : La constante '${varName}' est redéfinie.`);
                return;
            }
            if (!varValue || varValue.trim() === '') {
                console.error(`[JMC-Plus] Erreur : La constante '${varName}' n'a pas de valeur.`);
                return;
            }
            constants.set(varName, varValue);
        }

        // On retire toutes les déclarations de constantes du code AVANT le remplacement
        let transformedContent = fileContent.replace(constantRegex, '');

        // On ignore le remplacement dans les lignes de commentaires
        const lines = transformedContent.split(/\r?\n/);
        // Pour vérifier l'utilisation de constantes non déclarées
        const allConstNames = Array.from(constants.keys());
        for (let i = 0; i < lines.length; i++) {
            // Si la ligne n'est pas un commentaire
            if (!/^\s*\/\//.test(lines[i])) {
                for (const [varName, varValue] of constants.entries()) {
                    // Regex : mot isolé, non suivi de '(' (negative lookahead)
                    const usageRegex = new RegExp(`\\b${varName}\\b(?!\\s*\\()`, 'g');
                    lines[i] = lines[i].replace(usageRegex, varValue);
                }
                // Vérifie l'utilisation de constantes non déclarées (hors déclaration et hors fonction/appel)
                const usageCheckRegex = /\b(\w+)\b(?!\s*\()/g;
                let usageMatch;
                while ((usageMatch = usageCheckRegex.exec(lines[i])) !== null) {
                    const usedName = usageMatch[1];
                    // Ignore si c'est une constante connue ou un mot réservé
                    if (!allConstNames.includes(usedName) && !reservedWords.includes(usedName)) {
                        // Ignore si la ligne est vide ou une déclaration de fonction
                        if (!/^\s*$/.test(lines[i]) && !/^\s*function\b/.test(lines[i])) {
                            console.error(`[JMC-Plus] Erreur : Utilisation de la constante '${usedName}' non déclarée à la ligne ${i + 1}.`);
                            return;
                        }
                    }
                }
            }
        }
        transformedContent = lines.join('\n');

        // Retire les lignes vides résultantes
        transformedContent = transformedContent.replace(/^\s*[\r\n]/gm, '').trim();

        // Écrit le contenu transformé dans le nouveau fichier .jmc
        fs.writeFileSync(outputFilePath, transformedContent, 'utf-8');

        console.log(`[JMC-Plus] Fichier JMC généré avec succès : ${outputFilePath}`);
        console.log(`[JMC-Plus] Lancement de la compilation JMC...`);
        console.log(`[JMC-Plus] Compilation terminé dans ${cwd}`);

    } catch (err) {
        console.error(`[JMC-Plus] Une erreur s'est produite: ${err}`);
    }
}

compileJMCPlus(
    'tests/src/main.jmcplus', // Chemin du fichier d'entrée
    'tests/generated/main.jmc',   // Chemin du fichier de sortie
    'testnamespace',    // Namespace
    71,              // Pack format
    `${process.cwd()}tests/out` // Répertoire de travail actuel
);
