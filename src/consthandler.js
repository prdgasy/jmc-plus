// Gestion des constantes JMC-Plus
export function extractConstants(fileContent, reservedWords) {
    const constantRegex = /(?:const|let)\s+(\w+)\s*=\s*(.*?);/g;
    const constants = new Map();
    let match;
    while ((match = constantRegex.exec(fileContent)) !== null) {
        const varName = match[1];
        const varValue = match[2];
        if (reservedWords.includes(varName)) {
            throw new Error(`Le nom de constante '${varName}' est un mot réservé.`);
        }
        if (constants.has(varName)) {
            throw new Error(`La constante '${varName}' est redéfinie.`);
        }
        if (!varValue || varValue.trim() === '') {
            throw new Error(`La constante '${varName}' n'a pas de valeur.`);
        }
        constants.set(varName, varValue);
    }
    return constants;
}

export function replaceConstants(content, constants) {
    // On retire toutes les déclarations de constantes du code AVANT le remplacement
    let transformedContent = content.replace(/(?:const|let)\s+(\w+)\s*=\s*(.*?);/g, '');
    const lines = transformedContent.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        if (!/^\s*\/\//.test(lines[i])) {
            for (const [varName, varValue] of constants.entries()) {
                const usageRegex = new RegExp(`\\b${varName}\\b(?!\\s*\\()`, 'g');
                lines[i] = lines[i].replace(usageRegex, varValue);
            }
        }
    }
    return lines.join('\n');
}
