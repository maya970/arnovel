// AO 进程 ID
const PROCESS_ID = "51tMVLxBazWMBT9NhfaCuDP3HjQfZOggIcT7l9mRrbw";
window.PROCESS_ID = PROCESS_ID;

let walletAddress = null;
window.walletAddress = null;
let signer = null;

// 更新页面上所有地址显示
function updateWalletDisplay(addr) {
    walletAddress = addr;
    window.walletAddress = addr;
    document.querySelectorAll('.wallet-address, #connect-wallet').forEach(el => {
        if (addr) {
            el.textContent = addr.slice(0, 6) + '...' + addr.slice(-4);
            el.classList.add('text-green-600');
        } else {
            el.textContent = '连接钱包 (Wander)';
        }
    });
}

// 全局连接函数
window.connectWallet = async function () {
    console.log("[Wander] 开始连接钱包...");

    if (!window.arweaveWallet) {
        alert("未检测到 Wander 钱包扩展！\n\n请确保：\n1. 已安装最新版 Wander（https://www.wander.app/download）\n2. 已登录并解锁钱包（输入密码）\n3. 刷新页面（Ctrl+Shift+R）");
        return false;
    }

    try {
        // 请求必要权限
        await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'SIGNATURE']);

        const addr = await window.arweaveWallet.getActiveAddress();
        updateWalletDisplay(addr);

        // 使用 browser bundle 提供的 createDataItemSigner
        signer = window.aoconnect.createDataItemSigner(window.arweaveWallet);

        console.log("[Wander] 连接成功:", addr);
        alert("钱包连接成功！\n地址: " + addr);
        return true;
    } catch (err) {
        console.error("[Wander] 连接失败:", err);
        alert("连接失败！\n\n常见原因：\n1. Wander 扩展未解锁（请点击扩展图标输入密码）\n2. 未批准本站权限\n3. 浏览器缓存问题（尝试隐身模式）\n\n错误信息：" + err.message);
        return false;
    }
};

// Dryrun 查询（读取操作）
window.aoDryrun = async function (tags, owner = walletAddress) {
    if (!window.aoconnect) throw new Error("aoconnect 未加载，请刷新页面");
    try {
        const res = await window.aoconnect.dryrun({ process: PROCESS_ID, tags, owner });
        return res.Messages?.[0]?.Data || res.Output?.data?.output || JSON.stringify(res, null, 2) || '无返回数据';
    } catch (e) {
        throw new Error("查询失败: " + e.message);
    }
};

// 发送消息（写操作，需要签名）
window.aoMessage = async function (tags, data = '') {
    if (!signer) throw new Error("请先连接钱包");
    if (!window.aoconnect) throw new Error("aoconnect 未加载，请刷新页面");
    try {
        const msgId = await window.aoconnect.message({
            process: PROCESS_ID,
            signer,
            tags,
            data
        });
        const res = await window.aoconnect.result({ message: msgId, process: PROCESS_ID });
        return res.Output?.data?.output || res.Messages?.[0]?.Data || JSON.stringify(res, null, 2) || '操作成功（无详细返回）';
    } catch (e) {
        throw new Error("操作失败: " + e.message);
    }
};

// 页面加载时尝试自动连接（如果已有会话）
window.addEventListener('load', async () => {
    if (window.arweaveWallet) {
        try {
            const addr = await window.arweaveWallet.getActiveAddress();
            if (addr) {
                updateWalletDisplay(addr);
                signer = window.aoconnect.createDataItemSigner(window.arweaveWallet);
                console.log("[Wander] 自动连接成功:", addr);
            }
        } catch (e) {
            console.log("[Wander] 无活跃会话，需要手动连接");
        }
    }
});
