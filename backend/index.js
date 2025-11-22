require('dotenv').config({ path: '../.env' });
const API_TOKEN = process.env.API_TOKEN_YOUTUBE_TRANS;

// get subtitle
const translate = require('@iamtraction/google-translate');

fetch("https://www.youtube-transcript.io/api/transcripts", {
    method: "POST",
    headers: {
        "Authorization": `Basic ${API_TOKEN}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        ids: ["jNQXAC9IVRw"],
    })
})
    .then(response => response.json())
    .then(async (data) => {
        console.log("Dữ liệu nhận được từ Youtube API:", data);

        if (!data || data.length === 0 || !data[0].text) {
            console.log("Không tìm thấy nội dung text trong phản hồi API.");
            return;
        }

        const textVideo = data[0];

        console.log("Translating...");

        try {
            const res = await translate(textVideo.text, { to: 'vi' });
            textVideo.text = res.text;

            if (res.from && res.from.language && res.from.language.iso === 'vi') {
                console.log("Văn bản gốc đã là Tiếng Việt.");
                console.log("Nội dung:", textVideo);
            }

            if (textVideo.tracks && textVideo.tracks.length > 0) {
                for (let i = 0; i < textVideo.tracks.length; i++) {
                    const track = textVideo.tracks[i];

                    track.language = "Vietnamese (Translated)";

                    if (track.transcript && track.transcript.length > 0) {
                        // Dịch song song tất cả các dòng
                        await Promise.all(track.transcript.map(async (line) => {
                            try {
                                const resLine = await translate(line.text, { to: 'vi' });
                                line.text = resLine.text;
                            } catch (err) {
                                // ignore line translation errors
                            }
                        }));
                    }
                }
            }

            console.log("Ket qua")
            console.log(JSON.stringify(data, null, 2));

            //mapping transcript to SiGML
            console.log("\n=== BẮT ĐẦU MAPPING TRANSCRIPT TO SIGML ===");
            const vietnameseText = data[0].text;
            const result = transcriptToSiGML(
                vietnameseText, 
                './output_transcript.sigml'
            );
            
            console.log("\n=== KẾT QUẢ MAPPING ===");
            console.log(`✓ Tổng số từ: ${result.totalWords}`);
            console.log(`✓ Tìm thấy trong dictionary: ${result.foundWords}`);
            console.log(`✗ Từ không tìm thấy (${result.missingWords.length}):`, result.missingWords);
            console.log(`✓ File SiGML: ${result.outputPath}`);

            console.log("Nội dung:", textVideo);
        } catch (err) {
            console.error("Lỗi khi gọi Google Translate:", err);
        }
    })
    .catch(error => console.error('Error:', error));







// response xml to extension