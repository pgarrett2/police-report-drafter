const SUBTYPES = {
    "MISSING": [
        "MISSING-MISSING JUVENILE"
    ],
    "ALARM": [
        "ALARM-VEHICLE ALARM"
    ],
    "ANIMAL PROBLEMS": [
        "ANIMAL PROBLEMS-BARKING DOG"
    ],
    "TRAFFIC STOP": [
        "TRAFFIC STOP-SPEEDING"
    ]
};

const testCases = [
    { callType: "Missing", subtype: "MISSING-MISSING JUVENILE", expected: "missing missing juvenile" }, // Before dedupe
    { callType: "Alarm", subtype: "ALARM-VEHICLE ALARM", expected: "" },
    { callType: "Animal Problems", subtype: "ANIMAL PROBLEMS-BARKING DOG", expected: "" },
    { callType: "Traffic Stop", subtype: "TRAFFIC STOP-SPEEDING", expected: "traffic stop speeding" } // Example
];

function getNarrative(callType, subtype) {
    let combinedCallText = (callType || '[CALL TYPE]').toLowerCase();

    if (subtype && callType) {
        const callTypeLower = callType.toLowerCase();
        // Remove any words from subtype that are already in callType
        const callTypeWords = callTypeLower.split(/[\s-]+/);
        const subtypeLower = subtype.toLowerCase();
        const subtypeWords = subtypeLower.split(/[\s-]+/);

        const uniqueSubtypeWords = subtypeWords.filter(word => !callTypeWords.includes(word));

        if (uniqueSubtypeWords.length > 0) {
            combinedCallText = `${combinedCallText} ${uniqueSubtypeWords.join(' ')}`;
        }
    }
    return combinedCallText;
}

testCases.forEach(tc => {
    const result = getNarrative(tc.callType, tc.subtype);
    console.log(`CallType: "${tc.callType}", Subtype: "${tc.subtype}" -> Result: "${result}"`);
});
