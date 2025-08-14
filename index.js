// index.js
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

// Fonction principale pour compiler un fichier JMC-Plus
function compileJMCPlus(inputFilePath) {
    console.log(`[JMC-Plus] Démarrage de la compilation pour le fichier : ${inputFilePath}`);

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

        // Détermine le nom du fichier de sortie .jmc
        const outputFilePath = inputFilePath.replace('.jmcplus', '.jmc');

        // Écrit le contenu transformé dans le nouveau fichier .jmc
        fs.writeFileSync(outputFilePath, transformedContent, 'utf-8');

        console.log(`[JMC-Plus] Fichier JMC généré avec succès : ${outputFilePath}`);
        console.log(`[JMC-Plus] Lancement de la compilation JMC...`);

        // Obtient le nom de fichier et le répertoire pour l'exécution
        const outputDir = path.dirname(outputFilePath);
        const outputFileName = path.basename(outputFilePath);

        // Exécute la commande python -m jmc compile, en spécifiant le répertoire de travail (cwd)
        // La commande est maintenant une seule chaîne de caractères pour éviter les erreurs d'arguments
        const jmcCommand = `python -m jmc compile ${outputFileName}`;
        exec(jmcCommand, { cwd: outputDir }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[JMC-Plus] Erreur lors de l'exécution de la commande JMC: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`[JMC-Plus] Erreur de JMC: ${stderr}`);
                return;
            }
            console.log(`[JMC-Plus] Sortie de JMC:\n${stdout}`);
            console.log(`[JMC-Plus] Compilation JMC terminée avec succès.`);
        });

    } catch (err) {
        console.error(`[JMC-Plus] Une erreur s'est produite: ${err}`);
    }
}

// Appel direct de la fonction de compilation pour un fichier de test
compileJMCPlus('test.jmcplus');
