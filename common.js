// common.js
import { QuickWallet } from "https://unpkg.com/quick-wallet/dist/quick-wallet.browser.esm.js";
import { message, createDataItemSigner, dryrun } from "https://unpkg.com/@permaweb/aoconnect@0.0.56/dist/browser.js";

// Replace with your actual Process ID
const PROCESS_ID = "<process_id>"; 
const TOKEN_PROCESS_ID = "Sa0i3hNPTkJGSRWaGGpMEPYPeD8BCCBSLryMf9_iJaU"; // Default CRED

let walletAddress = null;
let signer = null;

// Load wallet and RE-INITIALIZE signer
async function loadWalletFromStorage() {
    const stored = localStorage.getItem('ao_novel_wallet');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            // Attempt to reconnect to ensure signer is valid
            // QuickWallet needs to be 'connected' for the signer to work
            await QuickWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"]);
            walletAddress = await QuickWallet.getActiveAddress();
            signer = createDataItemSigner(QuickWallet);
            
            updateWalletUI();
        } catch (e) {
            console.error("Auto-reconnect failed:", e);
            localStorage.removeItem('ao_novel_wallet');
        }
    }
}

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

export async function connectWallet() {
    if (walletAddress) return;
    try {
        await QuickWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"]);
        walletAddress = await QuickWallet.getActiveAddress();
        signer = createDataItemSigner(QuickWallet);
        localStorage.setItem('ao_novel_wallet', JSON.stringify({ address: walletAddress }));
        updateWalletUI();
    } catch (error) {
        console.error("Wallet connection failed:", error);
        alert("钱包连接失败: " + error.message);
    }
}

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
    return null;
}

export async function sendMessage(action, tags = [], data = "") {
    if (!signer) {
        // Try to reconnect if address exists but signer is null
        if (walletAddress) {
             await connectWallet();
        }
        if (!signer) throw new Error("请先连接钱包");
    }
    
    const finalTags = [{ name: "Action", value: action }, ...tags];
    const res = await message({
        process: PROCESS_ID,
        tags: finalTags,
        signer: signer,
        data: data,
    });
    return res;
}

// Send tokens to purchase chapter
export async function buyChapter(novelId, chapterIndex, price) {
    if (!signer) throw new Error("请先连接钱包");
    
    // Send Transfer to Token Process
    const res = await message({
        process: TOKEN_PROCESS_ID,
        tags: [
            { name: "Action", value: "Transfer" },
            { name: "Recipient", value: PROCESS_ID },
            { name: "Quantity", value: price.toString() },
            { name: "X-Action", value: "Buy-Chapter" },
            { name: "X-NovelId", value: novelId },
            { name: "X-ChapterIndex", value: chapterIndex.toString() }
        ],
        signer: signer
    });
    return res;
}

export async function listAllNovels() {
    const data = await dryRun('List-Novels');
    return data ? JSON.parse(data) : [];
}

export async function getNovel(novelId) {
    const data = await dryRun('Get-Novel', [{ name: 'NovelId', value: novelId }]);
    return data ? JSON.parse(data) : null;
}

export async function readChapter(novelId, index) {
    const res = await dryrun({
        process: PROCESS_ID,
        tags: [
            { name: "Action", value: "Read-Chapter" },
            { name: "NovelId", value: novelId },
            { name: "ChapterIndex", value: index.toString() }
        ],
        Owner: walletAddress || "1234567890123456789012345678901234567890123"
    });
    
    if (res.Messages && res.Messages.length > 0) {
        const msg = res.Messages[0];
        // Check if payment required
        if (msg.Data === "PAYMENT_REQUIRED") {
            // Extract price from tags if available, or return special object
            const priceTag = msg.Tags.find(t => t.name === "Price");
            return { 
                status: "PAYMENT_REQUIRED", 
                price: priceTag ? priceTag.value : "0" 
            };
        }
        return { status: "SUCCESS", content: msg.Data };
    }
    throw new Error("No response");
}

export { walletAddress, signer, PROCESS_ID };

if (typeof window !== 'undefined') {
    window.addEventListener('load', loadWalletFromStorage);
}
