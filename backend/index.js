// get transcript from youtube-transcript.io API
require('dotenv').config();
const translate = require('@iamtraction/google-translate');
const { transcriptToSiGML } = require('./transcriptToSiGML');

fetch("https://www.youtube-transcript.io/api/transcripts", {
    method: "POST",
    headers: {
        "Authorization": "Basic " + process.env.API_TOKEN_YOUTUBE_TRANS,
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        ids: ["jNQXAC9IVRw"],
    })
    // get subtitle
})
    .then(response => response.json())
    .then(async (data) => {
        console.log("Dữ liệu nhận được từ Youtube API:", data);

        if (!data || data.length === 0 || !data[0].text) {
            console.log("Không tìm thấy nội dung text trong phản hồi API.");
            return;
        }

        const textCanDich = data[0].text;

        console.log("Translating...");

        try {
            const res = await translate(textCanDich, { to: 'vi' });
            data[0].text = res.text;

            if (res.from.language.iso === 'vi') {
                console.log("Văn bản gốc đã là Tiếng Việt.");
                console.log("Nội dung:", textCanDich);
            } else {
                console.log(`Phát hiện ngôn ngữ gốc: ${res.from.language.iso}`);
                console.log("------------------------------------------------");
                console.log(data);
            }

            //mapping transcript to SiGML
            console.log("\n=== BẮT ĐẦU MAPPING TRANSCRIPT TO SIGML ===");
            const vietnameseText = data[0].text;
            const result = transcriptToSiGML(
                vietnameseText, 
                './output_transcript.sigml',
                './Dictionary_VSL_HamNoSys'
            );
            
            console.log("\n=== KẾT QUẢ MAPPING ===");
            console.log(`✓ Tổng số từ: ${result.totalWords}`);
            console.log(`✓ Tìm thấy trong dictionary: ${result.foundWords}`);
            console.log(`✗ Từ không tìm thấy (${result.missingWords.length}):`, result.missingWords);
            console.log(`✓ File SiGML: ${result.outputPath}`);

        } catch (err) {
            console.error("Lỗi khi gọi Google Translate:", err);
        }
    })
    .catch(error => console.error('Error:', error));