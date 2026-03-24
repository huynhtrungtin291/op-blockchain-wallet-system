import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
    const chatApp = await ethers.deployContract("ChatApp");

    await chatApp.waitForDeployment();

    const contractAddress = await chatApp.getAddress();
    console.log(`ChatApp đã được triển khai tại địa chỉ: ${contractAddress}`);

    // Tự động xuất dữ liệu sang thư mục Next.js (Frontend)
    exportContractAddress(contractAddress);
}

function exportContractAddress(contractAddress: string) {
    const caDir = path.join(__dirname, "../../app/contract-address");
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(caDir)) {
        fs.mkdirSync(caDir, { recursive: true });
    }
    // Lưu địa chỉ Contract vào một file JSON
    fs.writeFileSync(
        path.join(caDir, "contract-address.json"),
        JSON.stringify({ contractAddress }, null, 2)
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
