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

        // Map pour stocker les déclarations de constantes (const/let)
        const constants = new Map();

        // Regex pour trouver les déclarations de constantes comme "const hi = say 'hi';"
        const constantRegex = /(?:const|let)\s+(\w+)\s*=\s*(.*?);/g;

        let match;
        // On parcourt toutes les correspondances pour extraire les constantes
        while ((match = constantRegex.exec(fileContent)) !== null) {
            const varName = match[1]; // Le nom de la constante (ex: hi)
            const varValue = match[2]; // La valeur de la constante (ex: say 'hi')
            constants.set(varName, varValue);
        }

        // On remplace toutes les occurrences des constantes dans le code d'origine
        for (const [varName, varValue] of constants.entries()) {
            // Regex pour trouver la variable (hi) sans le point-virgule
            const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
            // On remplace la variable par sa valeur
            fileContent = fileContent.replace(usageRegex, varValue);
        }

        // Retire toutes les déclarations de constantes du code
        let transformedContent = fileContent.replace(constantRegex, '');

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
    `${process.cwd()}tests/out` /* Répertoire de travail actuel*/
);
