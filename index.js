// index.js
import * as fs from 'fs';
import { extractConstants, replaceConstants } from './src/consthandler.js';
import { checkSyntax } from './src/syntaxchecker.js';

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



        const reservedWords = ['function', 'const', 'let', 'if', 'else', 'for', 'while', 'return'];
        // Vérification syntaxique
        const syntaxErrors = checkSyntax(fileContent);
        if (syntaxErrors.length > 0) {
            syntaxErrors.forEach(e => console.error(`[JMC-Plus] Erreur(syntaxchecker) : ${e}`));
            return;
        }
        // Extraction des constantes
        let constants;
        try {
            constants = extractConstants(fileContent, reservedWords);
        } catch (err) {
            console.error(`[JMC-Plus] Erreur(consthandler): ${err.message}`);
            return;
        }
        // Remplacement des constantes
        let transformedContent = replaceConstants(fileContent, constants);

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
