// Content script to inject draggable panel into web pages

(function () {
    'use strict';

    // Create draggable panel
    function createPanel() {
        // Check if panel already exists
        if (document.getElementById('cwasa-panel')) {
            return;
        }

        // Create container - kích thước 386x322px (bằng với CWASAPanel)
        const panel = document.createElement('div');
        panel.id = 'cwasa-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50px;
            right: 50px;
            width: 386px;   
            height: 362px;
            background: rgba(234, 234, 234, 0.33);
            border: 2px solid #333;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            font-family: sans-serif;
            overflow: hidden;
        `;

        // Create header (draggable area) - 40px height
        const header = document.createElement('div');
        header.style.cssText = `
            background: rgba(197, 197, 197, 0.41);
            color: white;
            padding: 10px;
            cursor: move;
            user-select: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 6px 6px 0 0;
            height: 40px;
            min-height: 40px;
            max-height: 40px;
            box-sizing: border-box;
            flex-shrink: 0;
        `;
        header.innerHTML = `
            <span style="font-weight: bold;">VSL Sign Language Avatar</span>
            <button id="cwasa-close" style="
                background: transparent;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0 8px;
                line-height: 1;
            ">×</button>
        `;

        // Create iframe for content - exactly 386x322px
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            width: 386px;
            height: 322px;
            min-width: 386px;
            min-height: 324px;
            max-width: 386px;
            max-height: 324px;
            border: none;
            border-radius: 0 0 6px 6px;
            display: block;
            flex-shrink: 0;
        `;
        iframe.src = chrome.runtime.getURL('popup.html');

        // Append elements
        panel.appendChild(header);
        panel.appendChild(iframe);
        document.body.appendChild(panel);

        // Make draggable
        makeDraggable(panel, header);

        // Close button
        document.getElementById('cwasa-close').addEventListener('click', () => {
            panel.remove();
        });
    }

    // Draggable functionality
    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Create toggle button
    function createToggleButton() {
        if (document.getElementById('cwasa-toggle')) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'cwasa-toggle';
        button.innerHTML = '🤟';
        button.title = 'Toggle Sign Language Avatar';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #4285f4;
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            z-index: 999998;
            transition: transform 0.2s;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });

        button.addEventListener('click', () => {
            const panel = document.getElementById('cwasa-panel');
            if (panel) {
                panel.remove();
            } else {
                createPanel();
            }
        });

        document.body.appendChild(button);
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggleButton);
    } else {
        createToggleButton();
    }

    // Listen for messages from extension
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'togglePanel') {
            const panel = document.getElementById('cwasa-panel');
            if (panel) {
                panel.remove();
            } else {
                createPanel();
            }
        }

        // Xử lý message playSiGML từ background script
        if (request.action === 'playSiGML') {
            try {
                // Kiểm tra xem panel đã được tạo chưa
                const panel = document.getElementById('cwasa-panel');
                if (!panel) {
                    createPanel();
                }

                // Gửi message tới iframe popup để thực thi playSiGMLText
                const iframe = document.querySelector('#cwasa-panel iframe');
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                        action: 'playSiGML',
                        xmlData: request.xmlData
                    }, '*');
                    console.log('SiGML data sent to popup iframe');
                    sendResponse({ success: true });
                } else {
                    console.error('Popup iframe not found');
                    sendResponse({ success: false, error: 'Iframe not found' });
                }
            } catch (error) {
                console.error('Error handling playSiGML:', error);
                sendResponse({ success: false, error: error.message });
            }
            return true;
        }
    });
})();