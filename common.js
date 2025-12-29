import { QuickWallet } from "https://unpkg.com/quick-wallet/dist/quick-wallet.browser.esm.js";
import { message, createDataItemSigner, dryrun } from "https://unpkg.com/@permaweb/aoconnect@0.0.56/dist/browser.js";

const PROCESS_ID = "51tMVLxBazWMBT9NhfaCuDP3HjQfZOggIcT7l9mRrbw"; // 你必须替换成真实的AO进程ID



let walletAddress = null;
let signer = null;

// 从 localStorage 恢复连接状态
function loadWalletFromStorage() {
    const stored = localStorage.getItem('ao_novel_wallet');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            walletAddress = data.address;
            // signer 无法直接存储，但地址存在即认为已连接（QuickWallet 内部会保持会话）
            updateWalletUI();
        } catch (e) {
            localStorage.removeItem('ao_novel_wallet');
        }
    }
}

// 更新所有页面的钱包显示 UI
function updateWalletUI() {
    document.querySelectorAll('.wallet-address').forEach(el => {
        if (walletAddress) {
            el.textContent = walletAddress;
            el.className = 'wallet-status status-connected';
        } else {
            el.textContent = '未连接';
            el.className = 'wallet-status status-disconnected';
        }
    });
    document.querySelectorAll('#connect-wallet').forEach(btn => {
        if (walletAddress) {
            btn.textContent = '钱包已连接';
            btn.disabled = true;
        } else {
            btn.textContent = '连接Wander钱包';
            btn.disabled = false;
        }
    });
}

// 严格按照来源语法连接钱包
export async function connectWallet() {
    if (walletAddress) return; // 已连接直接返回

    try {
        await QuickWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"]);
        walletAddress = await QuickWallet.getActiveAddress();
        signer = createDataItemSigner(QuickWallet);

        // 持久化到 localStorage
        localStorage.setItem('ao_novel_wallet', JSON.stringify({ address: walletAddress }));

        updateWalletUI();
    } catch (error) {
        console.error("Wallet connection failed:", error);
        alert("钱包连接失败: " + error.message);
    }
}

// dryrun（只读）
export async function dryRun(action, tags = []) {
    const finalTags = [{ name: "Action", value: action }, ...tags];
    const res = await dryrun({
        process: PROCESS_ID,
        tags: finalTags,
        Owner: walletAddress || "1234567890123456789012345678901234567890123"
    });
    if (res.Messages && res.Messages.length > 0) {
        return res.Messages[0].Data;
    }
    return "No data returned";
}

// sendMessage（写操作，严格来源语法）
export async function sendMessage(action, tags = [], data = "") {
    if (!signer) throw new Error("请先连接钱包");
    const finalTags = [{ name: "Action", value: action }, ...tags];
    const res = await message({
        process: PROCESS_ID,
        tags: finalTags,
        signer: signer,
        data: data,
    });
    return res;
}

// 通用函数
export async function listAllNovels() {
    const data = await dryRun('List-Novels');
    return JSON.parse(data);
}

export async function getNovel(novelId) {
    const data = await dryRun('Get-Novel', [{ name: 'NovelId', value: novelId }]);
    return JSON.parse(data);
}

export async function readChapter(novelId, index) {
    const data = await dryRun('Read-Chapter', [{ name: 'NovelId', value: novelId }, { name: 'ChapterIndex', value: index.toString() }]);
    return data;
}

// 导出变量供写操作检查使用
export { walletAddress, signer, PROCESS_ID };

// 页面加载时自动尝试恢复连接
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        loadWalletFromStorage();
    });
}
