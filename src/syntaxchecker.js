export function checkUndeclaredConstants(lines, constants, reservedWords) {
    const errors = [];
    const allConstNames = Array.from(constants.keys());
    for (let i = 0; i < lines.length; i++) {
        if (!/^\s*\/\//.test(lines[i])) {
            const usageCheckRegex = /\b(\w+)\b(?!\s*\()/g;
            let usageMatch;
            while ((usageMatch = usageCheckRegex.exec(lines[i])) !== null) {
                const usedName = usageMatch[1];
                if (!allConstNames.includes(usedName) && !reservedWords.includes(usedName)) {
                    if (!/^\s*$/.test(lines[i]) && !/^\s*function\b/.test(lines[i])) {
                        errors.push({
                            type: 'ReferenceError',
                            message: `Utilisation de la constante '${usedName}' non déclarée.`,
                            line: i + 1,
                            code: lines[i]
                        });
                    }
                }
            }
        }
    }
    return errors;
}
// Vérification de la syntaxe JMC-Plus
export function checkSyntax(fileContent) {
    const errors = [];
    const lines = fileContent.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        // Vérifie si la ligne commence par const ou let et ne finit pas par ;
        if (/^(const|let)\s+\w+\s*=.*[^;]$/.test(trimmed)) {
            errors.push({
                type: 'SyntaxError',
                message: 'Déclaration de constante sans point-virgule.',
                line: i + 1,
                code: line
            });
        }
        // Vérifie déclaration incomplète
        if (/^(const|let)\s+\w+\s*=\s*;$/.test(trimmed)) {
            errors.push({
                type: 'SyntaxError',
                message: 'Déclaration de constante incomplète (valeur manquante).',
                line: i + 1,
                code: line
            });
        }
        // Vérifie syntaxe invalide (pas de =)
        if (/^(const|let)\s+\w+[^=]*;$/.test(trimmed) && !/^(const|let)\s+\w+\s*=.*;$/.test(trimmed)) {
            errors.push({
                type: 'SyntaxError',
                message: 'Syntaxe invalide dans la déclaration de constante.',
                line: i + 1,
                code: line
            });
        }
    }
    return errors;
}
