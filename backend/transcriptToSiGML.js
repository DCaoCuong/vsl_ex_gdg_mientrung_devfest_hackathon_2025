const fs = require('fs');

/**
 * Load dictionary từ file Dictionary_VSL_HamNoSys
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
 * Xử lý transcript text: tách từ và tra cứu trong dictionary
 * @param {string} transcript - Text từ YouTube API
 * @param {Object} dictionary - Dictionary map
 * @returns {Array} Mảng các object {word, hamnosys}
 */
function processTranscript(transcript, dictionary) {
    // Tách văn bản thành các từ
    const words = transcript
        .toLowerCase()
        .replace(/[.,!?;:]/g, ' ') // Loại bỏ dấu câu
        .split(/\s+/) // Tách theo khoảng trắng
        .filter(word => word.length > 0);
    
    const result = [];
    
    for (let word of words) {
        // Tra cứu từ trong dictionary
        if (dictionary[word]) {
            result.push({
                word: word,
                hamnosys: dictionary[word],
                found: true
            });
        } else {
            // Từ không tìm thấy - có thể xử lý bằng cách:
            // 1. Thêm vào dictionary mới
            // 2. Bỏ qua
            // 3. Sử dụng fingerspelling (đánh vần bằng ngón tay)

            // maybe use call API model AI to get HamNoSys for missing words
            
            // result.push({
            //     word: word,
            //     hamnosys: null,
            //     found: false
            // });
            console.warn(`Warning: Không tìm thấy từ "${word}" trong dictionary`);
        }
    }
    
    return result;
}

/**
 * @param {Array} mappedWords - Mảng {word, hamnosys, found}
 * @returns {string} SiGML XML content
 */
function generateSiGML(mappedWords) {
    let sigmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sigmlContent += '<sigml>\n';
    
    for (let item of mappedWords) {
        if (item.found && item.hamnosys) {
            // Split HamNoSys notation thành các tag riêng lẻ
            const hamnosysTags = item.hamnosys
                .split(',')
                .map(tag => `<${tag.trim()}/>`)
                .join('');
            
            sigmlContent += `  <hns_sign gloss="${item.word}">\n`;
            sigmlContent += `    <hamnosys_nonmanual>\n`;
            sigmlContent += `      <hnm_mouthpicture picture="${item.word}"/>\n`;
            sigmlContent += `    </hamnosys_nonmanual>\n`;
            sigmlContent += `    <hamnosys_manual>\n`;
            sigmlContent += `      ${hamnosysTags}\n`;
            sigmlContent += `    </hamnosys_manual>\n`;
            sigmlContent += `  </hns_sign>\n`;
        }
    }
    
    sigmlContent += '</sigml>';
    return sigmlContent;
}

/**
 * Main function: Mapping từ transcript text đến SiGML
 * @param {string} transcript - Text từ YouTube API
 * @param {string} outputPath - Đường dẫn file output SiGML
 * @param {string} dictionaryPath - Đường dẫn dictionary
 */
function transcriptToSiGML(transcript, outputPath = './output_transcript.sigml', dictionaryPath = './Dictionary_VSL_HamNoSys') {
    console.log('Step 1: Load dictionary...');
    const dictionary = loadDictionary(dictionaryPath);
    console.log(`Loaded ${Object.keys(dictionary).length} words from dictionary`);
    
    console.log('\nStep 2: Process transcript...');
    const mappedWords = processTranscript(transcript, dictionary);
    const foundWords = mappedWords.filter(w => w.found).length;
    console.log(`Mapped ${foundWords}/${mappedWords.length} words`);
    
    console.log('\nStep 3: Generate SiGML...');
    const sigmlContent = generateSiGML(mappedWords);
    
    console.log('\nStep 4: Write to file...');
    fs.writeFileSync(outputPath, sigmlContent, 'utf8');
    console.log(`✓ SiGML saved to: ${outputPath}`);
    
    return {
        totalWords: mappedWords.length,
        foundWords: foundWords,
        missingWords: mappedWords.filter(w => !w.found).map(w => w.word),
        outputPath: outputPath
    };
}

// Example usage
if (require.main === module) {
    // Test với transcript mẫu
    const sampleTranscript = "xin chào bạn tên tôi là gì";
    
    if (process.argv.length >= 3) {
        // Sử dụng transcript từ command line
        const transcript = process.argv[2];
        const outputPath = process.argv[3] || './output_transcript.sigml';
        transcriptToSiGML(transcript, outputPath);
    } else {
        // Sử dụng sample transcript
        console.log('Using sample transcript:', sampleTranscript);
        const result = transcriptToSiGML(sampleTranscript);
        console.log('\nResult:', result);
    }
}

module.exports = { transcriptToSiGML, loadDictionary, processTranscript, generateSiGML };
