// Vérification de la syntaxe JMC-Plus
export function checkSyntax(fileContent) {
    const errors = [];
    const lines = fileContent.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Vérifie si la ligne commence par const ou let et ne finit pas par ;
        if (/^(const|let)\s+\w+\s*=.*[^;]$/.test(line)) {
            errors.push(`Déclaration de constante sans point-virgule à la ligne ${i + 1}.`);
        }
        // Vérifie déclaration incomplète
        if (/^(const|let)\s+\w+\s*=\s*;$/.test(line)) {
            errors.push(`Déclaration de constante incomplète (valeur manquante) à la ligne ${i + 1}.`);
        }
        // Vérifie syntaxe invalide (pas de =)
        if (/^(const|let)\s+\w+[^=]*;$/.test(line) && !/^(const|let)\s+\w+\s*=.*;$/.test(line)) {
            errors.push(`Syntaxe invalide dans la déclaration de constante à la ligne ${i + 1}.`);
        }
    }
    return errors;
}
