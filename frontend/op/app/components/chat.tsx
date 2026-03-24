"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import Image from "next/image";
import mainLogo from "../../public/Goku instinto superior.jpg";
import contractAddress from "../contract-address/contract-address.json";
// /artifacts/contracts bị bỏ qua bởi .gitignore,
// nó chỉ có sau khi bạn chạy script deploy deploy-chatapp.ts để tạo ra ChatApp.json
import ChatAppArtifact from "../../the-exercises-hardhat/artifacts/contracts/ChatApp.sol/ChatApp.json";

// /contract-address bị bỏ qua bởi .gitignore,
// nó chỉ có sau khi bạn chạy script deploy deploy-chatapp.ts để tạo ra contract-address.json
const CONTRACT_ADDRESS = contractAddress.contractAddress as string;

interface Message {
  msg: string;
  isResponse: boolean;
}

interface BlockchainData {
  accountBalance: string;
  otherAccountBalance: string;
  nbBlocks: number;
}

export default function Chat() {
  const [account, setAccount] = useState<string>("");
  const [otherAccount, setOtherAccount] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [amountEth, setAmountEth] = useState<string>("");
  const [blockchainData, setBlockchainData] = useState<BlockchainData>({
    accountBalance: "0",
    otherAccountBalance: "0",
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
      if (!chatContract || !partnerAddress || !ethers.isAddress(partnerAddress)) {
        return;
      }
      try {
        const winEth = window.ethereum;
        if (!winEth) return;
        const provider = new ethers.BrowserProvider(winEth);
        const contractAddress = await chatContract.getAddress();
        const code = await provider.getCode(contractAddress);
        if (!code || code === "0x") {
          console.error("Không tìm thấy code contract tại", chatContract.address);
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
      if (!winEth || !account) return;

      try {
        const provider = new ethers.BrowserProvider(winEth);

        // Luôn cập nhật số dư
        const myBal = await provider.getBalance(account);
        const blockNum = await provider.getBlockNumber();

        // Chỉ cập nhật số dư người nhận nếu địa chỉ hợp lệ
        let otherBal = ethers.parseEther("0");
        if (partnerAddress && ethers.isAddress(partnerAddress)) {
          otherBal = await provider.getBalance(partnerAddress);
        }

        setBlockchainData({
          accountBalance: ethers.formatEther(myBal),
          otherAccountBalance: partnerAddress
            ? ethers.formatEther(otherBal)
            : "0",
          nbBlocks: blockNum,
        });
      } catch (error) {
        console.error("Lỗi cập nhật số dư:", error);
      }
    },
    [account],
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

      // re-render self
      const myBal = await provider.getBalance(userAddress);
      const blockNum = await provider.getBlockNumber();
      setBlockchainData(prev => ({
        ...prev,
        accountBalance: ethers.formatEther(myBal),
        nbBlocks: blockNum
      }));

      setNetworkInfo({
        name: network.name === "unknown" ? "Flare Coston2 (Testnet) nên không có tên 9 xác" : network.name,
        chainId: network.chainId.toString(),
      });

      setAccount(userAddress);

      const chatContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ChatAppArtifact.abi,
        signer,
      );

      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (!code || code === "0x") {
        console.error("Không tìm thấy code contract tại", CONTRACT_ADDRESS);
        alert("Địa chỉ hợp đồng không hợp lệ trên mạng hiện tại. Vui lòng kiểm tra lại network trong MetaMask hoặc chạy lại script deploy để cập nhật ChatApp.json.");
        return;
      }

      setContract(chatContract);

      // Thêm dấu "_" trước các biến không dùng để vượt qua ESLint no-unused-vars
      chatContract.on(
        "MessageSent",
        (from: string, to: string) => {
          if (from === otherAccount || to === otherAccount) {
            fetchMessages(chatContract, otherAccount, userAddress);
          }
        },
      );

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

  const handleSendEther = async () => {
    if (!amountEth || !otherAccount || !contract) return;

    try {
      const wei = ethers.parseEther(amountEth);
      const tx = await contract.sendEther(otherAccount, { value: wei });
      setAmountEth("");
      await tx.wait();

      updateBalances(otherAccount);
    } catch (error) {
      console.error("Lỗi gửi tiền:", error);
    }
  };

  // Khai báo ref cho phần cuối danh sách tin nhắn
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Hàm thực hiện cuộn xuống cuối
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (contract && otherAccount && account) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMessages(contract, otherAccount, account);
      updateBalances(otherAccount);

      console.log("Contract instance side effect:", contract);
    }
  }, [otherAccount, contract, account, fetchMessages, updateBalances]);

  // Tự động cuộn mỗi khi mảng messages thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-12 w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden h-[85vh] border border-slate-200">
        {/* CỘT TRÁI: Khu vực Chat (Chiếm 8/12 cột) */}
        <div className="md:col-span-8 flex flex-col border-r border-slate-100">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200">
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

          {/* Danh sách tin nhắn */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                Nhập địa chỉ ví để bắt đầu...
              </div>
            ) : (
              messages.map((x, index) => (
                <div
                  key={index}
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    x.isResponse
                      ? "self-start bg-white text-slate-800 rounded-bl-none border border-slate-100"
                      : "self-end bg-indigo-600 text-white rounded-br-none"
                  }`}
                >
                  {x.msg}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập liệu */}
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3">
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
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all active:scale-95"
              >
                Gửi
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={amountEth}
                onChange={(e) => setAmountEth(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendEther()}
                type="number"
                step="0.0001"
                min="0"
                placeholder="Số lượng ETH muốn gửi"
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-slate-700"
              />
              <button
                onClick={handleSendEther}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all active:scale-95"
              >
                Gửi tiền
              </button>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Thông tin Blockchain (Chiếm 4/12 cột) */}
        <div className="md:col-span-4 bg-slate-50 p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 className="text-sm font-bold text-slate-600 tracking-widest mb-1 flex items-center gap-2">
              {networkInfo.name && (
                <span >
                  {networkInfo.name} · ChainId {networkInfo.chainId}
                </span>
              )}
            </h2>
            <p className="text-2xl font-black text-slate-800">
              {blockchainData.nbBlocks}{" "} Blocks
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h4 className="text-[12px] font-bold text-indigo-500 uppercase mb-2">
                Ví của bạn
              </h4>
              <p className="text-[12px] font-mono text-slate-500 break-all bg-slate-50 p-2 rounded mb-2">
                {account || "Đang kết nối..."}
              </p>
              <div className="flex justify-between items-baseline">
                <span className="text-[12px] text-slate-400 font-bold">
                  SỐ DƯ
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {Number(blockchainData.accountBalance).toFixed(4)} ETH
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h4 className="text-[12px] font-bold text-pink-500 uppercase mb-2">
                Ví người nhận
              </h4>
              <p className="text-[12px] font-mono text-slate-500 break-all bg-slate-50 p-2 rounded mb-2">
                {otherAccount || "0x..."}
              </p>
              <div className="flex justify-between items-baseline">
                <span className="text-[12px] text-slate-400 font-bold">
                  SỐ DƯ
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {Number(blockchainData.otherAccountBalance).toFixed(4)} ETH
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto flex items-center gap-2 py-2 px-3 bg-white rounded-lg border border-slate-200">
            <div
              className={`w-2 h-2 rounded-full ${account ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            />
            <span className="text-[12px] font-bold text-slate-600 uppercase tracking-tight">
              {account ? "MetaMask Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
