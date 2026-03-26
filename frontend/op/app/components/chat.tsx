"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import Image from "next/image";
import mainLogo from "../../public/Goku instinto superior.jpg";
import contractAddress from "../contract-address/contract-address.json";
// /artifacts/contracts bị bỏ qua bởi .gitignore,
// nó chỉ có sau khi bạn chạy script deploy deploy-chatapp.ts để tạo ra ChatApp.json
import ChatAppArtifact from "../../the-exercises-hardhat/artifacts/contracts/ChatApp.sol/ChatApp.json";
import OPCoinArtifact from "../../the-exercises-hardhat/artifacts/contracts/OPCoin.sol/OPCoin.json";

// /contract-address bị bỏ qua bởi .gitignore,
// nó chỉ có sau khi bạn chạy script deploy deploy-chatapp.ts để tạo ra contract-address.json
const CHATAPP_CONTRACT_ADDRESS = contractAddress.chatAppAddress as string;
const OPCOIN_CONTRACT_ADDRESS = contractAddress.opCoinAddress as string;

interface Message {
  msg: string;
  isResponse: boolean;
}

interface BlockchainData {
  accountOpBalance: string;
  otherAccountOpBalance: string;
  nbBlocks: number;
}

export default function Chat() {
  const [account, setAccount] = useState<string>("");
  const [otherAccount, setOtherAccount] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [opCoinContract, setOpCoinContract] = useState<ethers.Contract | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [amountOp, setAmountOp] = useState<string>("");
  const [blockchainData, setBlockchainData] = useState<BlockchainData>({
    accountOpBalance: "0",
    otherAccountOpBalance: "0",
    nbBlocks: 0,
  });
  const [networkInfo, setNetworkInfo] = useState<{
    name: string;
    chainId: string;
  }>({
    name: "",
    chainId: "",
  });

  // Bọc hàm trong useCallback và đưa lên trên useEffect (Giải quyết lỗi immutability và exhaustive-deps)
  const fetchMessages = useCallback(
    async (
      chatContract: ethers.Contract,
      partnerAddress: string,
      currentUser: string,
    ) => {
      if (
        !chatContract ||
        !partnerAddress ||
        !ethers.isAddress(partnerAddress)
      ) {
        return;
      }
      try {
        const winEth = window.ethereum;
        if (!winEth) return;
        const provider = new ethers.BrowserProvider(winEth);
        const contractAddress = await chatContract.getAddress();
        const code = await provider.getCode(contractAddress);
        if (!code || code === "0x") {
          console.error(
            "Không tìm thấy code contract tại",
            chatContract.address,
          );
          return;
        }

        const history = await chatContract.getMessages(partnerAddress);
        const formattedMessages: Message[] = history.map(
          (m: { content: string; sender: string }) => ({
            msg: m.content,
            isResponse: m.sender !== currentUser,
          }),
        );

        setMessages(formattedMessages);
      } catch (error) {
        console.error("Lỗi khi tải tin nhắn:", error);
      }
    },
    [],
  );

  const updateBalances = useCallback(
    async (partnerAddress?: string) => {
      const winEth = window.ethereum;
      if (!winEth || !account || !opCoinContract) return;

      try {
        const provider = new ethers.BrowserProvider(winEth);
        const [myOpBalRaw, blockNum] = await Promise.all([
          opCoinContract.balanceOf(account),
          provider.getBlockNumber(),
        ]);

        let otherOpBalRaw = ethers.parseUnits("0", 18);
        if (partnerAddress && ethers.isAddress(partnerAddress)) {
          otherOpBalRaw = await opCoinContract.balanceOf(partnerAddress);
        }

        setBlockchainData({
          accountOpBalance: ethers.formatUnits(myOpBalRaw, 18),
          otherAccountOpBalance: partnerAddress
            ? ethers.formatUnits(otherOpBalRaw, 18)
            : "0",
          nbBlocks: blockNum,
        });
      } catch (error) {
        console.error("Lỗi cập nhật số dư:", error);
      }
    },
    [account, opCoinContract],
  );

  useEffect(() => {
    const initBlockchain = async () => {
      const winEth = window.ethereum;
      if (!winEth) {
        alert("Vui lòng cài đặt MetaMask!");
        return;
      }

      const provider = new ethers.BrowserProvider(winEth);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const network = await provider.getNetwork();

      console.log("network:", network);

      setNetworkInfo({
        name:
          network.name === "unknown"
            ? "Flare Coston2 (Testnet) nên không có tên 9 xác"
            : network.name,
        chainId: network.chainId.toString(),
      });

      setAccount(userAddress);

      const chatContract = new ethers.Contract(
        CHATAPP_CONTRACT_ADDRESS,
        ChatAppArtifact.abi,
        signer,
      );

      const opContract = new ethers.Contract(
        OPCOIN_CONTRACT_ADDRESS,
        OPCoinArtifact.abi,
        signer,
      );

      const code = await provider.getCode(CHATAPP_CONTRACT_ADDRESS);
      if (!code || code === "0x") {
        console.error(
          "Không tìm thấy code contract tại",
          CHATAPP_CONTRACT_ADDRESS,
        );
        alert(
          "Địa chỉ hợp đồng không hợp lệ trên mạng hiện tại. Vui lòng kiểm tra lại network trong MetaMask hoặc chạy lại script deploy để cập nhật ChatApp.json.",
        );
        return;
      }

      setContract(chatContract);
      setOpCoinContract(opContract);

      const [myOpBalRaw, blockNum] = await Promise.all([
        opContract.balanceOf(userAddress),
        provider.getBlockNumber(),
      ]);
      setBlockchainData((prev) => ({
        ...prev,
        accountOpBalance: ethers.formatUnits(myOpBalRaw, 18),
        nbBlocks: blockNum,
      }));

      // Thêm dấu "_" trước các biến không dùng để vượt qua ESLint no-unused-vars
      chatContract.on("MessageSent", (from: string, to: string) => {
        if (from === otherAccount || to === otherAccount) {
          fetchMessages(chatContract, otherAccount, userAddress);
        }
      });

      return () => {
        chatContract.removeAllListeners("MessageSent");
      };
    };

    initBlockchain();
  }, [otherAccount, fetchMessages]);

  const handleSendMessage = async () => {
    if (!inputValue || !otherAccount || !contract) return;

    try {
      const tx = await contract.sendMessage(otherAccount, inputValue);
      setInputValue("");
      await tx.wait();

      fetchMessages(contract, otherAccount, account);
    } catch (error) {
      console.error("Lỗi gửi tin:", error);
    }
  };

  const handleSendOPCoin = async () => {
    if (!amountOp || !otherAccount || !contract || !opCoinContract) return;

    try {
      const amount = ethers.parseUnits(amountOp, 18);

      // Đảm bảo ChatApp có quyền rút token của người gửi
      const allowance = await opCoinContract.allowance(
        account,
        CHATAPP_CONTRACT_ADDRESS,
      );

      if (allowance < amount) {
        const approveTx = await opCoinContract.approve(
          CHATAPP_CONTRACT_ADDRESS,
          amount,
        );
        await approveTx.wait();
      }

      const tx = await contract.sendOPCoin(
        OPCOIN_CONTRACT_ADDRESS,
        otherAccount,
        amount,
      );
      setAmountOp("");
      await tx.wait();

      updateBalances(otherAccount);
    } catch (error) {
      console.error("Lỗi gửi OP Coin:", error);
    }
  };

  // Khai báo ref cho phần cuối danh sách tin nhắn
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Hàm thực hiện cuộn xuống cuối
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // 1. Kiểm tra điều kiện đầu vào
    if (!contract || !otherAccount || !account || !opCoinContract) return;

    // 2. Chạy ngay lập tức lần đầu (Vì setInterval sẽ đợi n giây mới chạy lần đầu)
    const fetchData = () => {
      fetchMessages(contract, otherAccount, account);
      updateBalances(otherAccount);
      console.log("Dữ liệu đã được cập nhật qua Interval");
    };

    fetchData();

    // 3. Thiết lập vòng lặp mỗi 2 giây
    const intervalId = setInterval(fetchData, 1000000);

    // 4. Cleanup quan trọng nhất: Xóa interval khi component unmount hoặc dependencies thay đổi
    return () => {
      clearInterval(intervalId);
    };
  }, [
    otherAccount,
    contract,
    account,
    opCoinContract,
    fetchMessages,
    updateBalances,
  ]);

  // Tự động cuộn mỗi khi mảng messages thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8 font-sans">
      {/* Container chính: Thiết lập chiều cao cố định để kích hoạt scroll nội bộ */}
      <div className="grid grid-cols-1 md:grid-cols-12 w-full max-w-6xl h-[85vh] bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* CỘT TRÁI: Khu vực Chat (Sử dụng Flex-col để phân bổ Header - Body - Footer) */}
        <div className="md:col-span-8 flex flex-col border-r border-slate-100 h-full overflow-hidden">
          {/* Header: Cố định phía trên (flex-shrink-0 để không bị co) */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white flex-shrink-0 z-10">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 flex-shrink-0">
              <Image
                src={mainLogo}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
            <input
              type="text"
              placeholder="Địa chỉ ví người nhận (0x...)"
              value={otherAccount}
              onChange={(e) => setOtherAccount(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm font-mono text-slate-700 transition-colors"
            />
          </div>

          {/* VÙNG ĐỎ: Danh sách tin nhắn (flex-1 để chiếm toàn bộ khoảng trống và overflow-y-auto để scroll) */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-3 scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                Nhập địa chỉ ví để bắt đầu...
              </div>
            ) : (
              messages.map((x, index) => (
                <div
                  key={index}
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    x.isResponse
                      ? "self-start bg-white text-slate-800 rounded-bl-none border border-slate-100"
                      : "self-end bg-indigo-600 text-white rounded-br-none"
                  }`}
                >
                  {x.msg}
                </div>
              ))
            )}
            {/* Điểm neo để tự động cuộn xuống cuối */}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập liệu: Cố định ở đáy (flex-shrink-0) */}
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3 flex-shrink-0">
            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                type="text"
                placeholder="Gõ tin nhắn..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-slate-700"
              />
              <button
                onClick={handleSendMessage}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all active:scale-95 shadow-md shadow-indigo-100"
              >
                Gửi
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={amountOp}
                onChange={(e) => setAmountOp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOPCoin()}
                type="number"
                step="0.0001"
                min="0"
                placeholder="Số lượng OP muốn gửi"
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-slate-700"
              />
              <button
                onClick={handleSendOPCoin}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all active:scale-95 shadow-md shadow-emerald-100"
              >
                Gửi OP
              </button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Thông tin Blockchain (Scroll độc lập nếu cần) */}
        <div className="md:col-span-4 bg-slate-50 p-6 flex flex-col gap-6 overflow-y-auto h-full border-l border-slate-100">
          <div>
            <h2 className="text-[11px] font-bold text-slate-500 tracking-[0.2em] mb-1 flex items-center gap-2 uppercase">
              {networkInfo.name
                ? `${networkInfo.name} · ChainId ${networkInfo.chainId}`
                : "Network Info"}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h4 className="text-[12px] font-bold text-indigo-500 uppercase mb-2">
                Ví của bạn
              </h4>
              <p className="text-[12px] font-mono text-slate-500 break-all bg-slate-50 p-2 rounded mb-2 border border-slate-100">
                {account || "Đang kết nối..."}
              </p>
              <div className="flex justify-between items-baseline">
                <span className="text-[12px] text-slate-400 font-bold">
                  SỐ DƯ
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {Number(blockchainData.accountOpBalance).toFixed(4)} OP
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h4 className="text-[12px] font-bold text-pink-500 uppercase mb-2">
                Ví người nhận
              </h4>
              <p className="text-[12px] font-mono text-slate-500 break-all bg-slate-50 p-2 rounded mb-2 border border-slate-100">
                {otherAccount || "0x..."}
              </p>
              <div className="flex justify-between items-baseline">
                <span className="text-[12px] text-slate-400 font-bold">
                  SỐ DƯ
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {Number(blockchainData.otherAccountOpBalance).toFixed(4)} OP
                </span>
              </div>
            </div>
          </div>

          {/* Trạng thái kết nối: Cố định ở cuối cột phải */}
          <div className="mt-auto flex items-center gap-2 py-2 px-3 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div
              className={`w-2 h-2 rounded-full ${account ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
              {account ? "MetaMask Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
