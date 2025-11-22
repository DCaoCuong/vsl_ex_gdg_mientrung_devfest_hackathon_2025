require('dotenv').config({ path: '.env' });
const express = require('express');
const cors = require('cors');
const translate = require('@iamtraction/google-translate');
const fs = require('fs');
const path = require('path');
const { transcriptToSiGML } = require('./transcriptToSiGML');

const app = express();
const PORT = 8080;
const API_TOKEN = process.env.API_TOKEN_YOUTUBE_TRANS;
const OUTPUT_DIR = './sigmlTranslated';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

app.use(cors()); // Cho phép gọi API từ mọi nguồn
app.use(express.json());

app.get('/backend/text-to-sign/:videoId', async (req, res) => {
    const videoId = req.params.videoId; // Lấy videoID từ URL

    const filePath = path.join(OUTPUT_DIR, `${videoId}.sigml`);

    // const outputFilePath = './output_transcript.sigml';

    console.log(`\n=== Đang xử lý Video ID: ${videoId} ===`);

    try {

        if (fs.existsSync(filePath)) {
            console.log(`✓ File cache đã tồn tại: ${filePath}`);
            console.log("--> Đang đọc từ cache...");

            fs.readFile(filePath, 'utf8', (err, xmlData) => {
                if (err) {
                    console.error("Lỗi đọc file cache:", err);
                    return res.status(500).json({ error: "Lỗi khi đọc file cache." });
                }
                res.set('Content-Type', 'application/xml');
                return res.send(xmlData);
            });
            return; // Kết thúc hàm, không chạy phần dưới nữa
        }

        // NẾU CHƯA CÓ FILE: Gọi Youtube API
        console.log("File chưa tồn tại. Đang tải...");

        // Gọi Youtube Transcript API
        const ytResponse = await fetch("https://www.youtube-transcript.io/api/transcripts", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${API_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ids: [videoId] })
        });

        const data = await ytResponse.json();

        if (!data || data.length === 0 || !data[0].text) {
            return res.status(404).json({ error: "Không tìm thấy nội dung transcript cho video này." });
        }

        let textVideo = data[0];

        //  Dịch sang Tiếng Việt
        console.log("- Đang dịch sang Tiếng Việt...");
        const transRes = await translate(textVideo.text, { to: 'vi' });
        textVideo.text = transRes.text;

        // Xử lý các track con (nếu cần thiết cho logic của bạn)
        if (textVideo.tracks && textVideo.tracks.length > 0) {
            await Promise.all(textVideo.tracks.map(async (track) => {
                if (track.transcript) {
                    await Promise.all(track.transcript.map(async (line) => {
                        try {
                            const resLine = await translate(line.text, { to: 'vi' });
                            line.text = resLine.text;
                        } catch (e) { }
                    }));
                }
            }));
        }

        // 3. Mapping Transcript to SiGML
        console.log("- Đang tạo file SiGML...");
        const result = transcriptToSiGML(
            textVideo.text,
            filePath
        );

        console.log(`Tạo file thành công: ${result.outputPath}`);

        // 4. Đọc file SiGML vừa tạo và trả về Client
        fs.readFile(filePath, 'utf8', (err, xmlData) => {
            if (err) {
                console.error("Lỗi đọc file:", err);
                return res.status(500).json({ error: "Lỗi khi đọc file SiGML đã tạo." });
            }

            // Set header để trình duyệt/extension hiểu đây là XML
            res.set('Content-Type', 'application/xml');
            res.send(xmlData);
        });

    } catch (err) {
        console.error("Lỗi Server:", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`Endpoint: http://localhost:${PORT}/backend/text-to-sign/{videoID}`);
});