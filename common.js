const PROCESS_ID = "51tMVLxBazWMBT9NhfaCuDP3HjQfZOggIcT7l9mRrbw";
window.PROCESS_ID = PROCESS_ID;

let walletAddress = null;
window.walletAddress = null;
let signer = null;

function updateWalletDisplay(addr) {
    walletAddress = addr;
    window.walletAddress = addr;
    const elements = document.querySelectorAll('.wallet-address, #connect-wallet');
    elements.forEach(el => {
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
        console.error("[ERROR] Wander extension not detected.");
        alert("未检测到 Wander 钱包扩展！请确保安装最新版[](https://www.wander.app/download)，登录钱包，刷新页面 (Ctrl+Shift+R)。如果仍无效，重启浏览器或检查扩展权限。");
        return false;
    }

    try {
        console.log("[DEBUG] Calling connect...");
        await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'SIGNATURE']);
        const addr = await window.arweaveWallet.getActiveAddress();
        updateWalletDisplay(addr);
        signer = window.aoconnect.createDataItemSigner(window.arweaveWallet);  // Use aoconnect from browser bundle
        console.log("[SUCCESS] Connected:", addr);
        alert("钱包连接成功！");
        return true;
    } catch (err) {
        console.error("[ERROR] Failed:", err);
        alert("连接失败！请在 Wander 扩展中检查：1. 是否已登录/解锁钱包（输入密码）；2. 批准本网站权限；3. 无扩展冲突。错误: " + err.message + "\n尝试 Ctrl+Shift+R 刷新，或隐身模式测试。");
        return false;
    }
};

window.aoDryrun = async (tags, owner = walletAddress) => {
    if (!window.aoconnect) throw new Error('aoconnect 未加载 - 请检查网络，刷新页面。');
    try {
        const res = await window.aoconnect.dryrun({ process: PROCESS_ID, tags, owner });
        return res.Messages?.[0]?.Data || res.Output || JSON.stringify(res) || 'Error';
    } catch (e) {
        throw new Error('Dryrun 失败: ' + e.message);
    }
};

window.aoMessage = async (tags, data = '') => {
    if (!signer) throw new Error("请先连接钱包");
    if (!window.aoconnect) throw new Error('aoconnect 未加载 - 请检查网络，刷新页面。');
    try {
        const msgId = await window.aoconnect.message({ process: PROCESS_ID, signer, tags, data });
        const res = await window.aoconnect.result({ message: msgId, process: PROCESS_ID });
        return res.Output || res.Messages?.[0]?.Data || JSON.stringify(res) || res.Error || 'Error';
    } catch (e) {
        throw new Error('Message 失败: ' + e.message);
    }
};

window.addEventListener('load', async () => {
    console.log("[DEBUG] Checking wallet session...");
    if (window.arweaveWallet) {
        try {
            const addr = await window.arweaveWallet.getActiveAddress();
            if (addr) {
                updateWalletDisplay(addr);
                signer = window.aoconnect.createDataItemSigner(window.arweaveWallet);
                console.log("[SUCCESS] Auto-connected:", addr);
            }
        } catch (e) {
            console.log("[INFO] No active session - 请解锁钱包。");
        }
    } else {
        console.warn("[WARN] No wallet detected.");
    }
});
