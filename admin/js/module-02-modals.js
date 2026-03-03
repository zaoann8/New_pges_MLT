/* admin/index 模块2：代理验证/路径模板/SubAPI 等弹窗逻辑 */
        // ==================== 代理验证模态框函数 ====================

        // 全局变量存储当前验证的代理类型
        let currentProxyType = null;
        let currentProxyFieldId = null;

        function openProxyVerificationModal(proxyType) {
            currentProxyType = proxyType;
            currentProxyFieldId = proxyType === 'socks5' ? 'socks5Addr' : 'httpAddr';

            // 设置模态框标题和标签
            const title = proxyType === 'socks5' ? '🔒 SOCKS5代理验证' : '🌐 HTTP代理验证';
            const label = proxyType === 'socks5' ? 'SOCKS5代理:' : 'HTTP代理:';

            document.getElementById('proxyVerificationTitle').textContent = title;
            document.getElementById('proxyVerificationLabel').textContent = label;
            document.getElementById('proxyVerificationInput').placeholder = proxyType === 'socks5'
                ? 'user:password@127.0.0.1:1080'
                : 'user:password@127.0.0.1:8080';

            // 设置输入框的当前值
            const currentValue = document.getElementById(currentProxyFieldId).value;
            document.getElementById('proxyVerificationInput').value = currentValue;

            // 重置状态
            document.getElementById('proxyVerificationStatus').style.display = 'none';
            document.getElementById('proxyVerificationStatus').textContent = '';
            document.getElementById('proxyConfirmBtn').disabled = true;
            document.getElementById('proxyConfirmBtn').style.opacity = '0.5';

            // 显示模态框
            document.getElementById('proxyVerificationModal').classList.add('show');
        }

        function closeProxyVerificationModal(event) {
            document.getElementById('proxyVerificationModal').classList.remove('show');
            currentProxyType = null;
            currentProxyFieldId = null;
            document.getElementById('proxyVerificationInput').value = '';
            document.getElementById('proxyVerificationStatus').style.display = 'none';
        }

        async function verifyProxyAvailability() {
            const input = document.getElementById('proxyVerificationInput').value.trim();
            if (!input) {
                showProxyVerificationStatus('请输入代理地址', 'error');
                return;
            }

            // 预处理代理地址
            const processedAddress = processProxyAddressForValidation(input, currentProxyType);
            if (!processedAddress) {
                showProxyVerificationStatus('代理地址格式无效', 'error');
                return;
            }

            const statusEl = document.getElementById('proxyVerificationStatus');
            const verifyBtn = document.querySelector('#proxyVerificationModal .btn-verify-api');

            try {
                verifyBtn.disabled = true;
                statusEl.textContent = '⏳ 验证中...';
                statusEl.style.display = 'block';
                statusEl.style.background = 'linear-gradient(135deg, #3b82f6 0, #1d4ed8 100%)';
                statusEl.style.color = '#fff';
                statusEl.style.padding = '16px';
                statusEl.style.borderRadius = '8px';

                // 构建请求参数
                const params = new URLSearchParams();
                if (currentProxyType === 'socks5') {
                    params.append('socks5', processedAddress);
                } else {
                    params.append('http', processedAddress);
                }

                // 创建 AbortController 实现 5 秒超时
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

                const response = await fetch(`/admin/check?${params}&_t=${Date.now()}`, {
                    method: 'GET',
                    headers: {
                        'X-Admin-Request': '1'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const data = await response.json();

                // 检查是否有 success 字段
                if (!data.hasOwnProperty('success')) {
                    statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                    statusEl.style.padding = '16px';
                    statusEl.style.borderRadius = '8px';
                    statusEl.innerHTML = '❌ <strong>后端版本过旧</strong><br/><small style="opacity: 0.9;">请升级代理后端代码</small>';
                    document.getElementById('proxyConfirmBtn').disabled = true;
                    document.getElementById('proxyConfirmBtn').style.opacity = '0.5';
                } else if (data.success === false) {
                    statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                    statusEl.style.padding = '16px';
                    statusEl.style.borderRadius = '8px';
                    statusEl.innerHTML = `❌ <strong>代理无效</strong><br/><small style="opacity: 0.9;">${data.error || '未知错误'}</small>`;
                    document.getElementById('proxyConfirmBtn').disabled = true;
                    document.getElementById('proxyConfirmBtn').style.opacity = '0.5';
                } else if (data.success === true) {
                    const ip = data.ip || '未知';
                    const loc = data.loc || '未知';
                    const responseTime = data.responseTime || 0;
                    const responseTimeDisplay = responseTime > 0 ? `${responseTime}ms` : '未知';

                    statusEl.style.background = 'linear-gradient(135deg, #10b981 0, #059669 100%)';
                    statusEl.style.padding = '16px';
                    statusEl.style.borderRadius = '8px';
                    statusEl.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 10px; font-family: 'Inter', system-ui, sans-serif;">
                            <!-- 顶部标题栏 -->
                            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 8px; margin-bottom: 2px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 8px; height: 8px; background: #fff; border-radius: 50%; box-shadow: 0 0 8px #fff; animation: pulse 2s infinite;"></div>
                                    <span style="font-weight: 700; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; color: #fff;">Connection Secured</span>
                                </div>
                                <span style="font-size: 10px; opacity: 0.7; font-family: 'Fira Code', monospace; color: #fff;">STATUS: 200 OK</span>
                            </div>
                            
                            <!-- 信息网格 -->
                            <div style="display: grid; grid-template-columns: 0.4fr 1.2fr; gap: 8px;">
                                <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); min-width: 0; max-width: 100px;">
                                    <div style="font-size: 10px; opacity: 0.7; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; color: #fff;">区域 (Region)</div>
                                    <div style="font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;" title="${loc}">${loc}</div>
                                </div>
                                <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); min-width: 0;">
                                    <div style="font-size: 10px; opacity: 0.7; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; color: #fff; text-align: center;">落地地址 (IP)</div>
                                    <div style="font-family: 'Fira Code', monospace; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; color: #fff; text-decoration: underline; min-width: 0;" onclick="showIpDetailForProxy('${ip}', this)">
                                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${ip}">${ip}</span>
                                        <span style="font-size: 12px; opacity: 0.8; flex-shrink: 0;">🔍</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 底部延迟栏 -->
                            <div style="background: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid #fff;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 14px;">⏱️</span>
                                    <span style="font-size: 11px; font-weight: 500; opacity: 0.9; color: #fff;">响应延迟</span>
                                </div>
                                <div style="font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 800; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.3);">
                                    ${responseTimeDisplay}
                                </div>
                            </div>
                        </div>
                    `;

                    // 启用确定按钮
                    document.getElementById('proxyConfirmBtn').disabled = false;
                    document.getElementById('proxyConfirmBtn').style.opacity = '1';

                    // 存储验证后的地址以备后用
                    document.getElementById('proxyConfirmBtn').dataset.validAddress = processedAddress;
                }
            } catch (error) {
                statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                statusEl.style.padding = '16px';
                statusEl.style.borderRadius = '8px';

                // 判断是否为超时错误
                if (error.name === 'AbortError') {
                    statusEl.innerHTML = `❌ <strong>验证超时</strong><br/><small style="opacity: 0.9;">请求超过 10 秒无响应，请检查代理连接</small>`;
                } else {
                    statusEl.innerHTML = `❌ <strong>验证失败</strong><br/><small style="opacity: 0.9;">${error.message}</small>`;
                }

                document.getElementById('proxyConfirmBtn').disabled = true;
                document.getElementById('proxyConfirmBtn').style.opacity = '0.5';
            } finally {
                verifyBtn.disabled = false;
            }
        }

        function processProxyAddressForValidation(input, type) {
            input = input.trim();

            // 移除开头的 "/" 或 "/"
            if (input.startsWith('/')) {
                input = input.substring(1).trim();
            }

            // 检测并移除协议前缀
            const socks5Prefixes = ['socks5://', 'socks5=', 'socks5://'];
            const httpPrefixes = ['http://', 'http=', 'https://'];

            for (const prefix of socks5Prefixes) {
                if (input.toLowerCase().startsWith(prefix)) {
                    input = input.substring(prefix.length).trim();
                    break;
                }
            }

            for (const prefix of httpPrefixes) {
                if (input.toLowerCase().startsWith(prefix)) {
                    input = input.substring(prefix.length).trim();
                    break;
                }
            }

            // 移除末尾的备注（#符号之后的内容）
            if (input.includes('#')) {
                input = input.split('#')[0].trim();
            }

            return input;
        }

        function showProxyVerificationStatus(message, type) {
            const statusEl = document.getElementById('proxyVerificationStatus');
            const prefix = type === 'error' ? '❌' : 'ℹ️';
            statusEl.textContent = prefix + ' ' + message;
            statusEl.style.display = 'block';
            if (type === 'error') {
                statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
            } else {
                statusEl.style.background = 'linear-gradient(135deg, #3b82f6 0, #1d4ed8 100%)';
            }
            statusEl.style.color = '#fff';
        }

        async function fetchAndShowIpDetail(ip, targetElement = null) {
            // 将 * 替换为 0 (兼容掩码IP)
            const cleanIp = ip.toString().replace(/\*/g, '0');

            if (targetElement) {
                // 移除可能存在的加载动画
                const existingSpinner = targetElement.querySelector('.loading-spinner');
                if (existingSpinner) {
                    return; // 正在加载中,不重复请求
                }

                // 添加加载动画
                const spinner = document.createElement('span');
                spinner.className = 'loading-spinner';
                targetElement.appendChild(spinner);
            }

            try {
                showToast(`ℹ️ 已禁用第三方 IP 详情查询：${cleanIp}`, 'info');
            } catch (error) {
                console.error('IP查询错误:', error);
            } finally {
                if (targetElement) {
                    const spinner = targetElement.querySelector('.loading-spinner');
                    if (spinner) spinner.remove();
                }
            }
        }

        function showIpDetailForProxy(ip, element = null) {
            fetchAndShowIpDetail(ip, element);
        }

        function confirmProxyAddress() {
            const validAddress = document.getElementById('proxyConfirmBtn').dataset.validAddress;
            if (!validAddress) return;

            document.getElementById(currentProxyFieldId).value = validAddress;
            markModified('proxy');
            closeProxyVerificationModal();
        }

        function openSubAPIModal() {
            const currentValue = document.getElementById('subAPI').value;
            document.getElementById('subAPIStatus').style.display = 'none';
            document.getElementById('subAPIStatus').textContent = '';
            document.getElementById('subAPIConfirmBtn').disabled = true;
            document.getElementById('subAPIConfirmBtn').style.opacity = '0.5';
            document.getElementById('subAPIModal').classList.add('show');

            // 加载 SUBAPI 列表
            loadSubAPIList(currentValue);
        }

        function closeSubAPIModal(event) {
            if (event && event.target.id !== 'subAPIModal') return;
            document.getElementById('subAPIModal').classList.remove('show');
            document.getElementById('testSubAPIInput').value = '';
            document.getElementById('subAPIStatus').style.display = 'none';
        }

        async function loadSubAPIList(currentValue) {
            const selectEl = document.getElementById('subAPISelect');
            selectEl.innerHTML = '<option value="custom">🔧 自定义</option>';
            selectEl.value = 'custom';
            
            const customInputGroup = document.getElementById('customSubAPIInputGroup');
            customInputGroup.style.display = 'block';
            
            const testInput = document.getElementById('testSubAPIInput');
            if (currentValue && currentValue.trim()) {
                testInput.value = currentValue.trim();
            } else {
                testInput.value = '';
            }
        }

        function handleSubAPISelectChange() {
            // 已固定为自定义模式，始终展现输入框
            const customInputGroup = document.getElementById('customSubAPIInputGroup');
            customInputGroup.style.display = 'block';
        }

        // ProxyIP 帮助模态框函数
        function showProxyIPHelpModal() {
            document.getElementById('proxyIPHelpModal').classList.add('show');
        }

        function closeProxyIPHelpModal(event) {
            if (event && event.target.id !== 'proxyIPHelpModal') return;
            document.getElementById('proxyIPHelpModal').classList.remove('show');
        }

        // 路径模板配置函数
        let pathTemplatePresets = [];
        let pathTemplateOriginal = {};

        async function showPathTemplateConfigModal() {
            const modal = document.getElementById('pathTemplateConfigModal');
            modal.classList.add('show');

            // 初始化原始值
            pathTemplateOriginal = JSON.parse(JSON.stringify(currentConfig.反代?.路径模板 || {}));

            // 加载预设模板
            await loadPathTemplatePresets();

            // 填充当前配置到文本框（添加"/"前缀用于显示）
            document.getElementById('proxyIPTemplateInput').value = '/' + (currentConfig.反代?.路径模板?.PROXYIP || '');
            document.getElementById('socks5StandardTemplateInput').value = '/' + (currentConfig.反代?.路径模板?.SOCKS5?.标准 || '');
            document.getElementById('socks5GlobalTemplateInput').value = '/' + (currentConfig.反代?.路径模板?.SOCKS5?.全局 || '');
            document.getElementById('httpStandardTemplateInput').value = '/' + (currentConfig.反代?.路径模板?.HTTP?.标准 || '');
            document.getElementById('httpGlobalTemplateInput').value = '/' + (currentConfig.反代?.路径模板?.HTTP?.全局 || '');

            // 初始化验证状态
            validatePathTemplate('proxyIPTemplateInput', currentConfig.反代?.路径模板?.PROXYIP || '');
            validatePathTemplate('socks5StandardTemplateInput', currentConfig.反代?.路径模板?.SOCKS5?.标准 || '');
            validatePathTemplate('socks5GlobalTemplateInput', currentConfig.反代?.路径模板?.SOCKS5?.全局 || '');
            validatePathTemplate('httpStandardTemplateInput', currentConfig.反代?.路径模板?.HTTP?.标准 || '');
            validatePathTemplate('httpGlobalTemplateInput', currentConfig.反代?.路径模板?.HTTP?.全局 || '');

            // 禁用保存按钮
            document.getElementById('pathTemplateSaveBtn').disabled = true;

            // 重置预设模板选择
            document.getElementById('presetTemplateSelect').value = 'custom';
        }

        function closePathTemplateConfigModal(event) {
            if (event && event.target.id !== 'pathTemplateConfigModal') return;
            document.getElementById('pathTemplateConfigModal').classList.remove('show');
        }

        async function loadPathTemplatePresets() {
            try {
                const url = 'https://raw.githubusercontent.com/cmliu/cmliu/main/json/edt-path-config.json';
                const text = await fetchWithAutoMirror(url, '路径模板配置');
                pathTemplatePresets = JSON.parse(text);

                const select = document.getElementById('presetTemplateSelect');
                // 清除除"自定义"外的所有选项
                while (select.options.length > 1) {
                    select.remove(1);
                }

                // 添加预设模板选项
                pathTemplatePresets.forEach(preset => {
                    const option = document.createElement('option');
                    option.value = preset.项目名;
                    option.textContent = preset.项目名;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('加载路径模板预设失败:', error);
                showToast('加载预设模板失败: ' + error.message, 'error');
            }
        }

        function onPresetTemplateChange() {
            const select = document.getElementById('presetTemplateSelect');
            const selectedValue = select.value;

            if (selectedValue === 'custom') {
                return;
            }

            // 找到对应的预设
            const preset = pathTemplatePresets.find(p => p.项目名 === selectedValue);
            if (!preset) return;

            // 显示提示消息
            showToast(preset.提示消息, 'info');

            // 填充模板（添加"/"前缀用于显示）
            document.getElementById('proxyIPTemplateInput').value = '/' + (preset.路径模板.PROXYIP || '');
            document.getElementById('socks5StandardTemplateInput').value = '/' + (preset.路径模板.SOCKS5.标准 || '');
            document.getElementById('socks5GlobalTemplateInput').value = '/' + (preset.路径模板.SOCKS5.全局 || '');
            document.getElementById('httpStandardTemplateInput').value = '/' + (preset.路径模板.HTTP.标准 || '');
            document.getElementById('httpGlobalTemplateInput').value = '/' + (preset.路径模板.HTTP.全局 || '');

            // 验证填充后的内容
            validatePathTemplate('proxyIPTemplateInput', preset.路径模板.PROXYIP || '');
            validatePathTemplate('socks5StandardTemplateInput', preset.路径模板.SOCKS5.标准 || '');
            validatePathTemplate('socks5GlobalTemplateInput', preset.路径模板.SOCKS5.全局 || '');
            validatePathTemplate('httpStandardTemplateInput', preset.路径模板.HTTP.标准 || '');
            validatePathTemplate('httpGlobalTemplateInput', preset.路径模板.HTTP.全局 || '');

            // 亮起保存按钮
            document.getElementById('pathTemplateSaveBtn').disabled = false;
        }

        function onPathTemplateInput() {
            // 获取所有模板输入框的值（去掉开头的"/"用于对比）
            const proxyIP = document.getElementById('proxyIPTemplateInput').value.replace(/^\//, '');
            const socks5Standard = document.getElementById('socks5StandardTemplateInput').value.replace(/^\//, '');
            const socks5Global = document.getElementById('socks5GlobalTemplateInput').value.replace(/^\//, '');
            const httpStandard = document.getElementById('httpStandardTemplateInput').value.replace(/^\//, '');
            const httpGlobal = document.getElementById('httpGlobalTemplateInput').value.replace(/^\//, '');

            // 验证每个输入框是否包含占位符，没有则标记为invalid
            validatePathTemplate('proxyIPTemplateInput', proxyIP);
            validatePathTemplate('socks5StandardTemplateInput', socks5Standard);
            validatePathTemplate('socks5GlobalTemplateInput', socks5Global);
            validatePathTemplate('httpStandardTemplateInput', httpStandard);
            validatePathTemplate('httpGlobalTemplateInput', httpGlobal);

            // 检查是否有任何内容发生变化
            const hasChanged =
                proxyIP !== (pathTemplateOriginal.PROXYIP || '') ||
                socks5Standard !== (pathTemplateOriginal.SOCKS5?.标准 || '') ||
                socks5Global !== (pathTemplateOriginal.SOCKS5?.全局 || '') ||
                httpStandard !== (pathTemplateOriginal.HTTP?.标准 || '') ||
                httpGlobal !== (pathTemplateOriginal.HTTP?.全局 || '');

            // 控制保存按钮的启用/禁用
            document.getElementById('pathTemplateSaveBtn').disabled = !hasChanged;
        }

        function validatePathTemplate(inputId, value) {
            const inputElement = document.getElementById(inputId);
            const wrapper = inputElement.closest('.path-template-input-wrapper');

            // 生成对应的错误提示的ID
            const errorId = inputId.replace('Input', 'Error');
            const errorElement = document.getElementById(errorId);

            // 如果内容不为空且不包含占位符，添加invalid样式并显示错误提示
            if (value.trim() && !value.includes('{{IP:PORT}}')) {
                wrapper.classList.add('invalid');
                if (errorElement) {
                    errorElement.style.display = 'block';
                }
            } else {
                wrapper.classList.remove('invalid');
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }
        }

        async function savePathTemplateConfig() {
            // 获取输入框的值并去掉开头的"/"
            const proxyIP = document.getElementById('proxyIPTemplateInput').value.replace(/^\//, '');
            const socks5Standard = document.getElementById('socks5StandardTemplateInput').value.replace(/^\//, '');
            const socks5Global = document.getElementById('socks5GlobalTemplateInput').value.replace(/^\//, '');
            const httpStandard = document.getElementById('httpStandardTemplateInput').value.replace(/^\//, '');
            const httpGlobal = document.getElementById('httpGlobalTemplateInput').value.replace(/^\//, '');

            try {
                // 验证是否包含{{IP:PORT}}占位符
                const templates = [proxyIP, socks5Standard, socks5Global, httpStandard, httpGlobal].filter(t => t);
                if (templates.length > 0) {
                    const hasPlaceholder = templates.every(t => t.includes('{{IP:PORT}}'));
                    if (!hasPlaceholder) {
                        showToast('当前路径模板存在缺失 {{IP:PORT}} 占位符', 'error');
                        //return;
                    }
                }

                // 更新currentConfig中的路径模板数据（不包含开头的"/"）
                if (!currentConfig.反代) {
                    currentConfig.反代 = {};
                }
                if (!currentConfig.反代.路径模板) {
                    currentConfig.反代.路径模板 = {};
                }

                currentConfig.反代.路径模板.PROXYIP = proxyIP;
                currentConfig.反代.路径模板.SOCKS5 = {
                    标准: socks5Standard,
                    全局: socks5Global
                };
                currentConfig.反代.路径模板.HTTP = {
                    标准: httpStandard,
                    全局: httpGlobal
                };

                // 通过saveConfigToServer保存到服务器
                await saveConfigToServer('pathTemplate');

                // 关闭模态框
                closePathTemplateConfigModal();
            } catch (error) {
                console.error('保存路径模板失败:', error);
                showToast('保存路径模板失败: ' + error.message, 'error');
            }
        }

        function toggleProxyIPHelpMode() {
            const checkbox = document.getElementById('proxyIPSimpleMode');
            const simpleDiv = document.getElementById('proxyIPHelpSimple');
            const detailDiv = document.getElementById('proxyIPHelpDetail');

            if (checkbox.checked) {
                // 显示简易模式
                simpleDiv.style.display = 'block';
                detailDiv.style.display = 'none';
            } else {
                // 显示详细模式
                simpleDiv.style.display = 'none';
                detailDiv.style.display = 'block';
            }
        }

        // 防止输出"#"字符，允许输入"?"
        function preventInvalidChars(input) {
            input.value = input.value.replace(/#/g, '');
        }

        function preventInvalidCharsOnKeypress(event) {
            if (event.key === '#') {
                event.preventDefault();
            }
        }

        // 确保路径以"/"开头（虽然显示中已有前缀，但防止意外删除）
        function ensurePathPrefix(input) {
            // 不在这里强制，而是在防删除函数中处理
        }

        // 防止删除路径前缀"/"
        function preventPathPrefixDeletion(event, input) {
            // 只在删除键时处理
            if (event.key === 'Backspace' || event.key === 'Delete') {
                // 如果选中的文本包括位置0（开头），阻止删除
                if (input.selectionStart === 0 && event.key === 'Backspace') {
                    event.preventDefault();
                    return false;
                }
                // 如果光标在开头且按下Delete，防止删除
                if (input.selectionStart === 0 && event.key === 'Delete') {
                    event.preventDefault();
                    return false;
                }
            }
            // 防止在开头输入任何内容
            if (input.selectionStart === 0 && event.key && event.key.length === 1 && event.key !== '/') {
                // 将光标移动到位置1
                setTimeout(() => {
                    input.setSelectionRange(1, 1);
                }, 0);
            }
        }

        // ECH 帮助模态框函数
        function showECHHelpModal() {
            document.getElementById('echHelpModal').classList.add('show');

            // 计算并设置内容高度以适应浏览器高度
            setTimeout(() => {
                calculateECHContentHeight();
                // 窗口大小改变时重新计算
                window.addEventListener('resize', calculateECHContentHeight);
            }, 0);
        }

        function calculateECHContentHeight() {
            const modal = document.querySelector('.ech-help-modal');
            const tabContent = document.querySelector('.ech-tab-content');
            const tabs = document.querySelector('.ech-tabs');
            const closeBtn = document.querySelector('#echHelpModal .modal-close');
            const bottomBtn = document.querySelector('#echHelpModal .btn-close-modal');

            if (!modal || !tabContent) return;

            // 获取浏览器视口高度
            const viewportHeight = window.innerHeight;

            // 计算各个元素的高度（带上下文margin/padding）
            const modalPadding = 20; // 模态框内边距
            const tabsHeight = tabs ? tabs.offsetHeight + 15 : 50; // 选项卡高度 + margin
            const closeBtnHeight = 40; // 关闭按钮高度
            const bottomBtnHeight = bottomBtn ? bottomBtn.offsetHeight + 20 : 60; // 底部按钮高度 + margin
            const headerHeight = 20; // 其他上边距

            // 计算可用的内容高度
            // viewportHeight - (顶部padding + 选项卡 + 底部按钮 + 底部padding)
            const availableHeight = viewportHeight - (modalPadding * 2 + tabsHeight + bottomBtnHeight + headerHeight);

            // 设置最大高度，确保不超出视口
            tabContent.style.maxHeight = Math.max(200, availableHeight) + 'px';
        }

        function closeECHHelpModal(event) {
            if (event && event.target.id !== 'echHelpModal') return;
            document.getElementById('echHelpModal').classList.remove('show');
        }

        function switchECHTab(tabIndex) {
            // 切换选项卡按钮状态
            const tabs = document.querySelectorAll('.ech-tab');
            tabs.forEach((tab, index) => {
                if (index === tabIndex) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });

            // 切换选项卡内容
            const panes = document.querySelectorAll('.ech-tab-pane');
            panes.forEach((pane, index) => {
                if (index === tabIndex) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });

            // 自动滚动到活跃选项卡
            const activeTab = tabs[tabIndex];
            if (activeTab) {
                const tabsContainer = document.querySelector('.ech-tabs');
                if (tabsContainer) {
                    activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        }

        // ECH 选项卡拖拽功能
        function initECHTabsDrag() {
            const tabsContainer = document.querySelector('.ech-tabs');
            if (!tabsContainer) return;

            let isDown = false;
            let startX;
            let scrollLeft;
            let isDragged = false;

            tabsContainer.addEventListener('mousedown', (e) => {
                // 如果点击的是按钮，不启动拖拽
                if (e.target.closest('.ech-tab')) {
                    isDown = true;
                    isDragged = false;
                    startX = e.pageX - tabsContainer.offsetLeft;
                    scrollLeft = tabsContainer.scrollLeft;
                    tabsContainer.classList.add('dragging');
                }
            });

            tabsContainer.addEventListener('mouseleave', () => {
                isDown = false;
                tabsContainer.classList.remove('dragging');
            });

            tabsContainer.addEventListener('mouseup', () => {
                isDown = false;
                tabsContainer.classList.remove('dragging');
            });

            tabsContainer.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();

                const x = e.pageX - tabsContainer.offsetLeft;
                const walk = (x - startX) * 1; // 拖拽速度

                if (Math.abs(walk) > 5) {
                    isDragged = true;
                }

                tabsContainer.scrollLeft = scrollLeft - walk;
            });

            // 触摸设备支持
            tabsContainer.addEventListener('touchstart', (e) => {
                isDown = true;
                isDragged = false;
                startX = e.touches[0].pageX - tabsContainer.offsetLeft;
                scrollLeft = tabsContainer.scrollLeft;
            });

            tabsContainer.addEventListener('touchend', () => {
                isDown = false;
            });

            tabsContainer.addEventListener('touchmove', (e) => {
                if (!isDown) return;

                const x = e.touches[0].pageX - tabsContainer.offsetLeft;
                const walk = (x - startX) * 1;

                if (Math.abs(walk) > 5) {
                    isDragged = true;
                }

                tabsContainer.scrollLeft = scrollLeft - walk;
            });

            // 为选项卡按钮添加点击拦截，防止拖拽时误触发
            const tabs = document.querySelectorAll('.ech-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    if (isDragged) {
                        e.preventDefault();
                        e.stopPropagation();
                        isDragged = false;
                    }
                });
            });
        }

        // 在模态框显示时初始化拖拽
        const echHelpModalOriginal = showECHHelpModal;
        showECHHelpModal = function () {
            echHelpModalOriginal.call(this);
            setTimeout(() => {
                initECHTabsDrag();
            }, 0);
        }

        function normalizeSubAPIURL(url) {
            url = url.trim();
            if (!url) return null;

            let parsedURL;

            if (!url.includes('://')) {
                url = 'https://' + url;
            }

            try {
                parsedURL = new URL(url);
            } catch (e) {
                return null;
            }

            const baseURL = parsedURL.origin;
            return baseURL;
        }

        async function testSubAPI() {
            let input;
            const selectEl = document.getElementById('subAPISelect');

            if (selectEl.value === 'custom' || !selectEl.value) {
                // 如果是自定义或未选择，从输入框获取
                input = document.getElementById('testSubAPIInput').value.trim();
            } else {
                // 否则从下拉框获取
                input = selectEl.value.trim();
                document.getElementById('testSubAPIInput').value = input;
            }

            if (!input) {
                showStatus('请输入地址', 'error');
                return;
            }

            const baseURL = normalizeSubAPIURL(input);
            if (!baseURL) {
                showStatus('地址格式无效', 'error');
                return;
            }

            const testURL = baseURL + '/version';
            const statusEl = document.getElementById('subAPIStatus');
            const buttons = document.querySelectorAll('#subAPIModal button.btn');
            const testBtn = buttons[0];

            try {
                testBtn.disabled = true;
                statusEl.textContent = '⏳ 检测中...';
                statusEl.style.display = 'block';
                statusEl.style.background = 'linear-gradient(135deg, #3b82f6 0, #1d4ed8 100%)';
                statusEl.style.color = '#fff';

                const response = await fetch(testURL, {
                    method: 'GET'
                });

                if (response.status === 200) {
                    const content = await response.text();
                    const lowerContent = content.toLowerCase();

                    if (lowerContent.includes('subconverter')) {
                        statusEl.style.background = 'linear-gradient(135deg, #10b981 0, #059669 100%)';
                        statusEl.textContent = '✅ ' + content;
                        document.getElementById('subAPIConfirmBtn').disabled = false;
                        document.getElementById('subAPIConfirmBtn').style.opacity = '1';
                        document.getElementById('subAPIConfirmBtn').dataset.validURL = baseURL;
                    } else {
                        statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                        statusEl.textContent = '❌ 响应内容无效';
                        document.getElementById('subAPIConfirmBtn').disabled = true;
                        document.getElementById('subAPIConfirmBtn').style.opacity = '0.5';
                    }
                } else {
                    statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                    statusEl.textContent = '❌ 请求失败 (HTTP ' + response.status + ')';
                    document.getElementById('subAPIConfirmBtn').disabled = true;
                    document.getElementById('subAPIConfirmBtn').style.opacity = '0.5';
                }
            } catch (error) {
                statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
                statusEl.textContent = '❌ 检测失败: ' + error.message;
                document.getElementById('subAPIConfirmBtn').disabled = true;
                document.getElementById('subAPIConfirmBtn').style.opacity = '0.5';
            } finally {
                testBtn.disabled = false;
            }
        }

        function showStatus(message, type) {
            const statusEl = document.getElementById('subAPIStatus');
            const prefix = type === 'error' ? '❌' : 'ℹ️';
            statusEl.textContent = prefix + ' ' + message;
            statusEl.style.display = 'block';
            if (type === 'error') {
                statusEl.style.background = 'linear-gradient(135deg, #ef4444 0, #dc2626 100%)';
            } else {
                statusEl.style.background = 'linear-gradient(135deg, #3b82f6 0, #1d4ed8 100%)';
            }
            statusEl.style.color = '#fff';
        }

        function confirmSubAPI() {
            const validURL = document.getElementById('subAPIConfirmBtn').dataset.validURL;
            if (!validURL) return;

            document.getElementById('subAPI').value = validURL;
            markModified('convert');
            closeSubAPIModal();
        }
