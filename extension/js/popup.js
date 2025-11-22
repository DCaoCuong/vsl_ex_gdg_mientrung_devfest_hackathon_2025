chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. Kiểm tra đúng mật khẩu hành động
    if (request.action === "EXECUTE_AVATAR_FUNC") {
        const xml = request.payload;

        // 2. Tìm ô nhập liệu (Code này CHỈ CHẠY ĐƯỢC Ở ĐÂY)
        const txtArea = document.querySelector('textarea.txtaSiGMLText');

        // 3. Tìm nút Play
        const btnPlay = document.querySelector('input[type="button"].bttnPlaySiGMLText');

        if (txtArea && btnPlay) {
            console.log("Tìm thấy giao diện Avatar. Đang thực thi...");

            // Bước A: Điền XML vào ô text
            txtArea.value = xml;

            // Bước B: Kích hoạt hàm của thư viện thông qua việc click nút
            btnPlay.click();

            // Phản hồi lại background (nếu cần)
            sendResponse({ status: "Done" });
        } else {
            console.error("Lỗi: Chưa load xong giao diện Avatar.");
        }
    }
});