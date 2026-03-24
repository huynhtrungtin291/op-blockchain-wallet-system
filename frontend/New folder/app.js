import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const connectBtn = document.getElementById('connectBtn');
const infoDiv = document.getElementById('info');
const accountSpan = document.getElementById('account');
const balanceSpan = document.getElementById('balance');
const networkSpan = document.getElementById('network');

let provider;
let signer;

async function init() {
    if (window.ethereum) {
        // 1. Khởi tạo Provider (trình kết nối với MetaMask)
        provider = new ethers.BrowserProvider(window.ethereum);

        // Lắng nghe sự kiện đổi tài khoản
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                location.reload(); // Nếu người dùng ngắt kết nối
            } else {
                updateUI();
            }
        });

        // Lắng nghe sự kiện đổi mạng (Mainnet, Goerli, v.v.)
        window.ethereum.on('chainChanged', () => location.reload());

    } else {
        connectBtn.innerText = "Vui lòng cài đặt MetaMask";
        connectBtn.disabled = true;
    }
}

async function updateUI() {
    try {
        // 2. Lấy Signer (đối tượng đại diện cho ví để ký giao dịch)
        signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        // 3. Lấy số dư và định dạng về Ether (thay vì Wei)
        const balance = await provider.getBalance(address);
        const network = await provider.getNetwork();

        // Cập nhật giao diện
        accountSpan.innerText = address;
        balanceSpan.innerText = parseFloat(ethers.formatEther(balance)).toFixed(4);
        networkSpan.innerText = network.name === 'unknown' ? 'Localhost/Custom' : network.name;

        connectBtn.classList.add('hidden');
        infoDiv.classList.remove('hidden');
    } catch (error) {
        console.error("Lỗi cập nhật UI:", error);
    }
}

connectBtn.addEventListener('click', async () => {
    try {
        // Yêu cầu MetaMask mở cửa sổ đăng nhập trước
        await provider.send("eth_requestAccounts", []);
        
        const coston2ChainId = '0x72'; // Chain ID 114 ở dạng Hexadecimal

        try {
            // Cố gắng chuyển sang mạng Coston2
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: coston2ChainId }],
            });
        } catch (switchError) {
            // Mã lỗi 4902 tức là mạng này chưa được thêm vào MetaMask của người dùng
            if (switchError.code === 4902) {
                try {
                    // Yêu cầu thêm mạng Flare Testnet Coston2
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: coston2ChainId,
                                chainName: 'Flare Testnet Coston2',
                                rpcUrls: ['https://coston2-api.flare.network/ext/C/rpc'],
                                nativeCurrency: {
                                    name: 'Coston2 Flare',
                                    symbol: 'C2FLR', 
                                    decimals: 18,
                                },
                                blockExplorerUrls: ['https://coston2-explorer.flare.network/'],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error('Không thể thêm mạng Coston2', addError);
                    alert("Bạn cần thêm mạng Coston2 để tiếp tục!");
                    return;
                }
            } else {
                console.error('Lỗi khi chuyển mạng', switchError);
                return;
            }
        }

        await updateUI();
    } catch (error) {
        alert("Người dùng từ chối kết nối hoặc có lỗi xảy ra!");
        console.error(error);
    }
});

init();