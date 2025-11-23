const fs = require('fs');

function convertDictionarySiGML(inputDicFile) {
    const lines = inputDicFile.split(/\r?\n/);

    let sigmlOutput = '<sigml>\n';

    lines.forEach(line => {
        const trimmedLine = line.trim();

        // Bỏ qua dòng trống, dòng tiêu đề (bắt đầu bằng Word) hoặc chú thích (bắt đầu bằng [)
        if (!trimmedLine || trimmedLine.startsWith('Word') || trimmedLine.startsWith('[')) {
            return;
        }

        // Tách các cột bằng dấu TAB (\t).
        // LƯU Ý: Nếu file của bạn dùng dấu phẩy, hãy đổi '\t' thành ','
        const columns = trimmedLine.split('\t');

        // Kiểm tra dữ liệu tối thiểu: Cần có Gloss (cột 0) và HamNoSys (cột cuối)
        if (columns.length < 2) return;

        // cột 0 là từ khóa (Gloss)
        const gloss = columns[0].trim();

        // Cột cuối cùng là mã HamNoSys (loại bỏ khoảng trắng thừa)
        const hamString = columns[columns.length - 1].trim();

        // Nếu không có mã HamNoSys thì bỏ qua
        if (!hamString || hamString === "") return;

        // Xử lý chuỗi HamNoSys: tách dấu phẩy và bọc thẻ <...>
        const hamTags = hamString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => `<${tag}/>`)
            .join(' ');

        // Tạo cấu trúc XML cho từng mục từ
        sigmlOutput += `  <hns_sign gloss="${gloss}">\n`;

        // Phần Non-manual (dùng gloss làm tên hình miệng)
        sigmlOutput += `    <hamnosys_nonmanual>\n`;
        sigmlOutput += `      <hnm_mouthpicture picture="${gloss}"/>\n`;
        sigmlOutput += `    </hamnosys_nonmanual>\n`;

        // Phần Manual (Cử chỉ tay)
        sigmlOutput += `    <hamnosys_manual>\n`;
        sigmlOutput += `      ${hamTags}\n`;
        sigmlOutput += `    </hamnosys_manual>\n`;

        sigmlOutput += `  </hns_sign>\n`;
    });

    sigmlOutput += '</sigml>';
    return sigmlOutput;
}

const inputFile = process.argv[2];
const outputFile = process.argv[3] || 'output.sigml';

fs.readFile(inputFile, 'utf8', (err, data) => {
    if (err) {
        console.error(`❌ Không thể đọc file: ${inputFile}`);
        console.error(err.message);
        return;
    }

    console.log(`🔄 Đang xử lý file: ${inputFile}...`);
    
    try {
        const result = convertDictionarySiGML(data);

        fs.writeFile(outputFile, result, 'utf8', (err) => {
            if (err) {
                console.error(`Lỗi khi ghi file: ${outputFile}`);
                return;
            }
            console.log(`Thành công! File SiGML đã được lưu tại: ${outputFile}`);
        });

    } catch (e) {
        console.error('Đã xảy ra lỗi trong quá trình chuyển đổi:', e);
    }
});