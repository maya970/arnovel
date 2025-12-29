import { QuickWallet } from "https://unpkg.com/quick-wallet/dist/quick-wallet.browser.esm.js";
import { dryrun } from "https://unpkg.com/@permaweb/aoconnect@0.0.56/dist/browser.js";

const PROCESS_ID = "<process_id>"; // 必须替换
let walletAddress = null;

async function connectWallet() {
    try {
        await QuickWallet.connect(["ACCESS_ADDRESS"]);
        walletAddress = await QuickWallet.getActiveAddress();
        document.querySelectorAll('.wallet-address').forEach(el => {
            el.textContent = walletAddress.slice(0,6) + '...' + walletAddress.slice(-4);
            el.className = 'wallet-status status-connected';
        });
        document.getElementById('connect-wallet').textContent = '已连接';
    } catch (e) {
        alert("连接失败: " + e.message);
    }
}

async function dryRun(action, tags = []) {
    const finalTags = [{ name: "Action", value: action }, ...tags];
    const res = await dryrun({
        process: PROCESS_ID,
        tags: finalTags,
        Owner: walletAddress || "dummy"
    });
    if (res.Messages?.length > 0) return res.Messages[0].Data;
    throw new Error("无返回数据");
}

async function listAllNovels() {
    const data = await dryRun('List-Novels');
    return JSON.parse(data);
}

async function getNovel(novelId) {
    const data = await dryRun('Get-Novel', [{ name: 'NovelId', value: novelId }]);
    return JSON.parse(data);
}

async function readChapter(novelId, index) {
    const data = await dryRun('Read-Chapter', [
        { name: 'NovelId', value: novelId },
        { name: 'ChapterIndex', value: index.toString() }
    ]);
    return data; // 可能是纯文本或JSON
}
