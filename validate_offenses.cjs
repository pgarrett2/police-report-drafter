const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'cjis_codes.json');
const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let errors = [];

jsonData.forEach((entry, index) => {
    if (!entry.elements || entry.elements.trim() === "") {
        // Some entries might intentionally have empty elements, but let's check
        // errors.push(`[${entry.literal}] Empty elements`);
    } else {
        // 1. Check for fragmented elements (lowercase start)
        if (entry.elements[0] === entry.elements[0].toLowerCase() && entry.elements[0].match(/[a-z]/)) {
            errors.push(`[${entry.literal}] Elements starts with lowercase: "${entry.elements.substring(0, 30)}..."`);
        }

        // 2. Check for missing "A person commits" or "An offense under" in common Penal Code offenses
        // We only check PC (Penal Code) for now to avoid false positives in other codes
        if (entry.statute === "PC" && !entry.elements.startsWith("A person commits") && !entry.elements.startsWith("An offense under") && !entry.elements.startsWith("Except as provided")) {
            // Only log this as a warning/info for now if it's not in our updated list
            // console.log(`[INFO][${entry.literal}] Unusual structure: "${entry.elements.substring(0, 50)}..."`);
        }

        // 3. Check for truncation markers
        if (entry.elements.includes('...')) {
            errors.push(`[${entry.literal}] Elements contains ellipsis: "${entry.elements}"`);
        }
    }

    if (entry.statuteText && entry.statuteText.includes('rendered on:')) {
        // This is okay if it's part of the raw data, but maybe we want to know
        // console.log(`[INFO][${entry.literal}] Statute text contains "rendered on" metadata`);
    }
});

if (errors.length > 0) {
    console.log(`Found ${errors.length} issues in offense data:`);
    errors.forEach(err => console.log(err));
} else {
    console.log('No major structural issues found in offense data.');
}
