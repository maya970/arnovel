// common.js
import { createDataItemSigner, message, dryrun } from "https://unpkg.com/@permaweb/aoconnect@0.0.52";

const PROCESS_ID = "51tMVLxBazWMBT9NhfaCuDP3HjQfZOggIcT7l9mRrbw";
window.PROCESS_ID = PROCESS_ID;

let walletAddress = null;
window.walletAddress = null;
let signer = null;

// 更新显示
function updateWalletDisplay(addr) {
    walletAddress = addr;
    window.walletAddress = addr;
    document.querySelectorAll('.wallet-address, #connectBtn').forEach(el => {
        el.textContent = addr.slice(0, 6) + '...' + addr.slice(-4);
        el.classList.add('text-green-600');
        el.classList.remove('hover:bg-slate-800');
    });
    console.log("Wallet connected:", addr);
}

// 连接函数（增强调试）
window.connectWallet = async function() {
    console.log("Attempting wallet connection...");
    if (!window.arweaveWallet) {
        console.error("Wander wallet extension not detected.");
        alert("未检测到 Wander 钱包扩展。请安装最新版 Wander（https://www.wander.app/download），并确保启用和登录。安装后刷新页面重试。");
        return false;
    }

    try {
        console.log("Calling connect...");
        await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'SIGNATURE']);
        const addr = await window.arweaveWallet.getActiveAddress();
        updateWalletDisplay(addr);
        signer = createDataItemSigner(window.arweaveWallet);
        console.log("Connection successful.");
        return true;
    } catch (err) {
        console.error("Connection error:", err);
        alert("连接失败：请检查 Wander 扩展是否登录、授权本网站，或刷新页面重试。错误详情：" + err.message);
        return false;
    }
};


    // 公共 AO 操作函数
    window.aoDryrun = async (tags, owner = walletAddress) => {
        return await dryrun({ process: PROCESS_ID, tags, owner });
    };

    window.aoMessage = async (tags, data = null) => {
        if (!signer) throw new Error("请先连接钱包");
        return await message({
            process: PROCESS_ID,
            signer: signer,
            tags,
            data
        });
    };


// 自动检测
window.addEventListener('load', async () => {
    if (window.arweaveWallet) {
        try {
            const addr = await window.arweaveWallet.getActiveAddress();
            if (addr) {
                updateWalletDisplay(addr);
                signer = createDataItemSigner(window.arweaveWallet);
                console.log("Auto-connected to existing session.");
            }
        } catch (e) {
            console.log("No existing session.");
        }
    } else if (navigator.userAgent.match(/Mobi|Android/)) {
        alert("如果是移动端，请使用 Wander 移动 App 的 'Explore Apps' 连接 DApp。浏览器扩展仅限桌面。");
    }
});
</script>
