// Gestion des constantes JMC-Plus
export function extractConstants(fileContent, reservedWords) {
    // Gestion du scope : global et local (dans les fonctions)
    const globalConstants = new Map();
    const functionConstants = {};
    const functionRegex = /function\s+\w+\s*\([^)]*\)\s*{([\s\S]*?)}/g;
    let match;
    // Extraire les constantes locales à chaque fonction
    let funcMatch;
    while ((funcMatch = functionRegex.exec(fileContent)) !== null) {
        const funcBody = funcMatch[1];
        const localConstants = new Map();
        const constantRegex = /(?:const|let)\s+(\w+)\s*=\s*(.*?);/g;
        let localMatch;
        while ((localMatch = constantRegex.exec(funcBody)) !== null) {
            const varName = localMatch[1];
            const varValue = localMatch[2];
            if (reservedWords.includes(varName)) {
                throw new Error(`Le nom de constante '${varName}' est un mot réservé.`);
            }
            if (localConstants.has(varName)) {
                throw new Error(`La constante '${varName}' est redéfinie dans la fonction.`);
            }
            if (!varValue || varValue.trim() === '') {
                throw new Error(`La constante '${varName}' n'a pas de valeur.`);
            }
            localConstants.set(varName, varValue);
        }
        // Remplacement combinatoire local
        for (const [varName, varValue] of localConstants.entries()) {
            localConstants.set(varName, resolveCombinatoire(varValue, localConstants));
        }
        functionConstants[funcMatch[0]] = localConstants;
    }
    // Extraire les constantes globales (hors fonctions)
    // On retire les corps de fonctions pour ne garder que le global
    let globalCode = fileContent.replace(functionRegex, '');
    const globalRegex = /(?:const|let)\s+(\w+)\s*=\s*(.*?);/g;
    while ((match = globalRegex.exec(globalCode)) !== null) {
        const varName = match[1];
        const varValue = match[2];
        if (reservedWords.includes(varName)) {
            throw new Error(`Le nom de constante '${varName}' est un mot réservé.`);
        }
        if (globalConstants.has(varName)) {
            throw new Error(`La constante '${varName}' est redéfinie.`);
        }
        if (!varValue || varValue.trim() === '') {
            throw new Error(`La constante '${varName}' n'a pas de valeur.`);
        }
        globalConstants.set(varName, varValue);
    }
    // Remplacement combinatoire global
    for (const [varName, varValue] of globalConstants.entries()) {
        globalConstants.set(varName, resolveCombinatoire(varValue, globalConstants));
    }
    return { globalConstants, functionConstants };
}

function resolveCombinatoire(value, constants) {
    // Remplacement récursif des constantes dans la valeur
    let result = value;
    let replaced;
    do {
        replaced = false;
        for (const [varName, varValue] of constants.entries()) {
            const usageRegex = new RegExp(`\\b${varName}\\b(?!\\s*\\()`, 'g');
            if (usageRegex.test(result)) {
                result = result.replace(usageRegex, varValue);
                replaced = true;
            }
        }
    } while (replaced);
    return result;
}


export function replaceConstants(content, constantsObj) {
    // On retire toutes les déclarations de constantes du code AVANT le remplacement
    let transformedContent = content.replace(/(?:const|let)\s+(\w+)\s*=\s*(.*?);/g, '');
    // Remplacement dans les fonctions
    const { globalConstants, functionConstants } = constantsObj;
    transformedContent = transformedContent.replace(/function\s+\w+\s*\([^)]*\)\s*{([\s\S]*?)}/g, (match, body) => {
        let bodyLines = body.split(/\r?\n/);
        for (let i = 0; i < bodyLines.length; i++) {
            if (!/^\s*\/\//.test(bodyLines[i])) {
                for (const [varName, varValue] of Object.values(functionConstants)[0]?.entries?.() || []) {
                    const usageRegex = new RegExp(`\\b${varName}\\b(?!\\s*\\()`, 'g');
                    bodyLines[i] = bodyLines[i].replace(usageRegex, varValue);
                }
            }
        }
        return match.replace(body, bodyLines.join('\n'));
    });
    // Remplacement dans le scope global
    let lines = transformedContent.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (!/^\s*\/\//.test(lines[i])) {
            for (const [varName, varValue] of globalConstants.entries()) {
                const usageRegex = new RegExp(`\\b${varName}\\b(?!\\s*\\()`, 'g');
                lines[i] = lines[i].replace(usageRegex, varValue);
            }
        }
    }
    return lines.join('\n');
}


