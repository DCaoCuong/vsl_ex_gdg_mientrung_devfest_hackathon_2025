require('dotenv').config();
const API_TOKEN = process.env.API_TOKEN_YOUTUBE_TRANS;

// get transcript from youtube-transcript.io API
require('dotenv').config();
const translate = require('@iamtraction/google-translate');
const { transcriptToSiGML } = require('./transcriptToSiGML');

fetch("https://www.youtube-transcript.io/api/transcripts", {
    method: "POST",
    headers: {
        "Authorization": "Basic " + process.env.API_TOKEN_YOUTUBE_TRANS,

// get subtitle


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

    } catch (err) {
        console.error("Lỗi khi gọi Google Translate:", err);
    }
})
.catch(error => console.error('Error:', error));

// mapping the trancscript (text) to SiGML (translate text to SiGML)


// response xml to extension