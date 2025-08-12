// index.ts

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

// Fonction principale pour compiler un fichier JMC-Plus
function compileJMCPlus(inputFilePath: string) {
    console.log(`[JMC-Plus] Démarrage de la compilation pour le fichier : ${inputFilePath}`);

    // Vérifie si le fichier d'entrée existe
    if (!fs.existsSync(inputFilePath)) {
        console.error(`[JMC-Plus] Erreur : Le fichier d'entrée n'existe pas à l'emplacement ${inputFilePath}`);
        return;
    }

    try {
        // Lecture du contenu du fichier .jmcplus
        const fileContent = fs.readFileSync(inputFilePath, 'utf-8');

        // Map pour stocker les déclarations de constantes (const/let)
        const constants = new Map<string, string>();

        // Regex pour trouver les déclarations de constantes comme "const hi = say 'hi';"
        const constantRegex = /(?:const|let)\s+(\w+)\s*=\s*(.*?);/g;

        let match;
        // On parcourt toutes les correspondances pour extraire les constantes
        while ((match = constantRegex.exec(fileContent)) !== null) {
            const varName = match[1]; // Le nom de la constante (ex: hi)
            const varValue = match[2]; // La valeur de la constante (ex: say 'hi')
            constants.set(varName, varValue);
        }

        // Retire toutes les déclarations de constantes du code pour ne garder que le code JMC
        let transformedContent = fileContent.replace(constantRegex, '');

        // On remplace toutes les occurrences des constantes dans le reste du code
        // Cela permet d'utiliser 'hi;' qui sera remplacé par 'say 'hi';'
        for (const [varName, varValue] of constants.entries()) {
            // Regex pour trouver la variable suivie d'un point-virgule, par exemple 'hi;'
            const usageRegex = new RegExp(`\\b${varName};`, 'g');
            transformedContent = transformedContent.replace(usageRegex, `${varValue};`);
        }

        // Détermine le nom du fichier de sortie .jmc
        const outputFilePath = inputFilePath.replace('.jmcplus', '.jmc');

        // Écrit le contenu transformé dans le nouveau fichier .jmc
        fs.writeFileSync(outputFilePath, transformedContent, 'utf-8');

        console.log(`[JMC-Plus] Fichier JMC généré avec succès : ${outputFilePath}`);
        console.log(`[JMC-Plus] Lancement de la compilation JMC...`);

        // Exécute la commande python -m jmc compile
        const jmcCommand = `python -m jmc compile ${outputFilePath}`;
        exec(jmcCommand, (error, stdout, stderr) => {
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

// Logique pour gérer la ligne de commande
const args = process.argv.slice(2);
const command = args[0];
const filePath = args[1];

if (command === 'build' && filePath) {
    compileJMCPlus(filePath);
} else {
    console.log(`
[JMC-Plus] Outil de compilation

Utilisation:
  npx ts-node index.ts build <chemin-vers-votre-fichier>.jmcplus
  
Exemple:
  npx ts-node index.ts build mon_super_code.jmcplus
    `);
}
