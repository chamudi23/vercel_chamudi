const fs = require('fs');
const pdf = require('pdf-parse');

async function extractText(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (err) {
        return "Error reading " + filePath + ": " + err.message;
    }
}

async function main() {
    const files = [
        "c:/Users/hp/skeletal/UI design/Developer Functional Specification Document.pdf",
        "c:/Users/hp/skeletal/UI design/UI-UX & Technical Design Document.pdf",
        "c:/Users/hp/skeletal/UI design/Frontend Foundation & UI and UX Implementation.pdf"
    ];
    let output = "";
    for (let file of files) {
        output += "--- " + file + " ---\n";
        output += await extractText(file) + "\n\n";
    }
    fs.writeFileSync("c:/Users/hp/skeletal/scratch/pdf-texts.txt", output);
    console.log("Extracted text to c:/Users/hp/skeletal/scratch/pdf-texts.txt");
}

main();
