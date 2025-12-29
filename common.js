/**
 * AO小说平台 - Wander钱包连接 & AO交互完整模块
 * Process ID: 51tMVLxBazWMBT9NhfaCuDP3HjQfZOggIcT7l9mRrbw
 * 支持最新aoconnect browser bundle
 * 详细中文日志 + 错误处理 + 自动重连
 */

const PROCESS_ID = "51tMVLxBazWMBT9NhfaCuDP3HjQfZOggIcT7l9mRrbw";
window.PROCESS_ID = PROCESS_ID;

let walletAddress = null;
window.walletAddress = null;
let signer = null;

// 更新钱包显示状态
function updateWalletDisplay(addr) {
    walletAddress = addr;
    window.walletAddress = addr;
    const addrEl = document.getElementById('wallet-address');
    const btnEl = document.getElementById('connect-wallet');
    
    if (addr) {
        const shortAddr = addr.slice(0, 6) + '...' + addr.slice(-4);
        addrEl.textContent = shortAddr;
        addrEl.className = 'wallet-status status-connected';
        btnEl.textContent = '✅ 已连接';
        btnEl.disabled = true;
        console.log('[钱包] ✅ 连接成功:', addr);
    } else {
        addrEl.textContent = '未连接';
        addrEl.className = 'wallet-status status-disconnected';
        btnEl.textContent = '连接Wander钱包';
        btnEl.disabled = false;
    }
}

// 🔑 主钱包连接函数（详细错误处理）
window.connectWallet = async function() {
    console.log('[钱包] 🚀 开始连接Wander钱包...');
    
    // 1. 检查Wander扩展
    if (typeof window.arweaveWallet === 'undefined') {
        console.error('[钱包] ❌ 未检测到Wander扩展');
        alert(`❌ 未检测到Wander钱包扩展！\n\n🚀 解决步骤：\n1. 安装最新版Wander: https://www.wander.app/download\n2. 固定到工具栏，点击图标输入密码解锁\n3. 刷新页面(Ctrl+Shift+R)\n4. 确保通过http://localhost打开（不要直接双击HTML）\n\n控制台检查: window.arweaveWallet`);
        return false;
    }
    console.log('[钱包] ✅ Wander扩展已检测');

    // 2. 检查aoconnect
    if (!window.aoconnect) {
        console.error('[钱包] ❌ aoconnect未加载');
        alert('❌ aoconnect库加载失败！请等待5秒后重试，或检查网络。');
        return false;
    }
    console.log('[钱包] ✅ aoconnect已加载');

    try {
        // 3. 请求权限（包含SIGNATURE以防auth required）
        console.log('[钱包] 🔐 请求连接权限...');
        await window.arweaveWallet.connect([
            'ACCESS_ADDRESS', 
            'SIGN_TRANSACTION', 
            'SIGNATURE', 
            'DISPATCH'
        ]);
        
        // 4. 获取地址
        const addr = await window.arweaveWallet.getActiveAddress();
        console.log('[钱包] 📍 获取地址:', addr);
        
        if (!addr) {
            throw new Error('无法获取钱包地址，请在Wander中切换/创建钱包');
        }
        
        // 5. 创建签名器
        signer = window.aoconnect.createDataItemSigner(window.arweaveWallet);
        console.log('[钱包] ✍️ 签名器创建成功');
        
        // 6. 更新UI
        updateWalletDisplay(addr);
        alert(`✅ 钱包连接成功！\n地址: ${addr.slice(0, 8)}...\n\n📝 现在可以创建小说、添加章节等操作了`);
        return true;
        
    } catch (err) {
        console.error('[钱包] ❌ 连接失败:', err);
        
        let errorMsg = err.message || '未知错误';
        if (errorMsg.includes('auth required') || errorMsg.includes('password')) {
            errorMsg = '钱包未解锁！请点击浏览器右上角Wander图标，输入密码解锁';
        } else if (errorMsg.includes('context invalidated')) {
            errorMsg = '会话过期！请在Wander设置中"断开所有连接"后重试';
        } else if (errorMsg.includes('user reject')) {
            errorMsg = '用户拒绝连接，请重新批准权限';
        }
        
        alert(`❌ 钱包连接失败！\n\n错误: ${errorMsg}\n\n🔧 解决步骤：\n1️⃣ 点击Wander图标(⛵️) → 输入密码解锁\n2️⃣ 批准本网站所有权限\n3️⃣ 断开旧连接: Wander设置 → Connected Apps → Disconnect All\n4️⃣ 隐身模式测试(Ctrl+Shift+N)\n5️⃣ 重启浏览器\n\n💡 控制台(F12)查看详细日志`);
        updateWalletDisplay(null);
        return false;
    }
};

// 🔍 AO Dryrun查询（读操作，无需签名）
window.aoDryrun = async (tags, owner = walletAddress) => {
    console.log('[AO] 🔍 执行dryrun查询:', tags);
    
    if (!window.aoconnect) {
        throw new Error('aoconnect库未加载，请刷新页面');
    }
    
    try {
        const res = await window.aoconnect.dryrun({ 
            process: PROCESS_ID, 
            tags, 
            owner 
        });
        console.log('[AO] 🔍 dryrun结果:', res);
        
        // 智能解析输出（兼容不同AO进程格式）
        let output = '';
        if (res.Output) {
            output = typeof res.Output === 'string' ? res.Output : JSON.stringify(res.Output, null, 2);
        } else if (res.Messages && res.Messages[0] && res.Messages[0].Data) {
            output = res.Messages[0].Data;
        } else if (res.Messages) {
            output = JSON.stringify(res.Messages, null, 2);
        } else {
            output = JSON.stringify(res, null, 2);
        }
        
        return output || '无数据返回';
    } catch (e) {
        console.error('[AO] ❌ dryrun失败:', e);
        throw new Error(`查询失败: ${e.message}`);
    }
};

// 📤 AO Message写入（需要签名）
window.aoMessage = async (tags, data = '') => {
    console.log('[AO] 📤 执行message写入:', tags, '数据长度:', data.length);
    
    if (!signer) {
        throw new Error('请先连接钱包！');
    }
    if (!window.aoconnect) {
        throw new Error('aoconnect库未加载，请刷新页面');
    }
    
    try {
        // 发送消息
        const msgId = await window.aoconnect.message({ 
            process: PROCESS_ID, 
            signer, 
            tags, 
            data 
        });
        console.log('[AO] 📤 消息ID:', msgId);
        
        // 等待结果（30秒超时）
        const res = await Promise.race([
            window.aoconnect.result({ message: msgId, process: PROCESS_ID }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('超时：AO进程30秒无响应')), 30000)
            )
        ]);
        
        console.log('[AO] 📤 结果:', res);
        
        // 智能解析输出
        let output = '';
        if (res.Output) {
            output = typeof res.Output === 'string' ? res.Output : JSON.stringify(res.Output, null, 2);
        } else if (res.Messages && res.Messages[0] && res.Messages[0].Data) {
            output = res.Messages[0].Data;
        } else if (res.Error) {
            throw new Error(`AO进程错误: ${res.Error}`);
        } else {
            output = JSON.stringify(res, null, 2);
        }
        
        return output || '操作完成（无详细输出）';
    } catch (e) {
        console.error('[AO] ❌ message失败:', e);
        throw new Error(`写入失败: ${e.message}`);
    }
};

// 页面加载时自动检查钱包状态
window.addEventListener('load', async () => {
    console.log('[小说平台] 🌐 初始化中...');
    console.log('当前时间:', new Date().toLocaleString('zh-CN'));
    console.log('User-Agent:', navigator.userAgent);
    
    // 延迟检查，确保Wander注入完成
    setTimeout(async () => {
        if (window.arweaveWallet) {
            try {
                console.log('[初始化] 检查现有会话...');
                const addr = await window.arweaveWallet.getActiveAddress();
                if (addr) {
                    console.log('[初始化] 检测到现有连接:', addr);
                    updateWalletDisplay(addr);
                    signer = window.aoconnect.createDataItemSigner(window.arweaveWallet);
                } else {
                    console.log('[初始化] 无活跃会话，需要手动连接');
                }
            } catch (e) {
                console.log('[初始化] 会话检查失败（正常，需要解锁）:', e.message);
            }
        }
    }, 1000);
    
    console.log('[小说平台] ✅ 初始化完成');
});

// 导出调试函数（开发者控制台使用）
window.debugAO = {
    dryrun: window.aoDryrun,
    message: window.aoMessage,
    wallet: window.arweaveWallet,
    aoconnect: window.aoconnect,
    processId: PROCESS_ID
};
console.log('[调试] 在控制台输入 window.debugAO 查看所有API');
