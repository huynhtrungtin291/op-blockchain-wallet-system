// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ChatApp {
    
    struct Message {
        address sender;
        string content;
        uint256 timestamp; // Bổ sung thời gian để React dễ dàng sắp xếp tin nhắn
    }

    // Thay vì lưu 2 lần, ta dùng 1 mã ID chung cho mỗi cặp trò chuyện
    mapping(bytes32 => Message[]) private conversationMessages;

    // Chuẩn hóa tên Event (Viết hoa chữ cái đầu)
    event MessageSent(address indexed from, address indexed to, string message, uint256 timestamp);
    event EtherSent(address indexed from, address indexed to, uint256 amount, bool success);

    /**
     * @dev Tạo ra một ID duy nhất cho đoạn chat giữa 2 người.
     * Dù A nhắn cho B hay B nhắn cho A, ID sinh ra luôn giống hệt nhau.
     */
    function _getConversationId(address user1, address user2) private pure returns (bytes32) {
        if (user1 < user2) {
            return keccak256(abi.encodePacked(user1, user2));
        } else {
            return keccak256(abi.encodePacked(user2, user1));
        }
    }

    /**
     * @dev Gửi tin nhắn
     */
    function sendMessage(address to, string calldata _content) external {
        require(to != address(0), "Invalid recipient address");
        require(bytes(_content).length > 0, "Message cannot be empty");

        // Tính toán ID phòng chat
        bytes32 convoId = _getConversationId(msg.sender, to);
        
        // Chỉ lưu 1 lần duy nhất (Tiết kiệm 50% phí Gas so với code cũ)
        conversationMessages[convoId].push(Message({
            sender: msg.sender,
            content: _content,
            timestamp: block.timestamp
        }));

        emit MessageSent(msg.sender, to, _content, block.timestamp);
    }

    /**
     * @dev Lấy toàn bộ tin nhắn giữa người gọi hàm và một người khác
     * Không cần dùng Event để trả data như code cũ, hàm view sẽ trả thẳng về mảng cho React.
     */
    function getMessages(address otherUser) external view returns (Message[] memory) {
        bytes32 convoId = _getConversationId(msg.sender, otherUser);
        return conversationMessages[convoId];
    }

    /**
     * @dev Chuyển tiền Ether đính kèm
     */
    function sendEther(address to) external payable {
        require(msg.value > 0, "Must send some Ether");
        require(to != address(0), "Invalid recipient address");

        // Sử dụng call thay cho send/transfer (Tiêu chuẩn bảo mật mới của Solidity)
        (bool success, ) = to.call{value: msg.value}("");
        require(success, "Failed to send Ether");

        emit EtherSent(msg.sender, to, msg.value, success);
    }
}