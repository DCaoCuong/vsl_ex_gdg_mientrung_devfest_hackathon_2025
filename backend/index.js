// get transcript from youtube-transcript.io API
fetch("https://www.youtube-transcript.io/api/transcripts", {
    method: "POST",
    headers: {
        "Authorization": "Basic " + process.env.API_TOKEN_YOUTUBE_TRANS,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        ids: ["jNQXAC9IVRw"],
    })
})

    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));

// mapping the trancscript (text) to SiGML (translate text to SiGML)


// response xml to extension