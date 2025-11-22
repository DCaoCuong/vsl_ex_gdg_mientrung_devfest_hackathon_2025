// get subtitle

fetch("https://www.youtube-transcript.io/api/transcripts", {
    method: "POST",
    headers: {
        "Authorization": "Basic 68fcf1e1373ba5a907ba8c4b",
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        ids: ["jNQXAC9IVRw"],
    })
})

    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));


// translate text to SiGML




// response xml to extension