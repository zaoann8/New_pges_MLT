/* admin/index 模块3：消息通知与Cloudflare配置逻辑 */
        // ==================== 消息通知设置相关函数 ====================

        // 更新 Telegram 按钮状态和颜色
        function updateTelegramButtonStates(isConfigured) {
            // 获取 Telegram 按钮元素（第一组通知按钮是 Telegram）
            const buttons = document.querySelectorAll('.notification-controls');

            if (buttons.length > 0) {
                const telegramControls = buttons[0];
                const configBtn = telegramControls.querySelector('.btn-notification-config');
                const clearBtn = telegramControls.querySelector('.btn-clear-config');

                if (isConfigured) {
                    // 已配置：参数配置按钮为绿色，清除配置按钮为红色且可点击
                    clearBtn.classList.remove('btn-not-configured');
                    clearBtn.classList.add('btn-configured');
                    clearBtn.disabled = false;
                } else {
                    // 未配置：参数配置按钮保持绿色，清除配置按钮为灰色且禁用
                    clearBtn.classList.remove('btn-configured');
                    clearBtn.classList.add('btn-not-configured');
                    clearBtn.disabled = true;
                }
            }
        }

        // 清除 Telegram 配置
        async function clearTelegramConfig() {
            if (confirm('确定要清除 Telegram 配置吗？')) {
                currentConfig.TG = {
                    BotToken: null,
                    ChatID: null,
                    启用: false
                };

                try {
                    await saveConfigToServer('notification');
                    showToast('Telegram 配置已清除', 'success');
                    updateTelegramButtonStates(false);
                    const telegramCheckbox = document.getElementById('telegramEnabled');
                    telegramCheckbox.disabled = true;
                    telegramCheckbox.checked = false;
                } catch (error) {
                    showToast('清除配置失败: ' + error.message, 'error');
                }
            }
        }

        // 更新 Cloudflare 按钮状态和颜色
        function updateCloudflareButtonStates(isConfigured) {
            // 获取 Cloudflare 按钮元素（第二组通知按钮是 Cloudflare）
            const buttons = document.querySelectorAll('.notification-controls');

            if (buttons.length > 1) {
                const cloudflareControls = buttons[1];
                const clearBtn = cloudflareControls.querySelector('.btn-clear-config');

                if (isConfigured) {
                    // 已配置：清除配置按钮为红色且可点击
                    clearBtn.classList.remove('btn-not-configured');
                    clearBtn.classList.add('btn-configured');
                    clearBtn.disabled = false;
                } else {
                    // 未配置：清除配置按钮为灰色且禁用
                    clearBtn.classList.remove('btn-configured');
                    clearBtn.classList.add('btn-not-configured');
                    clearBtn.disabled = true;
                }
            }
        }

        // 清除 Cloudflare 配置
        async function clearCloudflareConfig() {
            if (confirm('确定要清除 Cloudflare 配置吗？')) {
                currentConfig.CF = {
                    Usage: null,
                    启用: false
                };

                try {
                    await saveConfigToServer('notification');
                    showToast('Cloudflare 配置已清除', 'success');
                    updateCloudflareButtonStates(false);
                } catch (error) {
                    showToast('清除配置失败: ' + error.message, 'error');
                }
            }
        }

        // 打开 TelegramBot 配置模态框
        function openTelegramConfigModal() {
            document.getElementById('telegramConfigModal').classList.add('show');
            // 只加载Chat ID，不加载Bot Token（因为Bot Token是敏感信息）
            const chatID = currentConfig.TG?.ChatID || currentConfig.通知?.Telegram?.ChatID || '';
            document.getElementById('telegramBotToken').value = '';
            document.getElementById('telegramChatID').value = chatID;

            // 重置状态和保存按钮
            document.getElementById('telegramStatus').style.display = 'none';
            document.getElementById('telegramStatus').textContent = '';
            document.getElementById('telegramConfirmBtn').disabled = true;
            document.getElementById('telegramConfirmBtn').style.opacity = '0.5';
        }

        // 关闭 TelegramBot 配置模态框
        function closeTelegramConfigModal(event) {
            if (event && event.target.id !== 'telegramConfigModal') return;
            document.getElementById('telegramConfigModal').classList.remove('show');
        }

        // 测试 TelegramBot 连接
        async function testTelegramConfig() {
            const token = document.getElementById('telegramBotToken').value.trim();
            const chatID = document.getElementById('telegramChatID').value.trim();
            const statusEl = document.getElementById('telegramStatus');
            const confirmBtn = document.getElementById('telegramConfirmBtn');
            const testBtn = event.target;

            if (!token || !chatID) {
                statusEl.textContent = '❌ 请填写Bot Token和Chat ID';
                statusEl.style.display = 'block';
                statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                statusEl.style.color = '#fff';
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.5';
                return;
            }

            try {
                testBtn.disabled = true;
                statusEl.textContent = '⏳ 验证中...';
                statusEl.style.display = 'block';
                statusEl.style.background = 'linear-gradient(135deg, #3b82f6 0, #1d4ed8 100%)';
                statusEl.style.color = '#fff';

                // 第一步：验证 Bot Token 的有效性
                const getUrlParams = new URLSearchParams({
                    access_token: token
                });
                const getMeUrl = `https://api.telegram.org/bot${token}/getMe`;

                const getMeResponse = await fetch(getMeUrl);
                if (!getMeResponse.ok) {
                    throw new Error('Bot Token 无效，无法获取机器人信息');
                }

                const getMeData = await getMeResponse.json();
                if (!getMeData.ok) {
                    throw new Error('Bot Token 无效: ' + (getMeData.description || '未知错误'));
                }

                // 第二步：通过Bot Token向Chat ID推送测试消息
                const sendUrlParams = new URLSearchParams({
                    chat_id: chatID,
                    text: '✅ Telegram 通知配置已验证成功！'
                });
                const sendUrl = `https://api.telegram.org/bot${token}/sendMessage?${sendUrlParams}`;

                const sendResponse = await fetch(sendUrl);
                if (!sendResponse.ok) {
                    throw new Error('发送消息失败，请检查Chat ID是否正确');
                }

                const sendData = await sendResponse.json();
                if (!sendData.ok) {
                    throw new Error('Chat ID 无效: ' + (sendData.description || '未知错误'));
                }

                // 验证成功
                statusEl.style.background = 'linear-gradient(135deg, #10b981 0, #059669 100%)';
                statusEl.textContent = '✅ Bot Token 和 Chat ID 均有效';
                confirmBtn.disabled = false;
                confirmBtn.style.opacity = '1';

            } catch (error) {
                statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                statusEl.textContent = '❌ 验证失败: ' + error.message;
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.5';
            } finally {
                testBtn.disabled = false;
            }
        }

        // 保存 TelegramBot 配置
        async function confirmTelegramConfig() {
            const token = document.getElementById('telegramBotToken').value.trim();
            const chatID = document.getElementById('telegramChatID').value.trim();
            const confirmBtn = document.getElementById('telegramConfirmBtn');

            // 检查按钮是否禁用（必须先通过验证）
            if (confirmBtn.disabled) {
                showToast('请先点击"可用性验证"按钮验证配置', 'error');
                return;
            }

            if (!token || !chatID) {
                showToast('请填写完整的Bot Token和Chat ID', 'error');
                return;
            }

            try {
                confirmBtn.disabled = true;
                confirmBtn.textContent = '保存中...';

                // 提交到后端
                const response = await fetch('/admin/tg.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Request': '1'
                    },
                    body: JSON.stringify({
                        BotToken: token,
                        ChatID: chatID
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    showToast('✅ TelegramBot 配置已保存', 'success');
                    closeTelegramConfigModal();

                    // 更新按钮状态
                    currentConfig.TG = {
                        BotToken: token,
                        ChatID: chatID,
                        启用: true
                    };
                    updateTelegramButtonStates(true);

                    // 1秒后刷新页面
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    const errorData = await response.json();
                    showToast('❌ 保存失败: ' + (errorData.error || '未知错误'), 'error');
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = '保存';
                }
            } catch (error) {
                showToast('❌ 保存失败: ' + error.message, 'error');
                confirmBtn.disabled = false;
                confirmBtn.textContent = '保存';
            }
        }

        // 打开 Cloudflare 配置模态框
        function openCloudflareConfigModal() {
            document.getElementById('cloudflareConfigModal').classList.add('show');

            // 默认选择第一个方案
            document.getElementById('cloudflareAuthMethod').value = 'accountid';
            updateCloudflareAuthMethod();

            // 清空输入框
            document.getElementById('cloudflareEmail').value = '';
            document.getElementById('cloudflareGlobalAPIKey').value = '';
            document.getElementById('cloudflareAccountID').value = '';
            document.getElementById('cloudflareAPIToken').value = '';
            document.getElementById('cloudflareUsageAPI').value = '';

            // 重置状态和保存按钮
            document.getElementById('cloudflareStatus').style.display = 'none';
            document.getElementById('cloudflareStatus').textContent = '';
            document.getElementById('cloudflareConfirmBtn').disabled = true;
            document.getElementById('cloudflareConfirmBtn').style.opacity = '0.5';
            document.getElementById('cloudflareConfirmBtn').dataset.testPassed = 'false';
        }

        // 更新 Cloudflare 认证方法选择时的显示
        function updateCloudflareAuthMethod() {
            const method = document.getElementById('cloudflareAuthMethod').value;

            // 隐藏所有方案的输入框
            document.getElementById('cloudflareEmailSection').style.display = 'none';
            document.getElementById('cloudflareAccountIDSection').style.display = 'none';
            document.getElementById('cloudflareUsageAPISection').style.display = 'none';

            // 显示选中方案的输入框
            if (method === 'email') {
                document.getElementById('cloudflareEmailSection').style.display = 'block';
            } else if (method === 'accountid') {
                document.getElementById('cloudflareAccountIDSection').style.display = 'block';
            } else if (method === 'usageapi') {
                document.getElementById('cloudflareUsageAPISection').style.display = 'block';
            }

            // 切换方案时重置验证状态和保存按钮
            document.getElementById('cloudflareStatus').style.display = 'none';
            document.getElementById('cloudflareStatus').textContent = '';
            document.getElementById('cloudflareConfirmBtn').disabled = true;
            document.getElementById('cloudflareConfirmBtn').style.opacity = '0.5';
            document.getElementById('cloudflareConfirmBtn').dataset.testPassed = 'false';
        }

        // 关闭 Cloudflare 配置模态框
        function closeCloudflareConfigModal(event) {
            if (event && event.target.id !== 'cloudflareConfigModal') return;
            document.getElementById('cloudflareConfigModal').classList.remove('show');

            // 清空输入框和状态
            document.getElementById('cloudflareEmail').value = '';
            document.getElementById('cloudflareGlobalAPIKey').value = '';
            document.getElementById('cloudflareAccountID').value = '';
            document.getElementById('cloudflareAPIToken').value = '';
            document.getElementById('cloudflareUsageAPI').value = '';
            document.getElementById('cloudflareStatus').style.display = 'none';
            document.getElementById('cloudflareStatus').textContent = '';
        }

        // 测试 Cloudflare 连接
        async function testCloudflareConfig() {
            const method = document.getElementById('cloudflareAuthMethod').value;
            let email = '', globalAPIKey = '', accountID = '', apiToken = '', usageAPI = '';

            const statusEl = document.getElementById('cloudflareStatus');
            const confirmBtn = document.getElementById('cloudflareConfirmBtn');
            const testBtn = event.target;

            // 根据选择的方案获取输入值
            if (method === 'email') {
                email = document.getElementById('cloudflareEmail').value.trim();
                globalAPIKey = document.getElementById('cloudflareGlobalAPIKey').value.trim();

                if (!email || !globalAPIKey) {
                    statusEl.textContent = '❌ 请填写 Email 和 Global API Key';
                    statusEl.style.display = 'block';
                    statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                    statusEl.style.color = '#fff';
                    confirmBtn.disabled = true;
                    confirmBtn.style.opacity = '0.5';
                    confirmBtn.dataset.testPassed = 'false';
                    return;
                }
            } else if (method === 'accountid') {
                accountID = document.getElementById('cloudflareAccountID').value.trim();
                apiToken = document.getElementById('cloudflareAPIToken').value.trim();

                if (!accountID || !apiToken) {
                    statusEl.textContent = '❌ 请填写 Account ID 和 API Token';
                    statusEl.style.display = 'block';
                    statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                    statusEl.style.color = '#fff';
                    confirmBtn.disabled = true;
                    confirmBtn.style.opacity = '0.5';
                    confirmBtn.dataset.testPassed = 'false';
                    return;
                }
            } else if (method === 'usageapi') {
                usageAPI = document.getElementById('cloudflareUsageAPI').value.trim();

                if (!usageAPI) {
                    statusEl.textContent = '❌ 请填写 UsageAPI 地址';
                    statusEl.style.display = 'block';
                    statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                    statusEl.style.color = '#fff';
                    confirmBtn.disabled = true;
                    confirmBtn.style.opacity = '0.5';
                    confirmBtn.dataset.testPassed = 'false';
                    return;
                }
            }

            try {
                testBtn.disabled = true;
                statusEl.textContent = '⏳ 检测中...';
                statusEl.style.display = 'block';
                statusEl.style.background = 'linear-gradient(135deg, #3b82f6 0, #1d4ed8 100%)';
                statusEl.style.color = '#fff';

                let response;

                if (method === 'usageapi') {
                    // UsageAPI 方案：直接请求外部 API
                    response = await fetch(usageAPI);
                } else {
                    // 构建请求 URL
                    let queryParams = new URLSearchParams();
                    if (method === 'email') {
                        queryParams.append('Email', email);
                        queryParams.append('GlobalAPIKey', globalAPIKey);
                    } else if (method === 'accountid') {
                        queryParams.append('AccountID', accountID);
                        queryParams.append('APIToken', apiToken);
                    }

                    response = await fetch('/admin/getCloudflareUsage?' + queryParams.toString(), {
                        headers: {
                            'X-Admin-Request': '1'
                        }
                    });
                }

                if (!response.ok) {
                    throw new Error('请求失败 (HTTP ' + response.status + ')');
                }

                const data = await response.json();

                if (data.success) {
                    // 验证成功
                    statusEl.style.background = 'linear-gradient(135deg, #10b981 0, #059669 100%)';
                    const maxQuota = data.max || 100000;
                    const percentage = (data.total / maxQuota * 100).toFixed(2);
                    statusEl.textContent = `✅ 验证成功！ 今天的请求配额: ${data.total}/${maxQuota} (${percentage}%)`;
                    confirmBtn.disabled = false;
                    confirmBtn.style.opacity = '1';
                    confirmBtn.dataset.testPassed = 'true';

                    // 保存验证通过的数据供后续保存使用
                    confirmBtn.dataset.method = method;
                    confirmBtn.dataset.email = email;
                    confirmBtn.dataset.globalAPIKey = globalAPIKey;
                    confirmBtn.dataset.accountID = accountID;
                    confirmBtn.dataset.apiToken = apiToken;
                    confirmBtn.dataset.usageAPI = usageAPI;
                } else {
                    // 验证失败
                    statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                    statusEl.textContent = '❌ 验证失败：' + (data.msg || '凭证无效或无权限');
                    confirmBtn.disabled = true;
                    confirmBtn.style.opacity = '0.5';
                    confirmBtn.dataset.testPassed = 'false';
                }
            } catch (error) {
                statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                statusEl.textContent = '❌ 检测失败: ' + error.message;
                confirmBtn.disabled = true;
                confirmBtn.style.opacity = '0.5';
                confirmBtn.dataset.testPassed = 'false';
            } finally {
                testBtn.disabled = false;
            }
        }

        // 保存 Cloudflare 配置
        async function confirmCloudflareConfig() {
            const confirmBtn = document.getElementById('cloudflareConfirmBtn');

            // 检查是否通过了验证
            if (confirmBtn.dataset.testPassed !== 'true') {
                showToast('请先点击"可用性验证"按钮通过验证', 'error');
                return;
            }

            const method = confirmBtn.dataset.method;
            const email = confirmBtn.dataset.email || '';
            const globalAPIKey = confirmBtn.dataset.globalAPIKey || '';
            const accountID = confirmBtn.dataset.accountID || '';
            const apiToken = confirmBtn.dataset.apiToken || '';
            const usageAPI = confirmBtn.dataset.usageAPI || '';

            try {
                confirmBtn.disabled = true;
                confirmBtn.textContent = '保存中...';

                // 构建请求体
                let payload;
                if (method === 'usageapi') {
                    payload = {
                        Email: null,
                        GlobalAPIKey: null,
                        AccountID: null,
                        APIToken: null,
                        UsageAPI: usageAPI
                    };
                } else {
                    payload = {
                        Email: method === 'email' ? email : null,
                        GlobalAPIKey: method === 'email' ? globalAPIKey : null,
                        AccountID: method === 'accountid' ? accountID : null,
                        APIToken: method === 'accountid' ? apiToken : null,
                        UsageAPI: null
                    };
                }

                // 提交到后端
                const response = await fetch('/admin/cf.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Request': '1'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showToast('✅ Cloudflare 配置已保存', 'success');
                    closeCloudflareConfigModal();

                    // 1秒后刷新页面
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    const errorData = await response.json();
                    showToast('❌ 保存失败: ' + (errorData.error || '未知错误'), 'error');
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = '保存';
                }
            } catch (error) {
                showToast('❌ 保存失败: ' + error.message, 'error');
                confirmBtn.disabled = false;
                confirmBtn.textContent = '保存';
            }
        }

        // 保存通知设置
        async function saveNotification() {
            try {
                // 只更新 TG.启用 字段
                if (!currentConfig.TG) currentConfig.TG = {};
                currentConfig.TG.启用 = document.getElementById('telegramEnabled').checked;

                // 提交到服务器，但整个 currentConfig
                const response = await fetch('/admin/config.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Request': '1'
                    },
                    body: JSON.stringify(currentConfig)
                });

                if (!response.ok) throw new Error('保存失败');

                showToast('✅ 启用状态已保存', 'success');
                modifiedSections.delete('notification');
                updateButtonStates();
            } catch (error) {
                showToast('❌ 保存失败: ' + error.message, 'error');
            }
        }

        // 清除 Telegram 配置
        // 清除 Telegram 配置
        function clearTelegramConfig() {
            document.getElementById('clearTelegramModal').classList.add('show');
        }

        function closeClearTelegramModal(event) {
            if (!event || event.target.id === 'clearTelegramModal') {
                document.getElementById('clearTelegramModal').classList.remove('show');
            }
        }

        async function confirmClearTelegramConfig() {
            try {
                const response = await fetch('/admin/tg.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Request': '1'
                    },
                    body: JSON.stringify({ init: true })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    closeClearTelegramModal();
                    showToast('✅ Telegram 配置已清除，页面即将刷新...', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    showToast('❌ 清除失败: ' + (data.message || '未知错误'), 'error');
                }
            } catch (error) {
                showToast('❌ 清除出错: ' + error.message, 'error');
            }
        }

        // 清除 Cloudflare 配置
        function clearCloudflareConfig() {
            document.getElementById('clearCloudflareModal').classList.add('show');
        }

        function closeClearCloudflareModal(event) {
            if (!event || event.target.id === 'clearCloudflareModal') {
                document.getElementById('clearCloudflareModal').classList.remove('show');
            }
        }

        async function confirmClearCloudflareConfig() {
            try {
                const response = await fetch('/admin/cf.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Request': '1'
                    },
                    body: JSON.stringify({ init: true })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    closeClearCloudflareModal();
                    showToast('✅ Cloudflare 配置已清除，页面即将刷新...', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    showToast('❌ 清除失败: ' + (data.message || '未知错误'), 'error');
                }
            } catch (error) {
                showToast('❌ 清除出错: ' + error.message, 'error');
            }
        }

        // 取消通知设置编辑
        function cancelEdit(section) {
            if (section === 'notification') {
                // 重置通知启用状态为原始值
                const telegramCheckbox = document.getElementById('telegramEnabled');
                const originalEnabled = originalConfig.TG?.启用 ?? false;
                telegramCheckbox.checked = originalEnabled;
                currentConfig.TG.启用 = originalEnabled;
            } else {
                // 原有的cancelEdit逻辑
                currentConfig = JSON.parse(JSON.stringify(originalConfig));

                if (section === 'sub') {
                    document.getElementById('ipMode').value = 'custom';
                    loadCustomIPs();
                    updateIPMode();
                } else if (section === 'config') {
                    document.getElementById('subName').value = currentConfig.优选订阅生成?.SUBNAME || '';
                    document.getElementById('nodeHost').value = currentConfig.HOST || '';
                    document.getElementById('nodeUUID').value = currentConfig.UUID || '';
                    document.getElementById('nodePATH').value = currentConfig.PATH || '';
                    document.getElementById('protocol').value = currentConfig.协议类型 || 'vless';
                    document.getElementById('skipVerify').checked = currentConfig.跳过证书验证 || false;
                    updateProtocol();
                } else if (section === 'proxy') {
                    const socksEnabled = currentConfig.反代?.SOCKS5?.启用;
                    if (!socksEnabled) {
                        document.getElementById('proxyMode').value = 'auto';
                        document.getElementById('proxyIP').value = currentConfig.反代?.PROXYIP || '';
                        document.getElementById('autoProxy').checked = (currentConfig.反代?.PROXYIP === 'auto');
                        if (currentConfig.反代?.PROXYIP === 'auto') {
                            document.getElementById('proxyIP').disabled = true;
                        }
                    } else if (socksEnabled === 'socks5') {
                        document.getElementById('proxyMode').value = 'socks5';
                        document.getElementById('socks5Addr').value = currentConfig.反代?.SOCKS5?.账号 || '';
                        document.getElementById('globalSocks5').checked = currentConfig.反代?.SOCKS5?.全局 || false;
                    } else if (socksEnabled === 'http') {
                        document.getElementById('proxyMode').value = 'http';
                        document.getElementById('httpAddr').value = currentConfig.反代?.SOCKS5?.账号 || '';
                        document.getElementById('globalHTTP').checked = currentConfig.反代?.SOCKS5?.全局 || false;
                    }
                    updateProxyMode();
                } else if (section === 'convert') {
                    document.getElementById('subAPI').value = currentConfig.订阅转换配置?.SUBAPI || 'https://subconverter-latest-qfyo.onrender.com';
                    document.getElementById('subConfig').value = currentConfig.订阅转换配置?.SUBCONFIG || '';
                    document.getElementById('emoji').checked = currentConfig.订阅转换配置?.SUBEMOJI || false;
                }
            }

            modifiedSections.delete(section);
            updateButtonStates();
        }

        // 更新倒计时
        function updateCountdown() {
            const now = new Date();
            const nextMidnightUTC = new Date(now);
            nextMidnightUTC.setUTCHours(0, 0, 0, 0);
            nextMidnightUTC.setUTCDate(nextMidnightUTC.getUTCDate() + 1); // 总是设置为明天的0点

            const diff = nextMidnightUTC - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            document.getElementById('countdown').innerHTML = `<span class="countdown-text">距离重置还有</span> <span class="countdown-numbers">${hours.toString().padStart(2, '0')}</span><span class="countdown-text">小时</span><span class="countdown-numbers">${minutes.toString().padStart(2, '0')}</span><span class="countdown-text">分</span><span class="countdown-numbers">${seconds.toString().padStart(2, '0')}</span><span class="countdown-text">秒</span>`;
        }
