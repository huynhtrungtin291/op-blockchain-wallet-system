import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const chatApp = await ethers.deployContract("ChatApp");

    await chatApp.waitForDeployment();

    const contractAddress = await chatApp.getAddress();
    console.log(`ChatApp đã được triển khai tại địa chỉ: ${contractAddress}`);

    // Tự động xuất dữ liệu sang thư mục Next.js (Frontend)
    exportToFrontend(contractAddress);
}

function exportToFrontend(contractAddress: string) {
    // Sửa lại đường dẫn này (lùi ra 2 cấp đến "bai-tap-lon" rồi đi vào "op-blockchain-wallet-system/frontend/...")
    const frontendPath = path.join(
        __dirname,
        "../../../op-blockchain-wallet-system/frontend/op/app/abis"
    );

    // D:\Dai-hoc\blockchain\bai-tap-lon\op-blockchain-wallet-system\frontend\op\app\abis (path to save contract-address.json)
    // D:\Dai-hoc\blockchain\bai-tap-lon\op-blockchain-wallet-system\frontend\op\app\abis\contract-address.json (expected path)

    // Bạn có thể log dường dẫn ra để chắc chắn rằng nó trỏ đúng tới D:\Dai-hoc\blockchain\bai-tap-lon\op-blockchain-wallet-system\frontend\op\app\abis
    console.log("Đang copy sang frontendPath:", frontendPath);

    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(frontendPath)) {
        fs.mkdirSync(frontendPath, { recursive: true });
    }

    // A. Lưu địa chỉ Contract vào một file JSON
    fs.writeFileSync(
        path.join(frontendPath, "contract-address.json"),
        JSON.stringify({ ChatApp: contractAddress }, null, 2)
    );

    // B. Copy file ABI từ artifacts sang frontend
    const artifactPath = path.join(__dirname, "../artifacts/contracts/ChatApp.sol/ChatApp.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    fs.writeFileSync(
        path.join(frontendPath, "ChatApp.json"),
        JSON.stringify(artifact, null, 2)
    );

    console.log("Đã copy ABI và địa chỉ Contract sang Frontend thành công!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
