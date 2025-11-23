require('dotenv').config({ path: '../.env' });
const API_TOKEN = process.env.API_TOKEN_YOUTUBE_TRANS;
const translate = require('@iamtraction/google-translate');
const { transcriptToSiGML } = require('./transcriptToSiGML');


/**
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Transcript data from API
 */
async function fetchYouTubeTranscript(videoId) {
    console.log(`\n📹 Fetching transcript for video: ${videoId}`);
    
    try {
        const response = await fetch("https://www.youtube-transcript.io/api/transcripts", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${API_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ids: [videoId],
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || data.length === 0 || !data[0].text) {
            throw new Error("Không tìm thấy nội dung text trong phản hồi API");
        }

        console.log("✓ Transcript fetched successfully");
        return data[0];
    } catch (error) {
        console.error("✗ Error fetching transcript:", error.message);
        throw error;
    }
}

/**
 * Translate transcript to Vietnamese
 * @param {Object} textVideo - Transcript object from API
 * @returns {Promise<Object>} Translated transcript
 */
async function translateTranscript(textVideo) {
    console.log("\n🌐 Translating transcript to Vietnamese...");
    
    try {
        // Translate main text
        const res = await translate(textVideo.text, { to: 'vi' });
        textVideo.text = res.text;

        if (res.from && res.from.language && res.from.language.iso === 'vi') {
            console.log("ℹ️  Văn bản gốc đã là Tiếng Việt");
        } else {
            console.log(`✓ Translated from ${res.from?.language?.iso || 'unknown'} to Vietnamese`);
        }

        // Translate tracks if available
        if (textVideo.tracks && textVideo.tracks.length > 0) {
            for (let track of textVideo.tracks) {
                track.language = "Vietnamese (Translated)";

                if (track.transcript && track.transcript.length > 0) {
                    // Translate all lines in parallel
                    await Promise.all(track.transcript.map(async (line) => {
                        try {
                            const resLine = await translate(line.text, { to: 'vi' });
                            line.text = resLine.text;
                        } catch (err) {
                            console.warn(`Warning: Failed to translate line: ${line.text}`);
                        }
                    }));
                }
            }
        }

        console.log("✓ Translation completed");
        return textVideo;
    } catch (error) {
        console.error("✗ Translation error:", error.message);
        throw error;
    }
}

/**
 * Convert Vietnamese transcript to SiGML
 * @param {string} vietnameseText - Translated Vietnamese text
 * @param {string} outputPath - Output SiGML file path
 * @returns {Object} Conversion result statistics
 */
function convertToSiGML(vietnameseText, outputPath = './output_transcript.sigml') {
    console.log("\n🔄 Converting transcript to SiGML...");
    
    try {
        const result = transcriptToSiGML(vietnameseText, outputPath);
        
        console.log("\n=== KẾT QUẢ CHUYỂN ĐỔI ===");
        console.log(`✓ Tổng số từ: ${result.totalWords}`);
        console.log(`✓ Tìm thấy trong dictionary: ${result.foundWords}`);
        console.log(`✗ Từ không tìm thấy (${result.missingWords.length}):`, 
            result.missingWords.length > 0 ? result.missingWords.join(', ') : 'Không có');
        console.log(`✓ File SiGML: ${result.outputPath}`);
        
        return result;
    } catch (error) {
        console.error("✗ SiGML conversion error:", error.message);
        throw error;
    }
}

/**
 * Main pipeline: YouTube → Translate → SiGML
 * @param {string} videoId - YouTube video ID
 * @param {string} outputPath - Output SiGML file path
 */
async function youtubeToSiGML(videoId, outputPath = './output_transcript.sigml') {
    console.log("=".repeat(60));
    console.log("🚀 YOUTUBE TO SIGML PIPELINE");
    console.log("=".repeat(60));
    
    try {
        // Step 1: Fetch transcript from YouTube
        const transcript = await fetchYouTubeTranscript(videoId);
        
        // Step 2: Translate to Vietnamese
        const translatedTranscript = await translateTranscript(transcript);
        
        // Step 3: Convert to SiGML
        const result = convertToSiGML(translatedTranscript.text, outputPath);
        
        console.log("\n" + "=".repeat(60));
        console.log("✅ PIPELINE COMPLETED SUCCESSFULLY");
        console.log("=".repeat(60));
        
        return result;
    } catch (error) {
        console.error("\n" + "=".repeat(60));
        console.error("❌ PIPELINE FAILED");
        console.error("=".repeat(60));
        console.error("Error:", error.message);
        throw error;
    }
}

// ============================================================================
// EXECUTION: Run if this file is executed directly
// ============================================================================
if (require.main === module) {
    // Get video ID from command line argument or use default
    const videoId = process.argv[2] || "jNQXAC9IVRw";
    const outputPath = process.argv[3] || "./output_transcript.sigml";
    
    console.log(`\nUsage: node index.js [videoId] [outputPath]`);
    console.log(`Example: node index.js jNQXAC9IVRw ./output.sigml\n`);
    
    youtubeToSiGML(videoId, outputPath)
        .then(result => {
            console.log("\n✓ Process completed successfully");
            process.exit(0);
        })
        .catch(error => {
            console.error("\n✗ Process failed:", error);
            process.exit(1);
        });
}

// Export for use as module
module.exports = {
    youtubeToSiGML,
    fetchYouTubeTranscript,
    translateTranscript,
    convertToSiGML
};
