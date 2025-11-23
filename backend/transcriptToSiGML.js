const fs = require('fs');
const path = require('path');
/**
 * Load pre-generated SiGML dictionary từ file output_hard.sigml
 * @returns {Object} Map từ gloss -> SiGML block
 */
function loadSiGMLDictionary(sigmlPath = './output_hard.sigml') {
    const content = fs.readFileSync(sigmlPath, 'utf8');
    const dictionary = {};

    // Parse XML để tìm tất cả <hns_sign> blocks
    const signRegex = /<hns_sign gloss="([^"]+)">[\s\S]*?<\/hns_sign>/g;
    let match;

    while ((match = signRegex.exec(content)) !== null) {
        const gloss = match[0].match(/gloss="([^"]+)"/)[1].toLowerCase();
        const signBlock = match[0];
        dictionary[gloss] = signBlock;
    }

    return dictionary;
}

/**
 * Load dictionary từ file Dictionary_VSL_HamNoSys (legacy - không dùng nữa)
 * @returns {Object} Map từ word -> HamNoSys notation
 */
function loadDictionary(dictionaryPath = './Dictionary_VSL_HamNoSys') {
    const content = fs.readFileSync(dictionaryPath, 'utf8');
    const lines = content.trim().split('\n');
    const dictionary = {};

    for (let line of lines) {
        const parts = line.split('\t');
        if (parts.length > 0) {
            const word = parts[0].trim().toLowerCase(); // Normalize to lowercase
            const hamnosys = parts[parts.length - 1].trim(); // Last column is HamNoSys
            dictionary[word] = hamnosys;
        }
    }

    return dictionary;
}

/**
 * Xử lý transcript text: tách từ và tra cứu trong SiGML dictionary
 * @param {string} transcript - Text từ YouTube API
 * @param {Object} sigmlDictionary - SiGML dictionary map
 * @returns {Array} Mảng các object {word, sigmlBlock, found}
 */
function processTranscript(transcript, sigmlDictionary) {
    // Tách văn bản thành các từ
    const words = transcript
        .toLowerCase()
        .replace(/[.,!?;:]/g, ' ') // Loại bỏ dấu câu
        .split(/\s+/) // Tách theo khoảng trắng
        .filter(word => word.length > 0);

    const result = [];

    for (let word of words) {
        // Tra cứu từ trong SiGML dictionary
        if (sigmlDictionary[word]) {
            result.push({
                word: word,
                sigmlBlock: sigmlDictionary[word],
                found: true
            });
        } else {
            // Từ không tìm thấy
            // - skip :))
            // - Sử dụng AI model để generate HamNoSys
            console.warn(`Warning: Không tìm thấy từ "${word}" trong SiGML dictionary`);
        }
    }
    return result;
}

/**
 * Assemble SiGML từ các block có sẵn (không generate mới)
 * @param {Array} mappedWords - Mảng {word, sigmlBlock, found}
 * @returns {string} SiGML XML content
 */
function generateSiGML(mappedWords) {
    let sigmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sigmlContent += '<sigml>\n';

    for (let item of mappedWords) {
        if (item.found && item.sigmlBlock) {
            // Thêm indent cho đẹp
            const indentedBlock = item.sigmlBlock
                .split('\n')
                .map(line => '  ' + line)
                .join('\n');
            sigmlContent += indentedBlock + '\n';
        }
    }

    sigmlContent += '</sigml>';
    return sigmlContent;
}

/**
 * Main function: Mapping từ transcript text đến SiGML
 * @param {string} transcript - Text từ YouTube API
 * @param {string} outputPath - Đường dẫn file output SiGML
 * @param {string} sigmlDictionaryPath - Đường dẫn pre-generated SiGML dictionary
 */
function transcriptToSiGML(transcript, outputPath, sigmlDictionaryPath = './output_hard.sigml') {
    if (!outputPath) outputPath = './output_transcript.sigml';

    console.log('Step 1: Load SiGML dictionary...');
    const sigmlDictionary = loadSiGMLDictionary(sigmlDictionaryPath);
    console.log(`Loaded ${Object.keys(sigmlDictionary).length} signs from SiGML dictionary`);

    console.log('\nStep 2: Process transcript...');
    const mappedWords = processTranscript(transcript, sigmlDictionary);
    const foundWords = mappedWords.filter(w => w.found).length;
    console.log(`Mapped ${foundWords}/${mappedWords.length} words`);

    console.log('\nStep 3: Assemble SiGML from pre-generated blocks...');
    const sigmlContent = generateSiGML(mappedWords);

    console.log('\nStep 4: Write to file...');

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, sigmlContent, 'utf8');
    console.log(`SiGML saved to: ${outputPath}`);

    return {
        totalWords: mappedWords.length,
        foundWords: foundWords,
        missingWords: mappedWords.filter(w => !w.found).map(w => w.word),
        outputPath: outputPath
    };
}

module.exports = { transcriptToSiGML, loadSiGMLDictionary, loadDictionary, processTranscript, generateSiGML };
