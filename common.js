import { createDataItemSigner, message, dryrun, result } from "https://unpkg.com/@permaweb/aoconnect";

const PROCESS_ID = "51tMVLxBazWMBT9NhfaCuDP3HjQfZOggIcT7l9mRrbw";
window.PROCESS_ID = PROCESS_ID;

let walletAddress = null;
window.walletAddress = null;
let signer = null;

function updateWalletDisplay(addr) {
    walletAddress = addr;
    window.walletAddress = addr;
    document.querySelectorAll('.wallet-address, #connect-wallet').forEach(el => {
        el.textContent = addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : 'Connect Wallet (Wander)';
        if (addr) {
            el.classList.add('text-green-600');
            el.classList.remove('hover:bg-slate-800', 'bg-slate-900');
        }
    });
}

window.connectWallet = async function() {
    console.log("[DEBUG] Starting wallet connection...");
    if (!window.arweaveWallet) {
        console.error("[ERROR] Wander extension not detected. Ensure it's installed and enabled.");
        alert("未检测到 Wander 钱包扩展！请确保：1. 安装最新版 Wander[](https://www.wander.app/download)；2. 在扩展中登录钱包；3. 刷新页面 (Ctrl+Shift+R) 重试。如果仍无反应，重启浏览器或检查扩展权限。");
        return false;
    }

    try {
        console.log("[DEBUG] Calling connect with permissions...");
        await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'SIGNATURE']);
        const addr = await window.arweaveWallet.getActiveAddress();
        updateWalletDisplay(addr);
        signer = createDataItemSigner(window.arweaveWallet);
        console.log("[SUCCESS] Wallet connected:", addr);
        alert("钱包连接成功！");
        return true;
    } catch (err) {
        console.error("[ERROR] Connection failed:", err);
        alert("连接失败！请在 Wander 扩展中检查：1. 是否已登录钱包；2. 批准本网站权限；3. 无浏览器扩展冲突。错误详情: " + err.message + "\n刷新页面重试。");
        return false;
    }
};

window.aoDryrun = async (tags, owner = walletAddress) => {
    const res = await dryrun({ process: PROCESS_ID, tags, owner });
    // Parse for queries (prioritize Messages[0].Data as common in AO reads; fallback to Output or JSON)
    return res.Messages?.[0]?.Data || res.Output || JSON.stringify(res) || 'Error';
};

window.aoMessage = async (tags, data = '') => {
    if (!signer) throw new Error("请先连接钱包");
    const msgId = await message({
        process: PROCESS_ID,
        signer: signer,
        tags,
        data
    });
    const res = await result({ message: msgId, process: PROCESS_ID });
    // Parse for mutations (prioritize Output as common in writes; fallback to Messages[0].Data or JSON)
    return res.Output || res.Messages?.[0]?.Data || JSON.stringify(res) || res.Error || 'Error';
};

window.addEventListener('load', async () => {
    console.log("[DEBUG] Page loaded, checking for existing wallet session...");
    if (window.arweaveWallet) {
        try {
            const addr = await window.arweaveWallet.getActiveAddress();
            if (addr) {
                updateWalletDisplay(addr);
                signer = createDataItemSigner(window.arweaveWallet);
                console.log("[SUCCESS] Auto-connected to existing session:", addr);
            } else {
                console.log("[INFO] No existing session found.");
            }
        } catch (e) {
            console.log("[INFO] No active wallet session.");
        }
    } else {
        console.warn("[WARN] No wallet extension detected on load.");
    }
});
