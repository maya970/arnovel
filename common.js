<!-- common.js - 保存为 common.js 文件 -->
<script type="module">
    import { createDataItemSigner, message, dryrun } from "https://unpkg.com/@permaweb/aoconnect@0.0.52";

    const PROCESS_ID = "51tMVLxBazWMBT9NhfaCuDP3HjQfZOggIcT7l9mRrbw";
    window.PROCESS_ID = PROCESS_ID;

    let walletAddress = null;
    window.walletAddress = null;
    let signer = null;

    // 更新所有页面显示钱包地址的元素
    function updateWalletDisplay(addr) {
        walletAddress = addr;
        window.walletAddress = addr;
        document.querySelectorAll('.wallet-address, #connectBtn').forEach(el => {
            el.textContent = addr.slice(0, 6) + '...' + addr.slice(-4);
            el.classList.add('text-green-600');
            el.classList.remove('hover:bg-slate-800');
        });
    }

    // 连接钱包函数（兼容 Wander / ArConnect）
    window.connectWallet = async function() {
        if (!window.arweaveWallet) {
            alert("未检测到 Wander 钱包扩展，请安装 Wander（原 ArConnect）浏览器扩展：https://www.wander.app/download");
            return false;
        }

        try {
            await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'SIGNATURE']);
            const addr = await window.arweaveWallet.getActiveAddress();
            updateWalletDisplay(addr);
            signer = createDataItemSigner(window.arweaveWallet);
            return true;
        } catch (err) {
            console.error(err);
            alert("钱包连接失败，请在 Wander 扩展中授权此网站");
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

    // 页面加载后自动检测是否已连接
    window.addEventListener('load', async () => {
        if (window.arweaveWallet) {
            try {
                const addr = await window.arweaveWallet.getActiveAddress();
                if (addr) {
                    updateWalletDisplay(addr);
                    signer = createDataItemSigner(window.arweaveWallet);
                }
            } catch (e) {
                // 未授权，不处理
            }
        }
    });
</script>
