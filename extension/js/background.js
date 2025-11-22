// background.js

// Nhiệm vụ 1: Lấy videoID từ URL YouTube và gọi API
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Kiểm tra khi trang đã load xong và là trang YouTube
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
        const videoID = extractVideoID(tab.url);

        if (videoID) {
            console.log('Phát hiện Video ID:', videoID);
            // Gọi API để lấy dữ liệu XML
            fetchSiGMLData(videoID);
        }
    }
});

// Hàm trích xuất videoID từ URL YouTube
function extractVideoID(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('v');
    } catch (error) {
        console.error('Error extracting video ID:', error);
        return null;
    }
}

// Nhiệm vụ 2: Gọi API và xử lý dữ liệu XML
async function fetchSiGMLData(videoID, tabId) {
    try {
        const response = await fetch(`http://localhost:8080/backend/text-to-sign/${videoID}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const xmlData = await response.text();
        console.log('XML Data received!');

        chrome.runtime.sendMessage({
            action: "EXECUTE_AVATAR_FUNC", // Tên hành động thống nhất với popup.js
            payload: xmlData
        }, (response) => {
            // 3. XỬ LÝ LỖI NẾU POPUP CHƯA MỞ
            if (chrome.runtime.lastError) {
                console.log("Popup đang đóng. Đã lưu XML vào Storage để dùng sau.");

                // Lưu vào bộ nhớ local, khi nào người dùng bật Popup lên thì popup.js sẽ tự đọc và chạy
                chrome.storage.local.set({ pendingSiGML: xmlData });
            } else {
                console.log("Popup đang mở. Đã gửi lệnh chạy ngay lập tức.");
            }
        });

    } catch (error) {
        console.error('Error fetching SiGML data:', error);
    }
}

// Lắng nghe tin nhắn từ content script hoặc popup (nếu cần)
function extractVideoID(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('v');
    } catch (error) {
        console.error('Error extracting video ID:', error);
        return null;
    }
}


