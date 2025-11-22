//popup.js


function waitAndClickPlay(btnPlay, maxRetries = 20) {
    let attempts = 0;

    const intervalId = setInterval(() => {
        attempts++;

        // Kiểm tra xem nút có đang bị disable không
        if (!btnPlay.disabled) {
            console.log("Nút Play đã sẵn sàng -> Click ngay!");
            btnPlay.click();
            clearInterval(intervalId); // Dừng kiểm tra
        } else {
            console.log(`Nút Play đang bị khóa (đang stop bài cũ)... Thử lại lần ${attempts}`);
        }

        // Nếu thử quá nhiều lần (ví dụ 20 lần * 200ms = 4 giây) mà vẫn khóa thì bỏ cuộc
        if (attempts >= maxRetries) {
            console.error("Timeout: Không thể click nút Play (Avatar bị kẹt trạng thái).");
            clearInterval(intervalId);
        }
    }, 200); // Kiểm tra mỗi 200ms
}

// stop when watch new video
function tryStopAvatar() {
    // Tìm nút Stop dựa trên class av0
    const btnStop = document.querySelector('input[type="button"].bttnStop.av0');

    // Kiểm tra: Nút tồn tại VÀ KHÔNG BỊ DISABLE (tức là đang play thì mới stop được)
    if (btnStop && !btnStop.disabled) {
        console.log("Phát hiện Avatar đang chạy -> Click Stop.");
        btnStop.click();
    } else {
        console.log("Avatar đang đứng yên hoặc không tìm thấy nút Stop -> Bỏ qua.");
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // --- CASE 1: YÊU CẦU DỪNG ---
    if (request.action === "STOP_AVATAR") {
        tryStopAvatar();
        sendResponse({ status: "Stopped" });
    }

    // --- CASE 2: YÊU CẦU CHẠY XML MỚI ---
    else if (request.action === "EXECUTE_AVATAR_FUNC") {
        const xml = request.payload;

        // 1. Dừng bài cũ
        tryStopAvatar();

        // 2. Tìm các phần tử
        const txtArea = document.querySelector('textarea.txtaSiGMLText.av0');
        const btnPlay = document.querySelector('input[type="button"].bttnPlaySiGMLText.av0');

        if (txtArea && btnPlay) {
            console.log("Tìm thấy giao diện. Đang chuẩn bị...");

            // 3. Điền XML
            txtArea.value = xml;

            // Dispatch sự kiện để đảm bảo thư viện nhận biết sự thay đổi (Best Practice)
            txtArea.dispatchEvent(new Event('change'));
            txtArea.dispatchEvent(new Event('input'));

            // 4. GỌI HÀM CHỜ THÔNG MINH THAY VÌ SETTIMEOUT CỐ ĐỊNH
            // Chúng ta đợi một chút (100ms) để lệnh Stop bắt đầu, sau đó mới polling
            setTimeout(() => {
                waitAndClickPlay(btnPlay);
            }, 100);

            sendResponse({ status: "Pending Play" });
        } else {
            console.error("Lỗi: Chưa tìm thấy element giao diện.");
        }
    }
});


