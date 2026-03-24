"use client"; // Bắt buộc nếu dùng App Router

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import type { MetaMaskInpageProvider } from "@metamask/providers";
import axiosClient from "../utils/axios-client";

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

export default function WalletConnect() {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [network, setNetwork] = useState<string>("Chưa kết nối");
  const [error, setError] = useState<string>("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const COSTON2_PARAMS = {
    chainId: "0x72",
    chainName: "Flare Testnet Coston2",
    rpcUrls: ["https://coston2-api.flare.network/ext/C/rpc"],
    nativeCurrency: {
      name: "Coston2 Flare",
      symbol: "C2FLR",
      decimals: 18,
    },
    blockExplorerUrls: ["https://coston2-explorer.flare.network/"],
  };

  // 1. Khởi tạo Provider & Lắng nghe sự kiện
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const eth = window.ethereum;
      // Cast về Eip1193Provider để tương thích với BrowserProvider của ethers v6
      const browserProvider = new ethers.BrowserProvider(
        eth as ethers.Eip1193Provider,
      );
      setProvider(browserProvider);

      // Lắng nghe đổi tài khoản
      eth.on("accountsChanged", (accounts: unknown) => {
        const accs = accounts as string[];
        if (accs.length === 0) setAddress(null);
        else updateAccountInfo(browserProvider);
      });

      // Lắng nghe đổi mạng
      eth.on("chainChanged", () => window.location.reload());
    }
  }, []);

  const sendSignatureToBackend = async (address: string, signature: string) => {
    try {
      const response = await axiosClient.post("/api/auth/login", {
        wallet_address: address,
        signature,
      });

      console.log("Login API Response:", response.data);
    } catch (err) {
      console.error("Login API Error:", err);
    }
  };

  // 2. Hàm cập nhật thông tin UI
  const updateAccountInfo = async (currentProvider: ethers.BrowserProvider) => {
    try {
      setIsLoading(true);

      const signer = await currentProvider.getSigner();
      const addr = await signer.getAddress();
      const bal = await currentProvider.getBalance(addr);
      const net = await currentProvider.getNetwork();

      const step1 = await axiosClient.post("/api/auth/address", {
        wallet_address: addr,
      });

      if (step1.status === 200) {
        const step2 = await sendSignatureToBackend(addr, step1.data.signature);
        console.log("Authentication successful, backend response:", step2);
      }

      setAddress(addr);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
      setNetwork(net.name === "unknown" ? "Coston2" : net.name);
    } catch (err) {
      console.error("Update UI Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Hàm kết nối ví & chuyển mạng
  const connectWallet = async () => {
    if (!provider) return alert("Vui lòng cài đặt MetaMask!");

    try {
      // Yêu cầu kết nối tài khoản
      await provider.send("eth_requestAccounts", []);

      // Chuyển mạng
      try {
        await window.ethereum?.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: COSTON2_PARAMS.chainId }],
        });
      } catch (switchError: unknown) {
        if ((switchError as { code: number }).code === 4902) {
          await window.ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [COSTON2_PARAMS],
          });
        } else {
          throw switchError;
        }
      }

      await updateAccountInfo(provider);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
      alert("Kết nối thất bại!");
    }
  };

  return (
    <div className="p-6 max-w-md flex flex-col mx-auto bg-white text-gray-900 rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold">Ví của bạn: {network}</h2>

      {!address ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Kết nối MetaMask
        </button>
      ) : (
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Địa chỉ:</strong>{" "}
            <span className="truncate block">{address}</span>
          </p>
          <p>
            <strong>Số dư:</strong> {balance} C2FLR
          </p>
          <p>
            <strong>Mạng:</strong> {network}
          </p>
          <button
            onClick={() => setAddress(null)} // Giả lập ngắt kết nối UI
            className="text-red-500 underline hover:text-red-700 transition cursor-pointer"
          >
            Ngắt kết nối (UI)
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
