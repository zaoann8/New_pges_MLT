/* admin/index 模块5：网络信息与代理探索逻辑 */
        // 将布尔值转换为 emoji
        function boolToEmoji(value, trueEmoji = '✅', falseEmoji = '❌') {
            return value ? trueEmoji : falseEmoji;
        }

        // 将 IP 类型转换为中文并添加样式
        function formatIpType(type) {
            if (!type) return '<span class="ip-type-unknown">未知</span>';

            const typeMap = {
                'isp': { text: '住宅', class: 'ip-type-residential' },
                'hosting': { text: '机房', class: 'ip-type-hosting' },
                'business': { text: '商用', class: 'ip-type-business' }
            };

            const typeInfo = typeMap[type.toLowerCase()] || { text: type, class: 'ip-type-unknown' };
            return `<span class="${typeInfo.class}">${typeInfo.text}</span>`;
        }

        // 获取威胁等级的样式类
        function getThreatBadgeClass(score) {
            if (!score) return 'badge-info';

            const numScore = parseFloat(score);
            if (numScore < 0.001) return 'badge-success';
            if (numScore < 0.01) return 'badge-info';
            if (numScore < 0.1) return 'badge-warning';
            return 'badge-danger';
        }

        // 计算综合滥用评分
        function calculateAbuseScore(companyScore, asnScore, securityFlags = {}) {
            // 如果两个分数都无效，返回null
            if (!companyScore || companyScore === '未知') companyScore = 0;
            if (!asnScore || asnScore === '未知') asnScore = 0;

            const company = parseFloat(companyScore) || 0;
            const asn = parseFloat(asnScore) || 0;

            // 计算基础评分：(company + asn) / 2 * 5
            let baseScore = ((company + asn) / 2) * 5;

            // 计算安全风险附加分：每个安全风险项增加 15%
            let riskAddition = 0;
            const riskFlags = [
                securityFlags.is_crawler,   // 爬虫
                securityFlags.is_proxy,     // 代理服务器
                securityFlags.is_vpn,       // VPN
                securityFlags.is_tor,       // Tor 网络
                securityFlags.is_abuser     // 滥用 IP
            ];

            // 统计为 true 的风险项数量
            const riskCount = riskFlags.filter(flag => flag === true).length;
            riskAddition = riskCount * 0.15; // 每个风险项增加 15%

            // 最终评分 = 基础评分 + 风险附加分
            let finalScore = baseScore + riskAddition;

            // 如果是虚假IP (蜜罐)，则风险值增加100%
            if (securityFlags.is_bogon === true) {
                finalScore += 1.0; // 增加100%
            }

            // 如果基础评分和风险附加分都是0且不是虚假IP，返回null
            if (baseScore === 0 && riskAddition === 0 && securityFlags.is_bogon !== true) return null;

            return finalScore;
        }

        // 获取滥用评分的颜色等级
        function getAbuseScoreBadgeClass(percentage) {
            if (percentage === null || percentage === undefined) return 'badge-info';

            if (percentage >= 100) return 'badge-critical';      // 危险红色 >= 100%
            if (percentage >= 20) return 'badge-high';           // 橘黄色 15-99.99%
            if (percentage >= 5) return 'badge-elevated';     // 黄色 5-14.99%
            if (percentage >= 0.25) return 'badge-low';          // 淡绿色 0.25-4.99%
            return 'badge-verylow';                              // 绿色 < 0.25%
        }

        // 格式化滥用评分为百分比
        function formatAbuseScorePercentage(score) {
            if (score === null || score === undefined) return '未知';

            const percentage = score * 100;
            return percentage.toFixed(2) + '%';
        }

        // 切换评分算法说明气泡
        function toggleScoreTooltip(helpIcon) {
            const tooltip = helpIcon.nextElementSibling;
            const isShowing = tooltip.classList.contains('show');

            // 隐藏所有其他气泡
            document.querySelectorAll('.score-tooltip.show').forEach(t => {
                if (t !== tooltip) t.classList.remove('show');
            });

            // 切换当前气泡
            tooltip.classList.toggle('show');

            // 如果显示气泡，调整位置并添加点击事件监听器来关闭它
            if (!isShowing) {
                setTimeout(() => {
                    positionTooltipNearMouse(tooltip, helpIcon);

                    const closeTooltip = (e) => {
                        if (!tooltip.contains(e.target) && !helpIcon.contains(e.target)) {
                            tooltip.classList.remove('show');
                            document.removeEventListener('click', closeTooltip);
                        }
                    };
                    document.addEventListener('click', closeTooltip);
                }, 100);
            }
        }

        // 将气泡位置设置在鼠标附近
        function positionTooltipNearMouse(tooltip, helpIcon) {
            const iconRect = helpIcon.getBoundingClientRect();
            const tooltipWidth = tooltip.offsetWidth;
            const tooltipHeight = tooltip.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const padding = 10;

            let left = iconRect.right + padding;
            let top = iconRect.top - tooltipHeight / 2;

            // 如果气泡超出右边界，显示在左边
            if (left + tooltipWidth > windowWidth - padding) {
                left = iconRect.left - tooltipWidth - padding;
            }

            // 如果气泡超出顶部，调整到下方
            if (top < padding) {
                top = iconRect.top + padding;
            }

            // 如果气泡超出底部，调整到上方
            if (top + tooltipHeight > windowHeight - padding) {
                top = windowHeight - tooltipHeight - padding;
            }

            tooltip.style.position = 'fixed';
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        }

        // 显示 IP 详情弹窗
        function showIpDetailModal(data) {
            // 首先移除旧的弹窗（如果存在）
            const existingModal = document.querySelector('.ip-detail-modal');
            if (existingModal) existingModal.remove();

            // 创建弹窗
            const modal = document.createElement('div');
            modal.className = 'ip-detail-modal';

            // 计算评分和等级
            const companyScore = data.company?.abuser_score;
            const asnScore = data.asn?.abuser_score;
            const securityFlags = {
                is_crawler: data.is_crawler,
                is_proxy: data.is_proxy,
                is_vpn: data.is_vpn,
                is_tor: data.is_tor,
                is_abuser: data.is_abuser,
                is_bogon: data.is_bogon
            };

            const combinedScore = calculateAbuseScore(companyScore, asnScore, securityFlags);
            let riskControlHTML = '未知';
            let riskLevel = '未知';
            let badgeClass = 'badge-info';

            if (combinedScore !== null) {
                const scorePercentage = combinedScore * 100;
                badgeClass = getAbuseScoreBadgeClass(scorePercentage);
                const formattedScore = formatAbuseScorePercentage(combinedScore);

                if (scorePercentage >= 100) riskLevel = '极度危险';
                else if (scorePercentage >= 20) riskLevel = '高风险';
                else if (scorePercentage >= 5) riskLevel = '轻微风险';
                else if (scorePercentage >= 0.25) riskLevel = '纯净';
                else riskLevel = '极度纯净';

                riskControlHTML = `<span class="ip-detail-badge ${badgeClass}">${formattedScore} ${riskLevel}</span>`;
            }

            // 构建 HTML 结构
            modal.innerHTML = `
                <div class="ip-detail-content">
                    <div class="ip-detail-header">
                        <h2 class="ip-detail-title">
                            🔍 IP 详细信息
                            <span class="ip-detail-source-tag">数据来源: ipapi.is</span>
                        </h2>
                        <button class="ip-detail-close" title="关闭">&times;</button>
                    </div>
                    <div class="ip-detail-body">
                        <!-- 地图展示区 -->
                        <div class="ip-detail-map-container">
                            <div id="ip-detail-map"></div>
                        </div>

                        <!-- 数据网格区 -->
                        <div class="ip-detail-grid-container">
                            <!-- 左栏: 基本信息 (整合地理、运营商信息) -->
                            <div class="ip-detail-left-col">
                                <div class="ip-detail-card" style="height: 100%;">
                                    <div class="ip-detail-section-title">📍 基本信息</div>
                                    <div class="ip-detail-item" title="当前查询的公网 IP 地址，用于在互联网上唯一标识设备">
                                        <span class="ip-detail-label">IP 地址</span>
                                        <span class="ip-detail-value">${data.ip || '未知'}</span>
                                    </div>
                                    <div class="ip-detail-item" title="IP 地址的物理位置，通过 IP 地址段分配数据库推算得出，包括国家/地区、州省和城市信息">
                                        <span class="ip-detail-label">地理位置</span>
                                        <span class="ip-detail-value">${data.location?.country_code ? `[${data.location.country_code}]` : ''}${data.location?.country || ''} ${[data.location?.state, data.location?.city].filter(Boolean).join('/') || '未知'}</span>
                                    </div>
                                    <div class="ip-detail-item" title="该 IP 地址所在地区使用的标准时区，格式为洲/城市，如 Asia/Shanghai">
                                        <span class="ip-detail-label">时区</span>
                                        <span class="ip-detail-value">${data.location?.timezone || '未知'}</span>
                                    </div>
                                    <div class="ip-detail-item" title="IP 的网络类型:【住宅】家庭宽带、【机房】数据中心或云服务器、【商用】企业专线。左侧为运营商分类，右侧为 ASN (自治系统)分类">
                                        <span class="ip-detail-label">运营商 / ASN 类型</span>
                                        <span class="ip-detail-value">${formatIpType(data.company?.type)} / ${formatIpType(data.asn?.type)}</span>
                                    </div>
                                    <div class="ip-detail-item" title="综合滥用评分，基于运营商/ASN 历史记录和安全风险项计算。评分越低表示 IP 越纯净，越高表示被滥用可能性越大">
                                        <span class="ip-detail-label">风控评级</span>
                                        <span class="ip-detail-value">${riskControlHTML}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 右栏: 安全检测 -->
                            <div class="ip-detail-right-col">
                                <!-- 安全检测内容保持不变 -->
                                <div class="ip-detail-card" style="height: 100%;">
                                    <div class="ip-detail-section-title">🛡️ 安全检测</div>
                                    <div class="ip-detail-security-grid">
                                        <div class="ip-detail-item" title="该 IP 是否属于数据中心(IDC)、云服务商或主机托管服务。数据中心 IP 常被用于服务器部署，部分网站可能限制此类 IP 访问">
                                            <span class="ip-detail-label">数据中心</span>
                                            <span class="ip-detail-value">${data.is_datacenter ? '<span class="warning-text">🏢 是</span>' : '✅ 否'}</span>
                                        </div>
                                        <div class="ip-detail-item" title="该 IP 是否被识别为公开的代理服务器(如 HTTP/SOCKS 代理)。代理服务器可能被用于隐藏真实 IP，部分服务会限制代理访问">
                                            <span class="ip-detail-label">代理服务器</span>
                                            <span class="ip-detail-value">${data.is_proxy ? '<span class="danger-text">⚠️ 是</span>' : '✅ 否'}</span>
                                        </div>
                                        <div class="ip-detail-item" title="该 IP 是否属于已知的 VPN (虚拟私人网络)服务提供商。VPN 用于加密网络流量和隐藏真实位置，部分网站会限制 VPN 访问">
                                            <span class="ip-detail-label">VPN 连线</span>
                                            <span class="ip-detail-value">${data.is_vpn ? '<span class="danger-text">⚠️ 是</span>' : '✅ 否'}</span>
                                        </div>
                                        <div class="ip-detail-item" title="该 IP 是否属于 Tor (洋葱路由)匿名网络的出口节点。Tor 提供高度匿名性，但也常被用于非法活动，因此大多数网站会限制或禁止 Tor 访问">
                                            <span class="ip-detail-label">Tor 网络</span>
                                            <span class="ip-detail-value">${data.is_tor ? '<span class="danger-text">⚠️ 是</span>' : '✅ 否'}</span>
                                        </div>
                                        <div class="ip-detail-item" title="该 IP 是否被识别为网络爬虫(搜索引擎蜘蛛、数据采集机器人等)。爬虫可能对网站造成额外负担，部分网站会限制或特殊处理爬虫流量">
                                            <span class="ip-detail-label">网络爬虫</span>
                                            <span class="ip-detail-value">${data.is_crawler ? '<span class="danger-text">🤖 是</span>' : '✅ 否'}</span>
                                        </div>
                                        <div class="ip-detail-item" title="该 IP 是否来自移动网络运营商(如 4G/5G 网络)。移动网络 IP 通常动态分配且更换频繁，属于住宅类 IP">
                                            <span class="ip-detail-label">移动网络</span>
                                            <span class="ip-detail-value">${data.is_mobile ? '<span class="success-text">📱 是</span>' : '否'}</span>
                                        </div>
                                        <div class="ip-detail-item" title="该 IP 是否来自卫星互联网服务(如 Starlink、OneWeb 等)。卫星网络通常用于偏远地区或移动场景的互联网接入，延迟较高">
                                            <span class="ip-detail-label">卫星网络</span>
                                            <span class="ip-detail-value">${data.is_satellite ? '<span class="success-text">🛰️ 是</span>' : '否'}</span>
                                        </div>
                                        <div class="ip-detail-item" title="该 IP 是否存在已知的滥用记录(如垃圾邮件、DDoS 攻击、恶意扫描等)。滥用 IP 通常会被安全系统拦截或限制访问">
                                            <span class="ip-detail-label">已知滥用</span>
                                            <span class="ip-detail-value">${data.is_abuser ? '<span class="danger-text">⚠️ 是</span>' : '✅ 否'}</span>
                                        </div>
                                        <div class="ip-detail-item" title="该 IP 是否为虚假 IP (Bogon IP)，即保留地址、私有地址或未分配的地址段。此类 IP 不应出现在公网上，可能表示异常流量或蜜罐">
                                            <span class="ip-detail-label">虚假 IP</span>
                                            <span class="ip-detail-value">${data.is_bogon ? '<span class="danger-text">⚠️ 是</span>' : '✅ 否'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // 初始化弹窗内的地图
            if (data.location?.latitude && data.location?.longitude) {
                const lat = parseFloat(data.location.latitude);
                const lng = parseFloat(data.location.longitude);

                // 给 DOM 渲染留出一点点时间
                setTimeout(() => {
                    const detailMap = L.map('ip-detail-map', {
                        zoomControl: false,
                        attributionControl: false
                    }).setView([lat + 5, lng], 4); // 向上偏移中心点，使标记在视野内偏下

                    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
                        subdomains: '1234',
                        minZoom: 1,
                        maxZoom: 18
                    }).addTo(detailMap);

                    const popupHTML = `
                        <div class="ip-detail-popup-content">
                            <div class="ip-detail-popup-city">
                                ${data.location?.city || data.location?.country || '位置'}
                            </div>
                            <div class="ip-detail-popup-item">
                                <span class="ip-detail-popup-label">国家:</span>
                                <span class="ip-detail-popup-value">[${data.location?.country_code || '-'}]${data.location?.country || '未知'}</span>
                            </div>
                            <div class="ip-detail-popup-item">
                                <span class="ip-detail-popup-label">落地IP:</span>
                                <span class="ip-detail-popup-value">${data.ip}</span>
                            </div>
                            <div class="ip-detail-popup-item">
                                <span class="ip-detail-popup-label">ASN:</span>
                                <span class="ip-detail-popup-value">${data.asn?.asn || ''}</span>
                            </div>
                            <div class="ip-detail-popup-item">
                                <span class="ip-detail-popup-label">运营商:</span>
                                <span class="ip-detail-popup-value">${data.company?.name || '未知'}</span>
                            </div>
                        </div>
                    `;

                    L.marker([lat, lng])
                        .addTo(detailMap)
                        .bindPopup(popupHTML, { closeButton: false, offset: [0, -32] })
                        .openPopup();

                    // 偶尔地图布局会出问题，强制刷新
                    detailMap.invalidateSize();
                }, 400);
            } else {
                // 如果没有经纬度，隐藏地图容器
                const mapContainer = modal.querySelector('.ip-detail-map-container');
                if (mapContainer) mapContainer.style.display = 'none';
            }

            // 关闭逻辑
            const closeBtn = modal.querySelector('.ip-detail-close');
            const closeFunc = () => {
                modal.style.opacity = '0';
                modal.querySelector('.ip-detail-content').style.transform = 'translateY(20px)';
                setTimeout(() => modal.remove(), 300);
            };

            closeBtn.onclick = closeFunc;
            modal.onclick = (e) => { if (e.target === modal) closeFunc(); };

            // ESC 键关闭
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeFunc();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        }

        // ==================== 获取更多 PROXYIP 相关函数 ====================

        function showGetMoreProxyIPModal() {
            showExploreProxyModal('proxyip');
            // 重置已选
            selectedProxyIPs = [];
            updateSelectedProxyIPsUI();
        }

        function closeGetMoreProxyIPModal(event) {
            closeExploreProxyModal('proxyip', event);
        }

        function onProxyIPDataRegionChange() {
            onProxyRegionChange('proxyip');
        }

        async function verifySingleProxyIP(proxy, signal) {
            const config = proxyConfigs['proxyip'];
            const proxyIp = proxy.proxy; // format: ip

            if (signal && signal.aborted) return;

            // 设置15秒超时
            const timeoutId = setTimeout(() => {
                window[config.verificationStatus][proxyIp] = {
                    status: 'timeout',
                    responseTime: null
                };
                updateProxyDisplay('proxyip');
            }, 10000);

            window[config.verificationTimeouts][proxyIp] = timeoutId;

            try {
                const startTime = performance.now();
                // 替换对不信任第三方的检测，直接向该 ProxyIP 发起 /cdn-cgi/trace 请求来验证存活
                const response = await fetch(`https://${proxyIp}/cdn-cgi/trace`, { signal });
                clearTimeout(window[config.verificationTimeouts][proxyIp]);

                if (response.ok) {
                    const text = await response.text();
                    // 只要它能正确返回 Cloudflare 节点特征（包含 fl= ），就认为这个反代IP存活且可用
                    if (text.includes('fl=')) {
                        const endTime = performance.now();
                        window[config.verificationStatus][proxyIp] = {
                            status: 'success',
                            responseTime: Math.round(endTime - startTime)
                        };
                    } else {
                        window[config.verificationStatus][proxyIp] = {
                            status: 'failed',
                            responseTime: null
                        };
                    }
                } else {
                    window[config.verificationStatus][proxyIp] = {
                        status: 'failed',
                        responseTime: null
                    };
                }
            } catch (error) {
                if (signal && signal.aborted) return;
                window[config.verificationStatus][proxyIp] = {
                    status: 'failed',
                    responseTime: null
                };
            }
            updateProxyDisplay('proxyip');
        }

        function addSelectedProxyIP() {
            const select = document.getElementById('proxyIPProxySelect');
            const ip = select.value;
            if (!ip) return;

            if (selectedProxyIPs.length >= 8) {
                showToast('最多只能选择 8 个 ProxyIP', 'warning');
                return;
            }

            if (selectedProxyIPs.includes(ip)) {
                showToast('该 IP 已在选择列表中', 'warning');
                return;
            }

            selectedProxyIPs.push(ip);
            updateSelectedProxyIPsUI();
            updateProxyIPConfirmButton();
        }

        function removeSelectedProxyIP(ip) {
            selectedProxyIPs = selectedProxyIPs.filter(item => item !== ip);
            updateSelectedProxyIPsUI();
            updateProxyIPConfirmButton();
        }

        function updateSelectedProxyIPsUI() {
            const container = document.getElementById('selectedProxyIPsContainer');
            container.innerHTML = '';

            selectedProxyIPs.forEach(ip => {
                // 查找对应的国家 emoji
                const dataList = window.proxyIPListData || [];
                const proxyData = dataList.find(p => p.ip === ip);
                const emoji = proxyData?.country_emoji || '🌐';

                // 构建 title 信息
                let titleText = '';
                if (proxyData) {
                    const city = proxyData.city || '未知';
                    const country = proxyData.country || '未知';
                    const countryName = proxyData.country_cn || '未知';
                    const clientIp = proxyData.clientIp || ip;
                    const asn = proxyData.asn || '未知';
                    const asOrganization = proxyData.asOrganization || '未知';

                    titleText = `${city}\n国家: [${country}]${countryName}\n落地IP: ${clientIp}\nASN: ${asn}\n运营商: ${asOrganization}`;
                }

                const tag = document.createElement('div');
                tag.style.cssText = 'background: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 4px 10px; border-radius: 9999px; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;';
                if (titleText) {
                    tag.title = titleText;
                }
                tag.innerHTML = `
                    <span>${emoji} ${ip}</span>
                    <span onclick="removeSelectedProxyIP('${ip}')" style="cursor: pointer; font-weight: bold; font-size: 16px;">×</span>
                `;
                container.appendChild(tag);
            });
        }

        function updateProxyIPConfirmButton() {
            const btn = document.getElementById('proxyIPConfirmBtn');
            btn.disabled = selectedProxyIPs.length === 0;
        }

        function confirmSelectProxyIP() {
            const input = document.getElementById('proxyIP');
            if (input) {
                input.value = selectedProxyIPs.join(',');
                input.dispatchEvent(new Event('change', { bubbles: true }));
                markModified('proxy');
            }

            closeGetMoreProxyIPModal();

            // 如果勾选了自动获取，取消勾选
            const autoProxyCheck = document.getElementById('autoProxy');
            if (autoProxyCheck && autoProxyCheck.checked) {
                autoProxyCheck.checked = false;
                if (typeof toggleAutoProxy === 'function') toggleAutoProxy();
            }

            const config = proxyConfigs['proxyip'];
            if (config.abortController) {
                config.abortController.abort();
                config.abortController = null;
            }

            // 亮起保存和取消按钮
            const saveBtn = document.getElementById('saveProxyBtn');
            const cancelBtn = document.getElementById('cancelProxyBtn');
            if (saveBtn) saveBtn.disabled = false;
            if (cancelBtn) cancelBtn.disabled = false;
        }

        // ==================== SOCKS5 相关函数 ====================

        // 代理类型配置
        const proxyConfigs = {
            socks5: {
                modalId: 'exploreSocks5Modal',
                regionSelectId: 'socks5RegionSelect',
                proxySelectId: 'socks5ProxySelect',
                proxySelectGroupId: 'socks5ProxySelectGroup',
                confirmBtnId: 'socks5ConfirmBtn',
                listData: 'socks5ListData',
                countryMap: 'socks5CountryMap',
                verificationStatus: 'socks5VerificationStatus',
                verificationTimeouts: 'socks5VerificationTimeouts',
                url: 'https://raw.githubusercontent.com/EDT-Pages/Proxy-List/main/data/socks5.json',
                description: 'SOCKS5列表',
                inputId: 'socks5Addr',
                abortController: null,
                verifySingleFunction: (proxy, signal) => verifySingleProxy(proxy, 'socks5', signal)
            },
            http: {
                modalId: 'exploreHTTPModal',
                regionSelectId: 'httpRegionSelect',
                proxySelectId: 'httpProxySelect',
                proxySelectGroupId: 'httpProxySelectGroup',
                confirmBtnId: 'httpConfirmBtn',
                listData: 'httpListData',
                countryMap: 'httpCountryMap',
                verificationStatus: 'httpVerificationStatus',
                verificationTimeouts: 'httpVerificationTimeouts',
                url: 'https://raw.githubusercontent.com/EDT-Pages/Proxy-List/main/data/http.json',
                description: 'HTTP列表',
                inputId: 'httpAddr',
                abortController: null,
                verifySingleFunction: (proxy, signal) => verifySingleProxy(proxy, 'http', signal)
            },
            proxyip: {
                modalId: 'getMoreProxyIPModal',
                regionSelectId: 'proxyIPDataRegionSelect',
                proxySelectId: 'proxyIPProxySelect',
                proxySelectGroupId: 'proxyIPProxySelectGroup',
                confirmBtnId: 'proxyIPConfirmBtn',
                listData: 'proxyIPListData',
                countryMap: 'proxyIPCountryMap',
                verificationStatus: 'proxyIPVerificationStatus',
                verificationTimeouts: 'proxyIPVerificationTimeouts',
                url: '',
                description: 'ProxyIP列表',
                inputId: 'proxyIP',
                abortController: null,
                verifySingleFunction: (proxy, signal) => verifySingleProxyIP(proxy, signal)
            }
        };

        // 存储SOCKS5数据
        let socks5ListData = [];
        let socks5CountryMap = {};
        let socks5VerificationStatus = {}; // 存储验证状态
        let socks5VerificationTimeouts = {}; // 存储超时计时器

        // 存储 ProxyIP 数据
        let proxyIPListData = [];
        let proxyIPCountryMap = {};
        let proxyIPVerificationStatus = {};
        let proxyIPVerificationTimeouts = {};
        let selectedProxyIPs = []; // 存储用户选择的 ProxyIP

        function showExploreSocks5Modal() {
            showExploreProxyModal('socks5');
        }

        function closeExploreSocks5Modal(event) {
            closeExploreProxyModal('socks5', event);
        }

        function loadSocks5List() {
            loadProxyList('socks5');
        }

        function buildCountryMap(listData, countryMap) {
            countryMap = {};

            // 统计每个国家的代理数量
            listData.forEach(item => {
                const country = item.country;
                if (!countryMap[country]) {
                    countryMap[country] = [];
                }
                countryMap[country].push(item);
            });

            // 按数量排序（多到少）
            countryMap = Object.fromEntries(
                Object.entries(countryMap).sort((a, b) => b[1].length - a[1].length)
            );

            return countryMap;
        }

        function populateSocks5RegionSelect() {
            populateProxyRegionSelect('socks5');
        }

        function onSocks5RegionChange() {
            onProxyRegionChange('socks5');
        }

        function populateSocks5ProxySelect(selectedCountry) {
            populateProxySelect(selectedCountry, 'socks5ProxySelect', socks5CountryMap, socks5VerificationStatus, 'socks5');
        }

        function verifySocks5Proxies(proxies) {
            verifyProxies(proxies, verifySingleSocks5);
        }

        function verifySingleSocks5(proxy, signal) {
            return verifySingleProxy(proxy, 'socks5', signal);
        }

        function updateSocks5Display() {
            updateProxyDisplay('socks5');
        }

        function confirmSelectSocks5() {
            confirmSelectProxy('socks5');
        }

        function updateSocks5ConfirmButton() {
            updateProxyConfirmButton('socks5');
        }

        // 通用代理选择器填充函数
        function populateProxySelect(selectedCountry, selectId, countryMap, verificationStatus, type) {
            const select = document.getElementById(selectId);
            const proxies = countryMap[selectedCountry] || [];

            // 保存当前选中的值
            const currentValue = select.value;

            // 检查是否所有代理都验证完成
            const allVerified = proxies.every(p => {
                const status = verificationStatus[p.proxy];
                return status && status.status !== 'pending';
            });

            // 获取当前地区的所有代理，并按状态和延迟排序
            const sortedProxies = [...proxies].sort((a, b) => {
                const statusA = verificationStatus[a.proxy] || { status: 'pending' };
                const statusB = verificationStatus[b.proxy] || { status: 'pending' };

                // 可用的在前面，且按延迟从低到高
                if (statusA.status === 'success' && statusB.status === 'success') {
                    return (statusA.responseTime || 0) - (statusB.responseTime || 0);
                }
                if (statusA.status === 'success') return -1;
                if (statusB.status === 'success') return 1;

                return 0;
            });

            // 检查是否有成功的代理
            const successfulProxies = sortedProxies.filter(proxy => verificationStatus[proxy.proxy]?.status === 'success');

            // 辅助函数：生成代理选项HTML
            function generateProxyOption(proxy, isSelectable = false) {
                const status = verificationStatus[proxy.proxy] || { status: 'pending' };
                let emoji = '⏳';
                let statusText = '验证中';

                if (status.status === 'success') {
                    emoji = '✅';
                    statusText = `${status.responseTime}ms`;
                } else if (status.status === 'timeout') {
                    emoji = '🔴';
                    statusText = '已超时';
                } else if (status.status === 'failed') {
                    emoji = '🔴';
                    statusText = '不可用';
                }

                // ProxyIP 模式下 label 稍微不同，不包含协议前缀
                const label = type === 'proxyip'
                    ? `${emoji}[${statusText}]${proxy.ip}${proxy.city ? ` - ${proxy.city}` : ''},AS${proxy.asn}`
                    : `${emoji}[${statusText}]${proxy.city},AS${proxy.asn},${proxy.asOrganization}`;

                const disabled = !isSelectable || status.status !== 'success';
                // ProxyIP 不需要默认选中，因为是多选触发
                const selected = type !== 'proxyip' && isSelectable && status.status === 'success' && successfulProxies.indexOf(proxy) === 0 ? 'selected' : '';
                return `<option value="${proxy.proxy}" ${disabled ? 'disabled' : ''} ${selected}>${label}</option>`;
            }

            let html = type === 'proxyip' ? '<option value="">-- 请选择代理 --</option>' : '';
            if (successfulProxies.length > 0) {
                // 有成功的代理，显示所有代理
                sortedProxies.forEach(proxy => {
                    html += generateProxyOption(proxy, true);
                });
            } else if (allVerified) {
                // 验证完成但没有成功的代理
                html = '<option value="">很抱歉，当前地区无可用代理，请切换其他地区。</option>';
            } else {
                // 验证中，显示代理列表
                html = (type === 'proxyip' ? '<option value="">正在验证可用性，请稍候...</option>' : '<option value="">正在验证可用性，请稍候...</option>');
                sortedProxies.forEach(proxy => {
                    html += generateProxyOption(proxy, false);
                });
            }

            select.innerHTML = html;

            // 恢复用户的选择 (ProxyIP 模式下如果当前选中的仍然有效，也恢复)
            if (successfulProxies.length > 0) {
                if (currentValue && successfulProxies.some(p => p.proxy === currentValue)) {
                    select.value = currentValue;
                } else if (type !== 'proxyip') {
                    select.value = successfulProxies[0].proxy;
                }
            }
        }

        // 通用代理验证函数
        // Fisher-Yates 打乱算法 - 随机打乱数组顺序
        function shuffleArray(array) {
            const shuffled = [...array]; // 创建副本，不修改原数组
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                // 交换元素
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }

        function verifyProxies(proxies, verifySingleFunction, onProgress, signal) {
            // 打乱代理列表的顺序，避免多个用户同时测试时都从头开始
            const shuffledProxies = shuffleArray(proxies);

            // 并发控制：最多8个并发请求
            const maxConcurrent = 8;
            let currentIndex = 0;
            let activeRequests = 0;

            function startNextProxy() {
                if (signal && signal.aborted) return;
                if (currentIndex >= shuffledProxies.length || activeRequests >= maxConcurrent) {
                    return;
                }

                activeRequests++;
                const proxy = shuffledProxies[currentIndex++];

                verifySingleFunction(proxy, signal).finally(() => {
                    activeRequests--;
                    if (onProgress) onProgress();
                    startNextProxy();
                });
            }

            // 启动初始8个请求
            for (let i = 0; i < Math.min(maxConcurrent, shuffledProxies.length); i++) {
                startNextProxy();
            }
        }

        // 通用代理探索函数
        function showExploreProxyModal(type) {
            const config = proxyConfigs[type];
            if (!config.url) {
                showToast(`${config.description}公共来源已禁用，请手动填写代理地址`, 'info');
                return;
            }
            const modal = document.getElementById(config.modalId);
            if (!modal) return;

            // 重置状态
            window[config.listData] = [];
            window[config.countryMap] = {};
            window[config.verificationStatus] = {};
            window[config.verificationTimeouts] = {};
            lastMappedProxy[type] = null;

            modal.classList.add('show');
            document.getElementById(config.regionSelectId).innerHTML = '<option value="">加载中...</option>';
            document.getElementById(config.proxySelectGroupId).style.display = 'block';
            document.getElementById(config.confirmBtnId).disabled = true;

            // 初始化下拉框 focus/blur 监听（首次生效）
            ensureProxySelectListeners(type);
            // 重置节流状态
            resetProxyDisplayUpdateState(type);

            // 加载列表
            loadProxyList(type);

            // 初始化或更新地图容器
            setTimeout(() => {
                initProxyMap(type);
            }, 300);
        }

        const lastMappedProxy = {
            socks5: null,
            http: null,
            proxyip: null
        };

        const proxyMaps = {
            socks5: { map: null, marker: null },
            http: { map: null, marker: null },
            proxyip: { map: null, marker: null }
        };

        function initProxyMap(type) {
            const containerId = type === 'socks5' ? 'proxy-map-socks5' : (type === 'http' ? 'proxy-map-http' : 'proxy-map-proxyip');
            const container = document.getElementById(containerId);
            if (!container) return;

            // 如果地图已存在，先刷新布局
            if (proxyMaps[type] && proxyMaps[type].map) {
                proxyMaps[type].map.invalidateSize();
                return;
            }

            if (!proxyMaps[type]) proxyMaps[type] = { map: null, marker: null };

            // 创建地图
            const map = L.map(containerId, {
                zoomControl: false, // 隐藏缩放控制，让界面更清爽
                attributionControl: false
            }).setView([22.2783, 114.1747], 4);

            L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
                subdomains: '1234',
                minZoom: 1,
                maxZoom: 18
            }).addTo(map);

            proxyMaps[type].map = map;
        }

        function updateProxyMap(type) {
            const config = proxyConfigs[type];
            const select = document.getElementById(config.proxySelectId);
            const selectedProxyUrl = select.value;
            if (!selectedProxyUrl || !proxyMaps[type].map) return;

            // 如果该代理已经显示在地图上了，就不再重复加载，避免频繁刷新导致的气泡闪烁
            if (lastMappedProxy[type] === selectedProxyUrl) return;
            lastMappedProxy[type] = selectedProxyUrl;

            // 从数据列表中找到完整的代理信息
            const proxyData = window[config.listData].find(p => p.proxy === selectedProxyUrl);
            if (!proxyData || proxyData.latitude === null || proxyData.longitude === null) return;

            const lat = parseFloat(proxyData.latitude);
            const lng = parseFloat(proxyData.longitude);
            const map = proxyMaps[type].map;

            // 更新或创建 Marker
            if (proxyMaps[type].marker) {
                proxyMaps[type].marker.setLatLng([lat, lng]);
            } else {
                proxyMaps[type].marker = L.marker([lat, lng]).addTo(map);
            }

            // 平滑移动地图 - 将标记点定位到地图的下方60%位置，避免气泡被遮挡
            map.setZoom(4);

            // 计算偏移后的中心点，使标记显示在视图的60%处（下方）
            const mapSize = map.getSize();
            const offsetY = mapSize.y * 0.2; // 向上偏移20%，使标记显示在60%处
            const point = map.project([lat, lng], 4).subtract([0, offsetY]);
            const offsetCenter = map.unproject(point, 4);

            map.flyTo(offsetCenter, 4, {
                duration: 1.5
            });

            // 添加或更新 Popup
            const isDark = document.documentElement.classList.contains('dark-mode');
            const textColor = isDark ? '#ffffff' : '#333333';
            const popupContent = `
                <div class="ip-detail-popup-city">
                    ${proxyData.city || proxyData.country || '位置'}
                </div>
                <div class="ip-detail-popup-item">
                    <span class="ip-detail-popup-label">国家:</span>
                    <span class="ip-detail-popup-value">[${proxyData.country || '-'}]${proxyData.country_cn || ''}</span>
                </div>
                <div class="ip-detail-popup-item">
                    <span class="ip-detail-popup-label">落地IP:</span>
                    <span class="ip-detail-popup-value">${proxyData.clientIp || proxyData.ip || '-'}</span>
                </div>
                <div class="ip-detail-popup-item">
                    <span class="ip-detail-popup-label">ASN:</span>
                    <span class="ip-detail-popup-value">${proxyData.asn || ''}</span>
                </div>
                <div class="ip-detail-popup-item">
                    <span class="ip-detail-popup-label">运营商:</span>
                    <span class="ip-detail-popup-value">${proxyData.asOrganization || '未知'}</span>
                </div>
            `;
            proxyMaps[type].marker.bindPopup(popupContent, { offset: L.point(0, -32) }).openPopup();
        }

        function closeExploreProxyModal(type, event) {
            if (event && event.preventDefault) event.preventDefault();
            const config = proxyConfigs[type];
            const modal = document.getElementById(config.modalId);
            if (modal) {
                modal.classList.remove('show');
            }

            // 停止正在进行的测试
            if (config.abortController) {
                config.abortController.abort();
                config.abortController = null;
            }

            // 清除所有超时计时器
            for (let timeout of Object.values(window[config.verificationTimeouts])) {
                clearTimeout(timeout);
            }

            // 清理节流定时器
            resetProxyDisplayUpdateState(type);
        }

        function loadProxyList(type) {
            const config = proxyConfigs[type];
            const url = config.url;
            if (!url) {
                const regionSelect = document.getElementById(config.regionSelectId);
                if (regionSelect) regionSelect.innerHTML = '<option value="">来源已禁用</option>';
                return;
            }

            fetchWithAutoMirror(url, config.description)
                .then(text => {
                    let data = JSON.parse(text);
                    if (type === 'proxyip') {
                        // all.json format has a 'data' array
                        data = data.data.filter(item =>
                            Array.isArray(item.port) ? item.port.includes(443) : item.port === 443
                        ).map(item => ({
                            proxy: item.ip,
                            ip: item.ip,
                            country: item.meta?.country || 'Unknown',
                            country_cn: item.meta?.country_cn || '未知',
                            country_en: item.meta?.country_en || 'Unknown',
                            country_emoji: item.meta?.country_emoji || '🏳️',
                            city: item.meta?.city || '未知',
                            clientIp: item.meta?.clientIp || item.ip,
                            asn: item.meta?.asn || 0,
                            asOrganization: item.meta?.asOrganization || '未知',
                            continent: item.meta?.continent || 'Unknown',
                            latitude: item.meta?.latitude !== undefined ? item.meta.latitude : (item.meta?.colo?.lat !== undefined ? item.meta.colo.lat : null),
                            longitude: item.meta?.longitude !== undefined ? item.meta.longitude : (item.meta?.colo?.lon !== undefined ? item.meta.colo.lon : null)
                        }));
                    }
                    window[config.listData] = data;
                    window[config.countryMap] = buildCountryMap(window[config.listData], window[config.countryMap]);
                    populateProxyRegionSelect(type);
                })
                .catch(error => {
                    console.error(`${config.description}加载失败:`, error);
                    document.getElementById(config.regionSelectId).innerHTML = '<option value="">加载失败</option>';
                });
        }

        // 大洲信息映射
        const continentInfo = {
            'AS': { emoji: '🌏', name: '亚洲' },
            'NA': { emoji: '🌎', name: '北美' },
            'EU': { emoji: '🌍', name: '欧洲' },
            'AF': { emoji: '🌍', name: '非洲' },
            'SA': { emoji: '🌎', name: '南美' },
            'OC': { emoji: '🌏', name: '大洋洲' },
            'AN': { emoji: '❄️', name: '南极洲' }
        };

        function populateProxyRegionSelect(type) {
            const config = proxyConfigs[type];
            const select = document.getElementById(config.regionSelectId);
            let html = '<option value="">-- 请选择地区 --</option>';

            // 构建按大洲分组的结构
            const continentMap = {};

            // 遍历所有国家，归类到大洲
            for (const [country, proxies] of Object.entries(window[config.countryMap])) {
                const proxy = proxies[0]; // 取第一个代理获取大洲信息
                const continent = proxy.continent || 'Unknown';
                const continentData = continentInfo[continent] || { emoji: '🌍', name: continent };

                if (!continentMap[continent]) {
                    continentMap[continent] = {
                        emoji: continentData.emoji,
                        name: continentData.name,
                        countries: {}
                    };
                }

                continentMap[continent].countries[country] = {
                    count: proxies.length,
                    name: proxy.country_cn || country,
                    emoji: proxy.country_emoji || ''
                };
            }

            // 生成 HTML
            for (const [continentCode, continentData] of Object.entries(continentMap)) {
                const label = `${continentData.emoji} ${continentData.name} / ${continentCode}`;
                html += `<optgroup label="${label}">`;

                for (const [country, countryData] of Object.entries(continentData.countries)) {
                    html += `<option value="${country}">${countryData.emoji} ${countryData.name}(${countryData.count})</option>`;
                }

                html += `</optgroup>`;
            }

            select.innerHTML = html;
        }

        function onProxyRegionChange(type) {
            const config = proxyConfigs[type];
            const selectedCountry = document.getElementById(config.regionSelectId).value;

            if (!selectedCountry) {
                document.getElementById(config.confirmBtnId).disabled = true;
                return;
            }

            const proxies = window[config.countryMap][selectedCountry] || [];

            // 显示代理选择组
            document.getElementById(config.proxySelectGroupId).style.display = 'block';

            // 初始化每个代理的验证状态
            proxies.forEach(proxy => {
                if (!window[config.verificationStatus][proxy.proxy]) {
                    window[config.verificationStatus][proxy.proxy] = {
                        status: 'pending', // pending, success, failed, timeout
                        responseTime: null
                    };
                }
            });

            // 设置select为验证中状态
            const select = document.getElementById(config.proxySelectId);
            select.innerHTML = '<option value="">正在验证可用性，请稍候...</option>';

            // 显示代理列表
            populateProxySelect(selectedCountry, config.proxySelectId, window[config.countryMap], window[config.verificationStatus]);

            // 释放之前的 AbortController 并创建新的
            if (config.abortController) {
                config.abortController.abort();
            }
            config.abortController = new AbortController();

            // 开始验证所有代理
            verifyProxies(proxies, config.verifySingleFunction, () => {
                updateProxyDisplay(type);
                // 如果当前选中的是成功的，尝试更新地图
                updateProxyMap(type);
            }, config.abortController.signal);
        }

        // ===== 节流更新系统：避免移动端下拉框被频繁刷新 =====
        const PROXY_DISPLAY_UPDATE_INTERVAL = 6000; // 节流间隔：6秒
        const proxyDisplayUpdateState = {
            socks5: { lastUpdate: 0, pending: false, timer: null, selectOpen: false, listenersAdded: false },
            http: { lastUpdate: 0, pending: false, timer: null, selectOpen: false, listenersAdded: false },
            proxyip: { lastUpdate: 0, pending: false, timer: null, selectOpen: false, listenersAdded: false }
        };

        // 为代理选择下拉框添加 focus/blur 监听，检测用户是否正在操作下拉框
        function ensureProxySelectListeners(type) {
            const state = proxyDisplayUpdateState[type];
            if (state.listenersAdded) return;
            const config = proxyConfigs[type];
            const select = document.getElementById(config.proxySelectId);
            if (!select) return;
            select.addEventListener('focus', () => {
                state.selectOpen = true;
            });
            select.addEventListener('blur', () => {
                state.selectOpen = false;
                // 下拉框关闭时，如果有待处理的更新立即执行
                if (state.pending) {
                    _doUpdateProxyDisplay(type);
                }
            });
            state.listenersAdded = true;
        }

        // 检查当前地区所有代理是否全部验证完成
        function isAllProxiesVerified(type) {
            const config = proxyConfigs[type];
            const selectedCountry = document.getElementById(config.regionSelectId).value;
            if (!selectedCountry) return false;
            const proxies = window[config.countryMap][selectedCountry] || [];
            return proxies.length > 0 && proxies.every(p => {
                const s = window[config.verificationStatus][p.proxy];
                return s && s.status !== 'pending';
            });
        }

        // 节流版 updateProxyDisplay —— 外部统一调用此函数
        // 策略：下拉框关闭时实时更新；下拉框打开时每 6 秒节流更新一次
        function updateProxyDisplay(type) {
            const state = proxyDisplayUpdateState[type];
            const now = Date.now();

            // 下拉框未打开：直接实时更新
            if (!state.selectOpen) {
                if (state.timer) { clearTimeout(state.timer); state.timer = null; }
                _doUpdateProxyDisplay(type);
                return;
            }

            // === 以下为下拉框打开状态的节流逻辑 ===

            // 全部验证完成时强制安排一次更新（最终结果）
            if (isAllProxiesVerified(type)) {
                if (state.timer) { clearTimeout(state.timer); state.timer = null; }
                // 距上次更新已超过节流间隔，直接更新
                if (now - state.lastUpdate >= PROXY_DISPLAY_UPDATE_INTERVAL) {
                    _doUpdateProxyDisplay(type);
                } else {
                    // 未到间隔，安排一个定时器确保最终结果会被刷新
                    state.pending = true;
                    if (!state.timer) {
                        const delay = PROXY_DISPLAY_UPDATE_INTERVAL - (now - state.lastUpdate);
                        state.timer = setTimeout(() => {
                            state.timer = null;
                            if (state.pending) {
                                _doUpdateProxyDisplay(type);
                            }
                        }, delay);
                    }
                }
                return;
            }

            // 节流：距上次更新不到 6 秒，延迟执行
            if (now - state.lastUpdate < PROXY_DISPLAY_UPDATE_INTERVAL) {
                state.pending = true;
                if (!state.timer) {
                    const delay = PROXY_DISPLAY_UPDATE_INTERVAL - (now - state.lastUpdate);
                    state.timer = setTimeout(() => {
                        state.timer = null;
                        if (state.pending) {
                            _doUpdateProxyDisplay(type);
                        }
                    }, delay);
                }
                return;
            }

            // 已超过节流间隔，直接更新
            _doUpdateProxyDisplay(type);
        }

        // 实际执行更新的内部函数
        function _doUpdateProxyDisplay(type) {
            const state = proxyDisplayUpdateState[type];
            state.lastUpdate = Date.now();
            state.pending = false;

            const config = proxyConfigs[type];
            const selectedCountry = document.getElementById(config.regionSelectId).value;
            if (selectedCountry) {
                populateProxySelect(selectedCountry, config.proxySelectId, window[config.countryMap], window[config.verificationStatus], type);

                // 更新确定按钮状态
                const select = document.getElementById(config.proxySelectId);
                const selectedValue = select.value;
                const isValidSelected = selectedValue &&
                    window[config.verificationStatus][selectedValue] &&
                    window[config.verificationStatus][selectedValue].status === 'success';
                document.getElementById(config.confirmBtnId).disabled = !isValidSelected;
            }
        }

        // 重置节流状态（模态框关闭时调用）
        function resetProxyDisplayUpdateState(type) {
            const state = proxyDisplayUpdateState[type];
            if (state.timer) { clearTimeout(state.timer); state.timer = null; }
            state.lastUpdate = 0;
            state.pending = false;
            state.selectOpen = false;
        }

        function confirmSelectProxy(type) {
            const config = proxyConfigs[type];
            const select = document.getElementById(config.proxySelectId);
            const selectedProxy = select.value;

            if (!selectedProxy) {
                showToast(`请选择一个有效的${type.toUpperCase()}代理`, 'error');
                return;
            }

            // 填入代理地址
            const input = document.getElementById(config.inputId);
            if (input) {
                input.value = selectedProxy.replace(/^socks5:\/\/|^http:\/\/|^https:\/\//, '');
                input.dispatchEvent(new Event('change', { bubbles: true }));
                markModified('proxy');
            }

            // 关闭模态框
            const modal = document.getElementById(config.modalId);
            if (modal) {
                modal.classList.remove('show');
            }

            // 确认选择后停止剩余测试
            if (config.abortController) {
                config.abortController.abort();
                config.abortController = null;
            }

            // 亮起保存和取消按钮
            const saveBtn = document.getElementById('saveProxyBtn');
            const cancelBtn = document.getElementById('cancelProxyBtn');
            if (saveBtn) saveBtn.disabled = false;
            if (cancelBtn) cancelBtn.disabled = false;
        }

        function updateProxyConfirmButton(type) {
            const config = proxyConfigs[type];
            const select = document.getElementById(config.proxySelectId);
            const selectedValue = select.value;
            const confirmBtn = document.getElementById(config.confirmBtnId);

            // 检查选中的代理是否可用
            const isValidSelected = selectedValue &&
                window[config.verificationStatus][selectedValue] &&
                window[config.verificationStatus][selectedValue].status === 'success';

            if (confirmBtn) {
                confirmBtn.disabled = !isValidSelected;
            }
        }

        // 通用单个代理验证函数
        function verifySingleProxy(proxy, type, signal) {
            return new Promise((resolve) => {
                const config = proxyConfigs[type];
                const { protocol, proxy: proxyUrl } = proxy;
                const cleanProxy = proxyUrl.replace(protocol + '://', '');
                const checkUrl = `/admin/check?${protocol}=${encodeURIComponent(cleanProxy)}&_t=${Date.now()}`;

                // 如果已经终止，直接返回
                if (signal && signal.aborted) {
                    return resolve();
                }

                // 设置15秒超时
                const timeoutId = setTimeout(() => {
                    window[config.verificationStatus][proxyUrl] = {
                        status: 'timeout',
                        responseTime: null
                    };
                    updateProxyDisplay(type);
                    resolve();
                }, 15000);

                window[config.verificationTimeouts][proxyUrl] = timeoutId;

                fetch(checkUrl, { signal })
                    .then(response => response.json())
                    .then(data => {
                        clearTimeout(timeoutId);
                        delete window[config.verificationTimeouts][proxyUrl];

                        if (data.success) {
                            window[config.verificationStatus][proxyUrl] = {
                                status: 'success',
                                responseTime: data.responseTime
                            };
                        } else {
                            window[config.verificationStatus][proxyUrl] = {
                                status: 'failed',
                                responseTime: null
                            };
                        }
                        updateProxyDisplay(type);
                        resolve();
                    })
                    .catch(error => {
                        clearTimeout(timeoutId);
                        delete window[config.verificationTimeouts][proxyUrl];

                        window[config.verificationStatus][proxyUrl] = {
                            status: 'failed',
                            responseTime: null
                        };
                        updateProxyDisplay(type);
                        resolve();
                    });
            });
        }

        // ==================== HTTP 相关函数 ====================

        // 存储HTTP数据
        let httpListData = [];
        let httpCountryMap = {};
        let httpVerificationStatus = {}; // 存储验证状态
        let httpVerificationTimeouts = {}; // 存储超时计时器

        function showExploreHTTPModal() {
            showExploreProxyModal('http');
        }

        function closeExploreHTTPModal(event) {
            closeExploreProxyModal('http', event);
        }

        function loadHTTPList() {
            loadProxyList('http');
        }


        function populateHTTPRegionSelect() {
            populateProxyRegionSelect('http');
        }

        function onHTTPRegionChange() {
            onProxyRegionChange('http');
        }

        function populateHTTPProxySelect(selectedCountry) {
            populateProxySelect(selectedCountry, 'httpProxySelect', httpCountryMap, httpVerificationStatus, 'http');
        }

        function verifyHTTPProxies(proxies) {
            verifyProxies(proxies, verifySingleHTTP);
        }

        function verifySingleHTTP(proxy, signal) {
            return verifySingleProxy(proxy, 'http', signal);
        }

        function updateHTTPDisplay() {
            updateProxyDisplay('http');
        }

        function confirmSelectHTTP() {
            confirmSelectProxy('http');
        }

        function updateHTTPConfirmButton() {
            updateProxyConfirmButton('http');
        }

        // ============ HOSTS 检查相关函数 ============

        // 检查当前访问域名是否在 HOSTS 数组中
        function checkHostsMismatch() {
            const currentHostname = window.location.hostname;
            const hosts = currentConfig.HOSTS || [];

            // 检查当前 hostname 是否存在于 HOSTS 数组中
            const isHostInArray = hosts.some(host => {
                // 移除端口号后进行比较
                const hostWithoutPort = host.split(':')[0];
                return hostWithoutPort === currentHostname;
            });

            if (!isHostInArray && hosts.length > 0) {
                // 检查缓存，是否在 24 小时内已提示过
                if (shouldShowHostsMismatchNotification()) {
                    showHostsMismatchNotification(currentHostname, hosts);
                }
            }
        }

        // 检查是否应该显示 HOSTS 不匹配提示
        function shouldShowHostsMismatchNotification() {
            const cacheKey = 'hostsMismatchNotificationTime';
            const cachedTime = localStorage.getItem(cacheKey);

            if (!cachedTime) {
                // 没有缓存，应该显示
                return true;
            }

            const lastNotificationTime = parseInt(cachedTime, 10);
            const currentTime = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000; // 24 小时毫秒数

            // 检查是否超过 24 小时
            return (currentTime - lastNotificationTime) > twentyFourHours;
        }

        // 显示 HOSTS 不匹配提示
        function showHostsMismatchNotification(currentHostname, hosts) {
            // 填充模态框中的内容
            const currentHostnameEl = document.getElementById('currentHostname');
            const hostToAddEl = document.getElementById('hostToAdd');
            const currentHostsEl = document.getElementById('currentHosts');

            if (currentHostnameEl) {
                currentHostnameEl.textContent = currentHostname;
            }
            if (hostToAddEl) {
                hostToAddEl.textContent = currentHostname;
            }

            // 填充当前 HOSTS 列表 - 用 HTML badge 而不是纯文本
            if (currentHostsEl) {
                // 清空并用 HTML 结构重新填充
                currentHostsEl.innerHTML = '';

                hosts.forEach((host) => {
                    const badge = document.createElement('span');
                    badge.className = 'hosts-badge';
                    badge.textContent = host;
                    currentHostsEl.appendChild(badge);
                });
            }

            // 显示模态框
            const overlay = document.getElementById('hostsMismatchModal');
            if (overlay) {
                const modal = overlay.querySelector('.modal');
                overlay.classList.add('show');
                console.log('✓ 域名不匹配提示已显示');
            } else {
                console.error('✗ 无法找到 hostsMismatchModal 元素');
            }
        }

        // 关闭 HOSTS 不匹配提示模态框
        function closeHostsMismatchModal(event) {
            // 如果有事件对象且点击的不是 overlay 本身，则返回
            if (event && event.target && event.target.id !== 'hostsMismatchModal') {
                return;
            }

            const overlay = document.getElementById('hostsMismatchModal');
            if (overlay) {
                overlay.classList.remove('show');
            }
        }

        // 处理"知道了！24小时内不提示"按钮
        function dismissHostsMismatchNotification() {
            const cacheKey = 'hostsMismatchNotificationTime';
            const currentTime = Date.now();

            // 将当前时间戳保存到 localStorage
            localStorage.setItem(cacheKey, currentTime.toString());

            // 关闭模态框
            closeHostsMismatchModal({ target: { id: 'hostsMismatchModal' } });

            // 显示确认提示
            showToast('🎉 24小时内不会再提示', 'info');
        }
