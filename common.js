import { QuickWallet } from "https://unpkg.com/quick-wallet/dist/quick-wallet.browser.esm.js";
import { message, createDataItemSigner, dryrun } from "https://unpkg.com/@permaweb/aoconnect@0.0.56/dist/browser.js";

const PROCESS_ID = "51tMVLxBazWMBT9NhfaCuDP3HjQfZOggIcT7l9mRrbw"; // 你必须替换成真实的AO进程ID

let walletAddress = null;
let signer = null;

// 严格按照原代码的连接逻辑
export async function connectWallet() {
    try {
        // 原代码精确权限
        await QuickWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"]);
        walletAddress = await QuickWallet.getActiveAddress();
        signer = createDataItemSigner(QuickWallet);  // 原代码必须这一步，用于后续message签名
        
        // 更新所有页面可能的显示元素
        document.querySelectorAll('.wallet-address').forEach(el => {
            el.textContent = walletAddress;
            el.className = 'wallet-status status-connected';
        });
        document.querySelectorAll('#connect-wallet').forEach(btn => {
            btn.textContent = '钱包已连接';
            btn.disabled = true;
        });
    } catch (error) {
        console.error("Wallet connection failed:", error);
        alert("钱包连接失败: " + error.message);
    }
}

// dryrun 只读查询（所有页面都需要）
export async function dryRun(action, tags = []) {
    const finalTags = [{ name: "Action", value: action }, ...tags];
    const res = await dryrun({
        process: PROCESS_ID,
        tags: finalTags,
        Owner: walletAddress || "1234567890123456789012345678901234567890123" // 原代码dummy地址
    });
    if (res.Messages && res.Messages.length > 0) {
        return res.Messages[0].Data;
    }
    return "No data returned";
}

// 以下函数保持不变
export async function listAllNovels() {
    const data = await dryRun('List-Novels');
    return JSON.parse(data);
}

export async function getNovel(novelId) {
    const data = await dryRun('Get-Novel', [{ name: 'NovelId', value: novelId }]);
    return JSON.parse(data);
}

export async function readChapter(novelId, index) {
    const data = await dryRun('Read-Chapter', [
        { name: 'NovelId', value: novelId },
        { name: 'ChapterIndex', value: index.toString() }
    ]);
    return data;
}

// 导出以便前台后续扩展购买等写操作时使用（虽然现在前台只读，但保留完整性）
export { walletAddress, signer, message, PROCESS_ID };
