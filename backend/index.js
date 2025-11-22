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

            if (res.from.language.iso === 'vi') {
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
                        }
                    }));
                }
                }
            }

            console.log("Ket qua")
            console.log(JSON.stringify(data, null, 2));

        } catch (err) {
            console.error("Lỗi khi gọi Google Translate:", err);
        }
    })
    .catch(error => console.error('Error:', error));


// translate text to SiGML




// response xml to extension