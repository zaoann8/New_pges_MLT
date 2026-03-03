/* admin/index 模块1：核心状态与主界面逻辑 */
        let currentConfig = {};
        let originalConfig = {};
        let modifiedSections = new Set();
        let subConfigData = null;
        let hasMultipleHosts = false; // 标记是否存在多个 HOSTS
        const DEFAULT_SUB_API = 'https://subconverter-latest-qfyo.onrender.com';

        function ensureConvertConfigDefaults(config) {
            if (!config.订阅转换配置) config.订阅转换配置 = {};
            if (!config.订阅转换配置.SUBAPI) config.订阅转换配置.SUBAPI = DEFAULT_SUB_API;
            if (config.订阅转换配置.SUBCONFIG === undefined) config.订阅转换配置.SUBCONFIG = '';
            if (config.订阅转换配置.SUBEMOJI === undefined) config.订阅转换配置.SUBEMOJI = false;
            return config.订阅转换配置.SUBAPI;
        }

        function ensureSubGeneratorDefaults(config) {
            if (!config.优选订阅生成) config.优选订阅生成 = {};
            const sub = config.优选订阅生成;
            if (sub.local === undefined) sub.local = true;
            if (!sub.本地IP库) sub.本地IP库 = {};
            if (sub.本地IP库.随机IP === undefined) sub.本地IP库.随机IP = false;
            if (sub.本地IP库.随机数量 === undefined) sub.本地IP库.随机数量 = 16;
            if (sub.本地IP库.指定端口 === undefined) sub.本地IP库.指定端口 = -1;
            if (sub.SUB === undefined) sub.SUB = null;
            if (!sub.SUBNAME) sub.SUBNAME = 'edgetunnel';
            if (sub.SUBUpdateTime === undefined) sub.SUBUpdateTime = 3;
            if (sub.TOKEN === undefined) sub.TOKEN = '';
            return sub;
        }

        // 延迟测试配置
        const latencyTestConfig = {
            count: 16  // 采样和显示数量
        };

        // 追踪延迟显示的动画状态
        const latencyUIState = {};

        // 标记延迟测试是否已经开始，防止重复执行
        let latencyTestStarted = false;

        // 延迟测试数据
        const latencySites = [
            {
                name: '字节抖音',
                region: '国内',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#1677FF" d="m19.9 1.5 4.1 1v19l-4.1 1zM6.5 10.9l4.1 1v9l-4 1.1zM0 2.6l4.1 1v16.8l-4.1 1zm17.5 5.6v11.1l-4.2-1v-9z"></path></svg>',
                url: 'https://lf3-zlink-tos.ugurl.cn/obj/zebra-public/resource_lmmizj_1632398893.png'
            },
            {
                name: 'Bilibili',
                region: '国内',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FB7299" d="M17.813 4.653h.854q2.266.08 3.773 1.574Q23.946 7.72 24 9.987v7.36q-.054 2.266-1.56 3.773c-1.506 1.507-2.262 1.524-3.773 1.56H5.333q-2.266-.054-3.773-1.56C.053 19.614.036 18.858 0 17.347v-7.36q.054-2.267 1.56-3.76t3.773-1.574h.774l-1.174-1.12a1.23 1.23 0 0 1-.373-.906q0-.534.373-.907l.027-.027q.4-.373.92-.373t.92.373L9.653 4.44q.107.106.187.213h4.267a.8.8 0 0 1 .16-.213l2.853-2.747q.4-.373.92-.373c.347 0 .662.151.929.4s.391.551.391.907q0 .532-.373.906zM5.333 7.24q-1.12.027-1.88.773q-.76.748-.786 1.894v7.52q.026 1.146.786 1.893t1.88.773h13.334q1.12-.026 1.88-.773t.786-1.893v-7.52q-.026-1.147-.786-1.894t-1.88-.773zM8 11.107q.56 0 .933.373q.375.374.4.96v1.173q-.025.586-.4.96q-.373.375-.933.374c-.56-.001-.684-.125-.933-.374q-.375-.373-.4-.96V12.44q0-.56.386-.947q.387-.386.947-.386m8 0q.56 0 .933.373q.375.374.4.96v1.173q-.025.586-.4.96q-.373.375-.933.374c-.56-.001-.684-.125-.933-.374q-.375-.373-.4-.96V12.44q.025-.586.4-.96q.373-.373.933-.373"></path></svg>',
                url: 'https://i0.hdslb.com/bfs/face/member/noface.jpg@24w_24h_1c'
            },
            {
                name: '腾讯微信',
                region: '国内',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#09B83E" d="M8.7 2.19C3.9 2.19 0 5.48 0 9.53c0 2.21 1.17 4.2 3 5.55a.6.6 0 0 1 .21.66l-.39 1.48q-.03.11-.04.22c0 .16.13.3.29.3a.3.3 0 0 0 .16-.06l1.9-1.11a.9.9 0 0 1 .72-.1 10 10 0 0 0 2.84.4q.41-.01.81-.05a5.85 5.85 0 0 1 1.93-6.45 8.3 8.3 0 0 1 5.86-1.83c-.58-3.59-4.2-6.35-8.6-6.35m-2.9 3.8c.64 0 1.16.53 1.16 1.18a1.17 1.17 0 0 1-1.16 1.18 1.17 1.17 0 0 1-1.17-1.18c0-.65.52-1.18 1.17-1.18m5.8 0c.65 0 1.17.53 1.17 1.18a1.17 1.17 0 0 1-1.16 1.18 1.17 1.17 0 0 1-1.16-1.18c0-.65.52-1.18 1.16-1.18m5.34 2.87a8 8 0 0 0-5.28 1.78 5.5 5.5 0 0 0-1.78 6.22c.94 2.46 3.66 4.23 6.88 4.23q1.25 0 2.36-.33a.7.7 0 0 1 .6.08l1.59.93.14.04c.13 0 .24-.1.24-.24q-.01-.09-.04-.18l-.33-1.23-.02-.16a.5.5 0 0 1 .2-.4 5.8 5.8 0 0 0 2.5-4.62c0-3.21-2.93-5.84-6.66-6.09zm-2.53 3.27c.53 0 .97.44.97.98a1 1 0 0 1-.97.99 1 1 0 0 1-.97-.99c0-.54.43-.98.97-.98zm4.84 0c.54 0 .97.44.97.98a1 1 0 0 1-.97.99 1 1 0 0 1-.97-.99c0-.54.44-.98.97-.98"></path></svg>',
                url: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico'
            },
            {
                name: '阿里淘宝',
                region: '国内',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#E16322" d="M21.31 9.9a3 3 0 1 1 0 1.92.96.96 0 0 1 0-1.92m2.39 3.05H13.3v-.96h4.14V9.76h-2.89v-.77h2.9v-.92h-2.52v.2H13.3v-2.9h1.64v.35l2.52-.3V4.6h1.85v.64c.93-.08 1.76-.13 2.21-.1 1.5.06 2.45.27 2.49 1.26.03 1-1.43 1.9-1.43 1.9l-.45-.43v.2h-2.8v.92h3.22v.77h-3.23v2.23h4.39zM21.53 7.3l-.02-.01s1.38-.76.35-1.27c-.87-.43-5.54.3-6.93.62v.66zM1.88 6.42a1 1 0 0 0 0-2 1 1 0 0 0-1 1 1 1 0 0 0 1 1m3.41-.86a7 7 0 0 0 .37-.72L4.2 4.42s-.6 1.93-1.65 2.83c0 0 1.02.6 1.01.58a10 10 0 0 0 .78-.88l.68-.3a9 9 0 0 1-1.14 1.69l.61.54s.42-.4.88-.9h.53v.9H3.86v.73H5.9v1.72h-.08c-.23-.01-.58-.05-.71-.27-.17-.26-.05-.75-.04-1.04h-1.4l-.06.02s-.52 2.32 1.5 2.27a5.3 5.3 0 0 0 3.46-.92l.2.76 1.17-.48-.79-1.92-.94.3.18.65a3 3 0 0 1-.82.42V9.6h2v-.72h-2v-.9h2v-.72H6.01c.26-.31.46-.6.51-.78l-.62-.17c2.67-.95 4.15-.79 4.13.77v4.12s.16 1.4-1.46 1.3l-.87-.18-.21.83s3.78 1.08 4.1-1.82-.09-4.76-.09-4.76-.34-2.68-6.2-1.02zm-5.23 6.6 1.58.98c1.1-2.38 1.03-2.06 1.3-2.92.29-.87.35-1.54-.13-2.02a10 10 0 0 0-1.6-1.36L.55 7.86l1.21.75s.82.42.43 1.2c-.36.73-2.13 2.34-2.13 2.34M20 19s-.02.53-.67.53c-.6 0-.64-.42-.64-.42q-.39.45-1.07.46c-.76 0-1.3-.51-1.3-1.3 0-.78.56-1.27 1.4-1.27.39 0 .73.15.93.4l.01-.2c0-.56-.3-.8-1-.8q-.51 0-1.02.13.16-.33.3-.45.18-.14.94-.14c1.27 0 1.74.42 1.74 1.42v1.2c0 .32.03.44.38.44m-1.33-.74c0-.48-.25-.75-.64-.75-.4 0-.66.28-.66.76 0 .47.27.76.65.76.39 0 .65-.27.65-.77m5.27-.5c0 1.15-.7 1.82-1.78 1.82-1.1 0-1.77-.67-1.77-1.82 0-1.16.68-1.83 1.77-1.83s1.78.67 1.78 1.83m-1.08 0q0-1.3-.7-1.3t-.69 1.3.7 1.3.69-1.3m-7.14-.05c0 1.17-.65 1.86-1.57 1.86q-.66-.01-1.05-.47s-.1.42-.66.42c-.69 0-.67-.52-.67-.52.4.02.38-.21.38-.43v-2.89c0-.36-.07-.48-.43-.49.02-.1.08-.53.68-.53.82 0 .76.91.76.91v.79q.34-.4 1-.4c.96 0 1.56.65 1.56 1.75m-1.09.08q-.01-1.35-.76-1.35c-.44 0-.74.4-.74 1.1v.36c0 .72.31 1.12.76 1.12q.73 0 .74-1.23m-3.24-.03c0 1.15-.7 1.82-1.78 1.82-1.1 0-1.78-.67-1.78-1.82 0-1.16.68-1.83 1.78-1.83s1.78.67 1.78 1.83m-1.09 0q0-1.3-.7-1.3-.69 0-.68 1.3t.69 1.3q.7 0 .7-1.3m-6-2.72q-.4.11-1.55.1-1.38-.02-1.85-.04c-.52 0-.73.13-.91.66q.45-.13 1.13-.11c.36 0 .42.04.42.3v2.9c0 .28.11.67.72.67.71 0 .84-.52.84-.52-.36 0-.43-.13-.43-.49v-2.56c0-.27.1-.28.47-.28h.26c.55 0 .7-.1.9-.63M7.46 19s-.02.52-.67.52c-.56 0-.64-.4-.64-.4q-.39.45-1.07.45c-.76 0-1.3-.52-1.3-1.3S4.33 17 5.17 17c.39 0 .73.14.93.4v-.2c0-.56-.3-.8-1-.8q-.5 0-1.01.13.15-.33.3-.46.17-.14.94-.14c1.26 0 1.74.43 1.74 1.43v1.2c0 .32.03.44.38.44m-1.33-.75c0-.48-.26-.74-.64-.74-.4 0-.67.28-.67.76 0 .46.28.76.66.76.39 0 .65-.28.65-.78"></path></svg>',
                url: 'https://img.alicdn.com/imgextra/i2/O1CN01qnQCrN1VkzAWiU4Hs_!!6000000002692-2-tps-33-33.png'
            },
            {
                name: 'GitHub',
                region: '国际',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#181717" d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.7 4.7 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3"></path></svg>',
                url: 'https://github.github.io/janky/images/bg_hr.png'
            },
            {
                name: 'Telegram',
                region: '国际',
                icon: '<svg width="24px" height="24px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="linearGradient-1"><stop stop-color="#38AEEB" offset="0%"></stop><stop stop-color="#279AD1" offset="100%"></stop></linearGradient></defs><g id="Artboard" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><circle id="Oval" fill="url(#linearGradient-1)" cx="8" cy="8" r="8"></circle><path d="M3.17026167,7.83635602 C5.78750201,6.74265999 7.53273882,6.02162863 8.40597211,5.67326193 C10.8992306,4.67860423 11.2454541,4.53439191 11.5831299,4.52864956 C11.6573986,4.52743168 11.8385417,4.55776042 11.9798438,4.67645833 C12.1211458,4.79515625 12.1635786,4.87206678 12.1755371,4.93908691 C12.1874957,5.00610705 12.1862759,5.21456762 12.1744385,5.3338623 C12.0393279,6.69547283 11.5259342,9.83829771 11.2285121,11.3633248 C11.1026617,12.008621 10.8548582,12.2249854 10.6149558,12.2461596 C10.0935924,12.2921758 9.69769267,11.9156852 9.19272668,11.5981993 C8.40255458,11.1013965 8.13911734,10.9180161 7.3721185,10.4332283 C6.48571864,9.87297217 6.85080034,9.6784879 7.35595703,9.17524981 C7.48815894,9.04355001 9.67825076,7.04590073 9.71077046,6.86250183 C9.7391276,6.70257812 9.7494847,6.68189389 9.67664063,6.60973958 C9.60379655,6.53758527 9.51674192,6.54658941 9.46083149,6.55876051 C9.38158015,6.57601267 8.17521836,7.33962686 5.84174612,8.84960308 C5.48344358,9.08558775 5.15890428,9.20056741 4.86812819,9.19454205 C4.54757089,9.18789957 3.93094724,9.02070014 3.47255094,8.87778221 C2.91030922,8.70248755 2.46345069,8.609808 2.50236203,8.31210343 C2.52262946,8.15704047 2.74526267,7.998458 3.17026167,7.83635602 Z" id="Path-3" fill="#FFFFFF"></path></g></svg>',
                url: 'https://web.telegram.org/k/'
            },
            {
                name: 'X.com',
                region: '国际',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#1DA1F2" d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.594 1.85 2.323 3.196 4.368 3.233-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.072 1.328 4.532 2.104 7.172 2.104 8.607 0 13.3-7.132 13.3-13.3 0-.202-.005-.403-.014-.602.913-.66 1.706-1.477 2.332-2.41z"></path></svg>',
                url: 'https://abs.twimg.com/favicons/twitter.3.ico'
            },
            {
                name: 'YouTube',
                region: '国际',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.5 6.19a3 3 0 0 0-2.12-2.14c-1.87-.5-9.38-.5-9.38-.5s-7.5 0-9.38.5A3 3 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3 3 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.5 0 9.38-.5a3 3 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81M9.55 15.57V8.43L15.82 12z"></path></svg>',
                url: 'https://www.youtube.com/favicon.ico'
            }
        ];

        // 初始化主题
        function initializeTheme() {
            const saved = localStorage.getItem('theme');
            let theme = saved;

            // 如果第一次打开，按系统主题决定
            if (!saved) {
                theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }

            applyTheme(theme);
        }

        // 应用主题
        function applyTheme(theme) {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
                document.getElementById('themeToggle').title = '切换日间模式';
            } else {
                document.documentElement.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
                document.getElementById('themeToggle').title = '切换夜间模式';
            }
        }

        // 生成延迟卡片
        function generateLatencyCards() {
            const container = document.getElementById('latency-cards');
            if (!container) return;
            container.innerHTML = '';

            // 按地区排序：国内优先，然后国际
            const sortedSites = [...latencySites].sort((a, b) => {
                const aIsChina = a.region === '国内' ? 0 : 1;
                const bIsChina = b.region === '国内' ? 0 : 1;
                return aIsChina - bIsChina;
            });

            sortedSites.forEach(site => {
                const card = document.createElement('div');
                card.className = 'latency-card';
                const siteName = site.name.toLowerCase().replace(/\s+/g, '-');
                card.innerHTML = `
                    <div class="latency-card-header">
                        <div class="latency-card-info">
                            <div class="latency-card-icon-wrapper" data-site="${siteName}">
                                ${site.icon}
                            </div>
                            <div class="latency-card-text">
                                <span class="latency-card-name">${site.name}</span>
                                <span class="latency-card-region" data-region="${site.region}">${site.region}</span>
                            </div>
                        </div>
                        <div class="latency-status" id="latency-${siteName}">...<span class="unit">ms</span></div>
                    </div>
                    <div class="latency-graph-container">
                        <div class="graph-grid"></div>
                        <svg class="latency-ecg" viewBox="0 0 400 60" preserveAspectRatio="none">
                            <path class="ecg-path-bg" d="M0,30 L400,30"></path>
                            <path class="ecg-path" id="path-${siteName}" d="M0,30 L400,30"></path>
                            <circle class="ecg-cursor" id="cursor-${siteName}" r="3" cx="0" cy="30" style="display:none"></circle>
                        </svg>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // 测试延迟
        async function testLatency(site) {
            const start = Date.now();
            try {
                const response = await fetch(site.url + '?t=' + Date.now(), {
                    method: 'HEAD',
                    cache: 'no-cache',
                    mode: 'no-cors',
                    referrerPolicy: 'no-referrer'
                });
                const latency = Date.now() - start;
                return latency;
            } catch (error) {
                return -1; // 连接失败
            }
        }

        // 获取延迟颜色
        function getLatencyColor(latency) {
            if (latency === -1) return 'var(--destructive)';
            if (latency <= 49) return 'var(--latency-49)';
            if (latency <= 149) return 'var(--latency-149)';
            if (latency <= 299) return 'var(--latency-299)';
            if (latency <= 999) return 'var(--latency-999)';
            return 'var(--latency-1000)';
        }

        // 更新延迟显示
        function updateLatencyDisplay(siteName, latencies) {
            const valueElement = document.getElementById(`latency-${siteName}`);
            const pathElement = document.getElementById(`path-${siteName}`);
            const cursorElement = document.getElementById(`cursor-${siteName}`);

            if (!valueElement || !pathElement) return;

            // 计算平均延迟
            const lastLatency = latencies[latencies.length - 1];
            const validLatencies = latencies.filter(l => l !== -1);
            let avgLatency = -1;

            if (validLatencies.length > 0) {
                // 如果有足够的数据，去掉最高和最低延迟以获得更稳定的平均值
                if (validLatencies.length > 5) {
                    const sorted = [...validLatencies].sort((a, b) => a - b);
                    const trimmed = sorted.slice(1, -1);
                    avgLatency = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
                } else {
                    avgLatency = validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length;
                }
            }

            const targetValue = Math.round(avgLatency);

            // 更新文字显示
            if (validLatencies.length === 0) {
                if (lastLatency === -1) {
                    valueElement.innerHTML = 'TIMEOUT';
                    valueElement.style.color = 'var(--latency-999)';
                } else {
                    valueElement.innerHTML = '...<span class="unit">ms</span>';
                    valueElement.style.color = '#f6821f';
                }
            } else {
                const siteState = latencyUIState[siteName] || { current: targetValue, timer: null };
                latencyUIState[siteName] = siteState;

                // 设置颜色
                const avgColor = getLatencyColor(targetValue);
                valueElement.style.color = avgColor;

                // 如果数值变化较小，直接显示
                if (Math.abs(siteState.current - targetValue) < 2) {
                    siteState.current = targetValue;
                    valueElement.innerHTML = `${targetValue}<span class="unit">ms</span>`;
                } else {
                    // 清除旧的计时器
                    if (siteState.timer) clearInterval(siteState.timer);

                    // 每 30ms 更新一次数字，实现滚动的动态效果
                    const step = () => {
                        if (siteState.current < targetValue) {
                            siteState.current += Math.ceil((targetValue - siteState.current) / 5);
                        } else if (siteState.current > targetValue) {
                            siteState.current -= Math.ceil((siteState.current - targetValue) / 5);
                        }

                        valueElement.innerHTML = `${siteState.current}<span class="unit">ms</span>`;

                        if (siteState.current === targetValue) {
                            clearInterval(siteState.timer);
                            siteState.timer = null;
                        }
                    };

                    siteState.timer = setInterval(step, 30);
                }
            }

            // 更新 SVG 路径
            const width = 400;
            const height = 60;
            const padding = 10;
            const step = width / (latencyTestConfig.count - 1);

            let points = [];
            latencies.forEach((l, i) => {
                const x = i * step;
                let y;
                if (l === -1) {
                    y = height - 5;
                } else {
                    // 映射 0-500ms 到高度，高延迟在上，低延迟在下？通常ECG是越高表示值越大或者越快？
                    // demo里是 height - padding - (Math.min(l, 500) / 500 * (height - 2 * padding))
                    // 这意味着延迟越低，y越大（越靠下）。延迟越高，y越小（越靠上）。
                    y = height - padding - (Math.min(l, 500) / 800 * (height - 2 * padding));
                }
                points.push({ x, y });
            });

            if (points.length > 0) {
                // 生成平滑曲线路径 (Bezier)
                let d = `M${points[0].x},${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                    const x_mid = (points[i].x + points[i + 1].x) / 2;
                    const y_mid = (points[i].y + points[i + 1].y) / 2;
                    d += ` Q${points[i].x},${points[i].y} ${x_mid},${y_mid}`;
                }
                const lastPoint = points[points.length - 1];
                d += ` L${lastPoint.x},${lastPoint.y}`;

                pathElement.setAttribute('d', d);
                const avgColor = getLatencyColor(targetValue);
                pathElement.style.stroke = avgColor;

                // 更新光标位置
                if (cursorElement) {
                    cursorElement.style.display = 'block';
                    cursorElement.setAttribute('cx', lastPoint.x);
                    cursorElement.setAttribute('cy', lastPoint.y);
                    cursorElement.style.fill = avgColor;
                }
            }
        }

        // 开始延迟测试
        async function startLatencyTest() {
            if (latencyTestStarted) return;
            latencyTestStarted = true;

            generateLatencyCards();

            // 为每个网站维护最新的N个延迟数据
            const siteLatencies = {};
            latencySites.forEach(site => {
                const siteName = site.name.toLowerCase().replace(/\s+/g, '-');
                siteLatencies[siteName] = [];
            });

            // 初始采样测试
            const initialPromises = latencySites.map(async (site) => {
                const siteName = site.name.toLowerCase().replace(/\s+/g, '-');
                for (let i = 0; i < latencyTestConfig.count; i++) {
                    const latency = await testLatency(site);
                    siteLatencies[siteName].push(latency);
                    updateLatencyDisplay(siteName, siteLatencies[siteName]);
                    if (i < latencyTestConfig.count - 1) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
            });

            await Promise.all(initialPromises);

            // 之后每 3.09 秒测试一次，更新最新的数据 (保持 ECG 曲线流动)
            setInterval(async () => {
                const updatePromises = latencySites.map(async (site) => {
                    const siteName = site.name.toLowerCase().replace(/\s+/g, '-');
                    const latency = await testLatency(site);
                    // 添加新数据，保持只有N个
                    siteLatencies[siteName].push(latency);
                    if (siteLatencies[siteName].length > latencyTestConfig.count) {
                        siteLatencies[siteName].shift(); // 移除最旧的
                    }
                    updateLatencyDisplay(siteName, siteLatencies[siteName]);
                });
                await Promise.all(updatePromises);
            }, 618 * 3);
        }

        // 切换主题
        function toggleTheme() {
            const isDark = document.documentElement.classList.contains('dark-mode');
            applyTheme(isDark ? 'light' : 'dark');
        }

        // 返回顶部
        function scrollToTop() {
            const pageWrapper = document.querySelector('.page-wrapper');
            if (pageWrapper) {
                pageWrapper.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }

        // 初始化增强型文本编辑器
        function initLineEditor(textareaId) {
            const ta = document.getElementById(textareaId);
            if (!ta) return;
            const container = ta.closest('.line-editor');
            if (!container) return;
            const mirror = container.querySelector('.mirror');

            function escapeHtml(str) {
                return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }

            function render() {
                const value = ta.value || '';
                const lines = value.split(/\r\n|\r|\n/);

                mirror.style.width = ta.clientWidth + 'px';

                mirror.innerHTML = lines.map((l, i) => `<div class="logical-line" data-line-number="${i + 1}">${escapeHtml(l) || ' '}</div>`).join('');

                syncScroll();
            }

            function syncScroll() {
                mirror.scrollTop = ta.scrollTop;
            }

            let throttleTimeout;
            const debouncedRender = () => {
                cancelAnimationFrame(throttleTimeout);
                throttleTimeout = requestAnimationFrame(render);
            };

            // 监听输入、滚动
            ta.addEventListener('input', debouncedRender);
            ta.addEventListener('scroll', syncScroll);

            // 监听高度变化（ResizeObserver），解决拖拽角标后的同步问题
            if (window.ResizeObserver) {
                const ro = new ResizeObserver(() => {
                    // 当 textarea 高度或宽度变化时，重新渲染以确保宽度同步
                    render();
                });
                ro.observe(ta);
            }

            // 窗口缩放时也刷新一下
            window.addEventListener('resize', debouncedRender);

            // 暴露渲染函数
            ta._refreshLineEditor = render;

            // 初始渲染
            render();
        }

        async function loadConfig() {
            try {
                // 禁用 Rocket Loader 对该请求的影响
                const response = await fetch('/admin/config.json?_t=' + Date.now(), {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                if (!response.ok) throw new Error('加载配置失败');
                currentConfig = await response.json();
                originalConfig = JSON.parse(JSON.stringify(currentConfig));
                renderUI();
                // 设置网页标题
                document.title = `${currentConfig.优选订阅生成?.SUBNAME || '控制台'} 设置页面 - 管理后台`;
            } catch (error) {
                showToast('加载配置失败: ' + error.message, 'error');
            }
        }

        function renderUI() {
            // 标题
            document.getElementById('pageTitle').textContent = (currentConfig.优选订阅生成?.SUBNAME || '控制台') + ' 配置中心';

            // 检查 CF 使用情况并显示模块
            const cfUsageModule = document.getElementById('cfUsageModule');
            const cfUsage = currentConfig.CF?.Usage;
            if (cfUsage && cfUsage.success) {
                cfUsageModule.style.display = 'block';
                cfUsageModule.classList.remove('cf-usage-module');
                updateCFUsageDisplay(cfUsage);
                updateCloudflareButtonStates(true);
            } else {
                cfUsageModule.style.display = 'none';
                cfUsageModule.classList.add('cf-usage-module');
                updateCloudflareButtonStates(false);
            }

            // 检查 CF.UsageAPI 字段是否存在，向下兼容旧版本
            const usageapiOption = document.getElementById('usageapiOption');
            if (usageapiOption) {
                // 如果 CF.UsageAPI 字段不存在（旧版本），隐藏 UsageAPI 选项
                if (currentConfig.CF?.UsageAPI === undefined) {
                    usageapiOption.style.display = 'none';
                } else {
                    usageapiOption.style.display = '';
                }
            }

            // 订阅链接
            const token = currentConfig.优选订阅生成?.TOKEN;
            const host = window.location.host;
            const link = currentConfig.LINK;
            document.getElementById('LinkURL').value = currentConfig.LINK;
            document.getElementById('subLink').value = `https://${host}/sub?token=${token}`;
            document.getElementById('base64Link').value = `https://${host}/sub?token=${token}&b64`;
            document.getElementById('clashLink').value = `https://${host}/sub?token=${token}&clash`;
            document.getElementById('singboxLink').value = `https://${host}/sub?token=${token}&sb`;

            // 编辑订阅生成：固定为自定义订阅（手动维护IP）
            document.getElementById('ipMode').value = 'custom';
            loadCustomIPs();
            updateIPMode();

            // 详细配置
            document.getElementById('subName').value = currentConfig.优选订阅生成?.SUBNAME || '';

            // 检查 HOSTS 数组是否存在
            hasMultipleHosts = Array.isArray(currentConfig.HOSTS) && currentConfig.HOSTS.length > 0;

            const nodeHostInput = document.getElementById('nodeHost');
            if (hasMultipleHosts) {
                // 如果存在 HOSTS 数组，用逗号连接显示所有 host
                nodeHostInput.value = currentConfig.HOSTS.join('、');
                // 添加可点击样式和事件
                nodeHostInput.classList.add('nodeHost-clickable');
                nodeHostInput.title = '点击 可编辑多个节点域名';
                nodeHostInput.onclick = openHostsEditModal;
            } else {
                // 否则显示单个 HOST
                nodeHostInput.value = currentConfig.HOST || '';
                // 移除可点击样式和事件
                nodeHostInput.classList.remove('nodeHost-clickable');
                nodeHostInput.title = '节点域名';
                nodeHostInput.onclick = null;
            }

            document.getElementById('nodeUUID').value = currentConfig.UUID || '';
            document.getElementById('nodePATH').value = currentConfig.PATH || '';
            document.getElementById('protocol').value = currentConfig.协议类型 || 'vless';
            //document.getElementById('transport').value = currentConfig.传输协议 || 'ws';

            // 检查跳过证书验证字段是否存在
            const skipVerifyGroup = document.getElementById('skipVerifyGroup');
            if (currentConfig['跳过证书验证'] !== undefined) {
                skipVerifyGroup.style.setProperty('display', 'flex', 'important');
                document.getElementById('skipVerify').checked = currentConfig['跳过证书验证'] || false;
            } else {
                skipVerifyGroup.style.setProperty('display', 'none', 'important');
            }

            // 检查"完整节点路径"字段是否存在，判断PATH是否可编辑
            const nodePathInput = document.getElementById('nodePATH');
            if (currentConfig['完整节点路径'] !== undefined) {
                // 存在该字段，表示后端支持编辑PATH，移除readonly属性
                nodePathInput.removeAttribute('readonly');
                nodePathInput.title = '节点的伪装路径';
                nodePathInput.onchange = handlePathChange;
            } else {
                // 不存在该字段，PATH保持只读状态
                nodePathInput.setAttribute('readonly', '');
                nodePathInput.title = '节点的伪装路径 仅可通过 \'PATH\'环境变量 进行修改';
                nodePathInput.onchange = null;
            }

            // 检查Fingerprint字段是否存在
            const fingerprintGroup = document.getElementById('fingerprintGroup');
            const fingerprintSelect = document.getElementById('fingerprint');
            if (currentConfig['Fingerprint'] == undefined) {
                fingerprintGroup.style.setProperty('display', 'none', 'important');
            } else {
                fingerprintSelect.value = currentConfig['Fingerprint'] || 'chrome';
            }

            // 检查随机路径字段是否存在
            const randomPathGroup = document.getElementById('randomPathGroup');
            const randomPathCheckbox = document.getElementById('randomPath');
            if (currentConfig['随机路径'] !== undefined) {
                randomPathGroup.style.setProperty('display', 'flex', 'important');
                randomPathCheckbox.checked = currentConfig['随机路径'] || false;
            } else {
                randomPathGroup.style.setProperty('display', 'none', 'important');
            }

            // 检查启用0RTT字段是否存在
            const enable0RTTGroup = document.getElementById('enable0RTTGroup');
            const enable0RTTCheckbox = document.getElementById('enable0RTT');
            if (currentConfig['启用0RTT'] !== undefined) {
                enable0RTTGroup.style.setProperty('display', 'flex', 'important');
                enable0RTTCheckbox.checked = currentConfig['启用0RTT'] || false;
            } else {
                enable0RTTGroup.style.setProperty('display', 'none', 'important');
            }

            // 检查TLS分片字段是否存在
            const tlsFragmentGroup = document.getElementById('tlsFragmentGroup');
            const tlsFragmentHappGroup = document.getElementById('tlsFragmentHappGroup');
            const tlsFragmentShadowrocket = document.getElementById('tlsFragmentShadowrocket');
            const tlsFragmentHapp = document.getElementById('tlsFragmentHapp');
            if (currentConfig['TLS分片'] !== undefined) {
                tlsFragmentGroup.style.setProperty('display', 'flex', 'important');
                tlsFragmentHappGroup.style.setProperty('display', 'flex', 'important');
                // 根据当前值设置勾选状态
                tlsFragmentShadowrocket.checked = currentConfig['TLS分片'] === 'Shadowrocket';
                tlsFragmentHapp.checked = currentConfig['TLS分片'] === 'Happ';
            } else {
                tlsFragmentGroup.style.setProperty('display', 'none', 'important');
                tlsFragmentHappGroup.style.setProperty('display', 'none', 'important');
            }

            // 检查ECH字段是否存在
            const echModule = document.getElementById('echModule');
            const enableECHCheckbox = document.getElementById('enableECH');
            if (currentConfig['ECH'] !== undefined) {
                echModule.style.display = 'block';
                enableECHCheckbox.checked = currentConfig['ECH'] || false;
                // 根据Fingerprint值初始化ECH选项的禁用状态
                updateECHOptionState();

                // 填充ECH DNS下拉框
                populateEchDNSSelect();

                // 填充ECH SNI下拉框
                populateEchSNISelect();
            } else {
                echModule.style.display = 'none';
            }

            // 反代落地设置
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

            // 检查路径模板字段是否存在
            const pathTemplateConfigBtn = document.getElementById('pathTemplateConfigBtn');
            if (currentConfig.反代?.路径模板 !== undefined) {
                pathTemplateConfigBtn.style.display = '';
            } else {
                pathTemplateConfigBtn.style.display = 'none';
            }

            // 订阅转换配置
            document.getElementById('subAPI').value = ensureConvertConfigDefaults(currentConfig);
            document.getElementById('subConfig').value = currentConfig.订阅转换配置?.SUBCONFIG || '';
            document.getElementById('emoji').checked = currentConfig.订阅转换配置?.SUBEMOJI || false;

            // 消息通知设置（已移除该功能）

            modifiedSections.clear();
            resetAllButtons();

            // 从 localStorage 加载模块展开/折叠状态
            loadModuleStates();

            // 填充 SubConfig 下拉框（如果数据已加载，会自动设置选中值）
            populateSubConfigSelect();

            // 检查当前域名是否在 HOSTS 数组中
            checkHostsMismatch();
        }

        // CF 使用情况显示函数
        function updateCFUsageDisplay(cfUsage) {
            const workers = cfUsage.workers || 0;
            const pages = cfUsage.pages || 0;
            const total = cfUsage.total || 0;
            const dailyQuota = cfUsage.max || 100000;

            // 更新显示数值
            document.getElementById('cfWorkerCount').textContent = workers.toLocaleString();
            document.getElementById('cfPagesCount').textContent = pages.toLocaleString();
            document.getElementById('cfDailyQuota').textContent = dailyQuota.toLocaleString();
            document.getElementById('cfTotalDisplay').textContent = total.toLocaleString();

            // 计算百分比
            const percentage = ((total / dailyQuota) * 100).toFixed(2);

            // 计算比例并设置进度条宽度
            const workersRatio = (workers / dailyQuota) * 100;
            const pagesRatio = (pages / dailyQuota) * 100;

            // Workers 进度条：从左边开始
            const workerBarEl = document.getElementById('cfWorkerBar');
            workerBarEl.style.width = Math.min(workersRatio, 100) + '%';
            workerBarEl.textContent = '';

            // Pages 进度条：紧跟在 Workers 进度条后面
            const pagesBarEl = document.getElementById('cfPagesBar');
            pagesBarEl.style.width = Math.min(pagesRatio, 100 - workersRatio) + '%';
            pagesBarEl.style.left = Math.min(workersRatio, 100) + '%';
            pagesBarEl.textContent = '';

            // 总体百分比文字 (中央)
            const percentageCenterEl = document.getElementById('cfPercentageCenter');
            percentageCenterEl.textContent = `请求使用进度: ${total.toLocaleString()} (${percentage}%)`;
        }

        async function loadCustomIPs() {
            const textarea = document.getElementById('customIPs');
            textarea.disabled = true;
            textarea.value = '正在加载...';
            if (textarea._refreshLineEditor) textarea._refreshLineEditor();

            try {
                const response = await fetch('/admin/ADD.txt?_t=' + Date.now(), {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                if (response.ok) {
                    textarea.value = await response.text();
                } else {
                    textarea.value = '';
                }
            } catch (error) {
                showToast('加载自定义IP失败', 'error');
                textarea.value = '';
            } finally {
                textarea.disabled = false;
                if (textarea._refreshLineEditor) textarea._refreshLineEditor();
            }
        }

        function updateIPMode() {
            const ipModeEl = document.getElementById('ipMode');
            if (ipModeEl && ipModeEl.value !== 'custom') ipModeEl.value = 'custom';
            const mode = 'custom';

            const customSection = document.getElementById('customIPSection');
            if (customSection) {
                customSection.classList.remove('hidden-section');
                customSection.style.display = 'block';
            }

            // 当切换到自定义优选时，自动加载现有的ADD.txt内容
            if (mode === 'custom') {
                loadCustomIPs();
            }

            markModified('sub');
        }

        function updateProtocol() {
            const protocol = document.getElementById('protocol').value;
            /*
            const transport = document.getElementById('transport');
            if (protocol === 'trojan') {
                transport.value = 'ws';
                transport.disabled = true;
            } else {
                transport.disabled = false;
            }
            */
        }

        // 处理浏览器指纹变化，联动ECH选项
        function handleFingerprintChange() {
            updateECHOptionState();
        }

        // 处理ECH启用状态变化
        function handleECHEnableChange() {
            const enableECHCheckbox = document.getElementById('enableECH');
            const fingerprintSelect = document.getElementById('fingerprint');

            // 支持ECH的指纹类型
            const supportECH = ['chrome', 'firefox'];

            // 如果用户开启ECH，但当前指纹不支持ECH，自动切换到chrome
            if (enableECHCheckbox && enableECHCheckbox.checked) {
                const currentFingerprint = fingerprintSelect?.value;
                if (currentFingerprint && !supportECH.includes(currentFingerprint)) {
                    fingerprintSelect.value = 'chrome';
                    // 同时标记详细配置模块为已修改
                    markModified('config');
                }
            }

            markModified('ech');
        }

        // 更新ECH选项的状态（禁用/启用）
        function updateECHOptionState() {
            const fingerprint = document.getElementById('fingerprint').value;
            const enableECHCheckbox = document.getElementById('enableECH');

            // 支持ECH的指纹类型
            const supportECH = ['chrome', 'firefox'];

            if (enableECHCheckbox) {
                // 当指纹不支持ECH时，自动取消勾选
                if (!supportECH.includes(fingerprint) && enableECHCheckbox.checked) {
                    enableECHCheckbox.checked = false;
                    markModified('ech');
                }
            }
        }

        // 填充ECH DNS下拉框
        function populateEchDNSSelect() {
            const formGroup = document.getElementById('echDNSGroup');
            const select = document.getElementById('echDNSSelect');
            const customInput = document.getElementById('echDNSCustomInput');
            const hiddenValue = document.getElementById('echDNSValue');

            if (!select || !formGroup) return;

            // 检查ECHConfig.DNS字段是否存在
            if (currentConfig.ECHConfig?.DNS === undefined) {
                formGroup.style.display = 'none';
                return;
            }

            // 显示form-group和下拉框
            formGroup.style.display = 'grid';
            select.style.display = 'block';

            // 如果已有保存的DNS值，设置选中状态
            const savedDNS = currentConfig.ECHConfig?.DNS || '';
            if (savedDNS) {
                // 尝试在下拉框中找到匹配的选项
                select.value = savedDNS;

                // 如果没有匹配到（值不在列表中），选择"自定义"并显示输入框
                if (select.value !== savedDNS) {
                    select.value = 'custom';
                    customInput.value = savedDNS;
                    customInput.style.display = 'block';
                    hiddenValue.value = savedDNS;
                } else {
                    // 匹配成功，隐藏自定义输入框
                    customInput.style.display = 'none';
                    customInput.value = '';
                    hiddenValue.value = savedDNS;
                }
            } else {
                // 没有保存值，默认选择"自定义"
                select.value = 'custom';
                customInput.style.display = 'block';
            }
        }

        // 填充ECH SNI下拉框
        function populateEchSNISelect() {
            const formGroup = document.getElementById('echSNIGroup');
            const select = document.getElementById('echSNISelect');
            const customInput = document.getElementById('echSNICustomInput');
            const hiddenValue = document.getElementById('echSNIValue');

            if (!select || !formGroup) return;

            // 检查ECHConfig.SNI字段是否存在
            if (currentConfig.ECHConfig?.SNI === undefined) {
                formGroup.style.display = 'none';
                return;
            }

            // 显示form-group和下拉框
            formGroup.style.display = 'grid';
            select.style.display = 'block';

            // 如果已有保存的SNI值，设置选中状态
            const savedSNI = currentConfig.ECHConfig?.SNI;
            if (savedSNI !== undefined) {
                if (savedSNI === null) {
                    // 自动获取
                    select.value = '__AUTO__';
                    customInput.style.display = 'none';
                    customInput.value = '';
                    hiddenValue.value = null;
                } else {
                    // 尝试在下拉框中找到匹配的选项
                    select.value = savedSNI;

                    // 如果没有匹配到（值不在列表中），选择"自定义"并显示输入框
                    if (select.value !== savedSNI) {
                        select.value = 'custom';
                        customInput.value = savedSNI;
                        customInput.style.display = 'block';
                        hiddenValue.value = savedSNI;
                    } else {
                        // 匹配成功，隐藏自定义输入框
                        customInput.style.display = 'none';
                        customInput.value = '';
                        hiddenValue.value = savedSNI;
                    }
                }
            } else {
                // 没有保存值，默认选择"自定义"
                select.value = 'custom';
                customInput.style.display = 'block';
            }
        }

        // ECH DNS select 变化处理
        function onEchDNSSelectChange() {
            const select = document.getElementById('echDNSSelect');
            const customInput = document.getElementById('echDNSCustomInput');
            const hiddenValue = document.getElementById('echDNSValue');

            if (select.value === 'custom') {
                customInput.style.display = 'block';
                hiddenValue.value = customInput.value;
            } else {
                customInput.style.display = 'none';
                customInput.value = '';
                hiddenValue.value = select.value;
            }

            // 检查是否选择了国内DNS，若是则自动调整ECH解析域名
            const selectedOption = select.options[select.selectedIndex];
            const region = selectedOption.dataset.region;

            if (region === 'domestic') {
                const echSNISelect = document.getElementById('echSNISelect');
                // 如果当前选择是 __AUTO__，自动改为 cloudflare-ech.com
                if (echSNISelect.value === '__AUTO__') {
                    echSNISelect.value = 'cloudflare-ech.com';
                    onEchSNISelectChange();
                }
            }

            markModified('ech');
        }

        // ECH DNS 自定义输入框变化处理
        function onEchDNSCustomInput() {
            const customInput = document.getElementById('echDNSCustomInput');
            const hiddenValue = document.getElementById('echDNSValue');
            hiddenValue.value = customInput.value;
            markModified('ech');
        }

        // ECH SNI select 变化处理
        function onEchSNISelectChange() {
            const select = document.getElementById('echSNISelect');
            const customInput = document.getElementById('echSNICustomInput');
            const hiddenValue = document.getElementById('echSNIValue');

            if (select.value === '__AUTO__') {
                customInput.style.display = 'none';
                customInput.value = '';
                hiddenValue.value = null;

                // 检查当前DNS服务是否为国内DNS
                const echDNSSelect = document.getElementById('echDNSSelect');
                const selectedDNSOption = echDNSSelect.options[echDNSSelect.selectedIndex];
                const dnsRegion = selectedDNSOption.dataset.region;

                if (dnsRegion === 'domestic') {
                    alert('⚠️ ECH 配置提示\n\n默认使用节点HOST伪装域名 配合 国内 DNS 可能导致 ECH 解析失败。\n\n解决方案（任选其一）：\n① 将 ECH 解析域名改为 cloudflare-ech.com（推荐）\n② 将 ECH DNS 切换为国际服务（如 NextDNS）');
                    select.value = 'cloudflare-ech.com';
                }
            } else if (select.value === 'custom') {
                customInput.style.display = 'block';
                hiddenValue.value = customInput.value;
            } else {
                customInput.style.display = 'none';
                customInput.value = '';
                hiddenValue.value = select.value;
            }
            markModified('ech');
        }

        // ECH SNI 自定义输入框变化处理
        function onEchSNICustomInput() {
            const customInput = document.getElementById('echSNICustomInput');
            const hiddenValue = document.getElementById('echSNIValue');
            hiddenValue.value = customInput.value;
            markModified('ech');
        }

        // 处理PROXYIP地址
        function processProxyIP() {
            const input = document.getElementById('proxyIP').value.trim();

            if (input && input !== 'auto') {
                const cleanAddress = extractProxyIPAddress(input);
                document.getElementById('proxyIP').value = cleanAddress;
            }

            markModified('proxy');
        }

        // 提取PROXYIP地址中的纯格式（保留端口号）
        function extractProxyIPAddress(input) {
            input = input.trim();

            // 首先检查是否包含 "ip=" (包括 proxyip= 和 pyip=)
            const ipPatterns = ['proxyip=', 'pyip=', 'ip='];
            for (const pattern of ipPatterns) {
                const index = input.toLowerCase().indexOf(pattern);
                if (index !== -1) {
                    input = input.substring(index + pattern.length).trim();
                    break;
                }
            }

            // 移除协议前缀 (http:// 或 https://)
            if (input.toLowerCase().startsWith('http://')) {
                input = input.substring(7).trim();
            } else if (input.toLowerCase().startsWith('https://')) {
                input = input.substring(8).trim();
            }

            // 移除末尾的斜杠
            if (input.endsWith('/')) {
                input = input.substring(0, input.length - 1).trim();
            }

            // 移除末尾的备注（#符号之后的内容）
            if (input.includes('#')) {
                input = input.split('#')[0].trim();
            }

            return input;
        }

        // 处理SOCKS5和HTTP代理地址
        function processProxyAddress(type) {
            const fieldId = type === 'socks5' ? 'socks5Addr' : 'httpAddr';
            const input = document.getElementById(fieldId).value.trim();
            let cleanAddress = '';

            if (input) {
                cleanAddress = extractProxyAddress(input, type);
                document.getElementById(fieldId).value = cleanAddress;

                // 如果输入内容包含协议标识，自动切换反代模式并转移内容
                switchProxyModeByProtocol(input, cleanAddress);
            }

            markModified('proxy');
        }

        // 提取代理地址中的纯格式
        function extractProxyAddress(input, type) {
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

        // 根据协议自动切换反代模式
        function switchProxyModeByProtocol(input, cleanAddress) {
            const lowerInput = input.toLowerCase();

            // 检查是否包含socks5协议
            if (lowerInput.includes('socks5://') || lowerInput.includes('socks5=') || lowerInput.startsWith('/socks')) {
                // 切换到SOCKS5模式
                document.getElementById('proxyMode').value = 'socks5';

                // 清空其他模式的内容，填充SOCKS5
                document.getElementById('proxyIP').value = '';
                document.getElementById('socks5Addr').value = cleanAddress;
                document.getElementById('httpAddr').value = '';

                updateProxyMode();
                return;
            }

            // 检查是否包含http协议
            if (lowerInput.includes('http://') || lowerInput.includes('http=') || lowerInput.includes('https://') || lowerInput.startsWith('/http')) {
                // 切换到HTTP模式
                document.getElementById('proxyMode').value = 'http';

                // 清空其他模式的内容，填充HTTP
                document.getElementById('proxyIP').value = '';
                document.getElementById('socks5Addr').value = '';
                document.getElementById('httpAddr').value = cleanAddress;

                updateProxyMode();
                return;
            }
        }

        function updateProxyMode() {
            const mode = document.getElementById('proxyMode').value;
            document.getElementById('proxyIPSection').style.display = mode === 'auto' ? 'block' : 'none';
            document.getElementById('socks5Section').style.display = mode === 'socks5' ? 'block' : 'none';
            document.getElementById('httpSection').style.display = mode === 'http' ? 'block' : 'none';

            // 根据选择的模式填充对应的数据
            if (mode === 'auto') {
                document.getElementById('proxyIP').value = currentConfig.反代?.PROXYIP || '';
                document.getElementById('autoProxy').checked = (currentConfig.反代?.PROXYIP === 'auto');
                if (currentConfig.反代?.PROXYIP === 'auto') {
                    document.getElementById('proxyIP').disabled = true;
                } else {
                    document.getElementById('proxyIP').disabled = false;
                }
            } else if (mode === 'socks5') {
                document.getElementById('socks5Addr').value = currentConfig.反代?.SOCKS5?.账号 || '';
                document.getElementById('globalSocks5').checked = currentConfig.反代?.SOCKS5?.全局 || false;
            } else if (mode === 'http') {
                document.getElementById('httpAddr').value = currentConfig.反代?.SOCKS5?.账号 || '';
                document.getElementById('globalHTTP').checked = currentConfig.反代?.SOCKS5?.全局 || false;
            }

            // 更新 "获取更多PROXYIP" 按钮的显示状态
            const getMoreBtn = document.getElementById('getMoreProxyIPBtn');
            if (getMoreBtn) {
                getMoreBtn.style.display = mode === 'auto' ? 'inline-block' : 'none';
            }

            // 更新 "探索更多SOCKS5" 按钮的显示状态
            const exploreSocks5Btn = document.getElementById('exploreSocks5Btn');
            if (exploreSocks5Btn) {
                exploreSocks5Btn.style.display = mode === 'socks5' ? 'inline-block' : 'none';
            }

            // 更新 "探索更多HTTP" 按钮的显示状态
            const exploreHTTPBtn = document.getElementById('exploreHTTPBtn');
            if (exploreHTTPBtn) {
                exploreHTTPBtn.style.display = mode === 'http' ? 'inline-block' : 'none';
            }

            markModified('proxy');
        }

        function toggleAutoProxy() {
            const autoProxy = document.getElementById('autoProxy').checked;
            document.getElementById('proxyIP').disabled = autoProxy;
            markModified('proxy');
        }

        function toggleModule(titleEl) {
            const module = titleEl.parentElement;
            const content = module.querySelector('.module-content');

            // If there's no collapsible content, just toggle the class
            if (!content) {
                module.classList.toggle('collapsed');
                saveModuleStates();
                return;
            }

            // If a transition is currently attached, remove it to avoid duplicate handlers
            if (content._transitionHandler) {
                content.removeEventListener('transitionend', content._transitionHandler);
                content._transitionHandler = null;
            }

            const isCollapsed = module.classList.contains('collapsed');

            if (isCollapsed) {
                // Expand
                content.style.display = 'block';

                // Measure height
                const height = content.scrollHeight;
                // Start from 0
                content.style.maxHeight = '0px';
                content.style.opacity = '0';
                // Force reflow
                content.getBoundingClientRect();
                // Animate to measured height
                content.style.maxHeight = height + 'px';
                content.style.opacity = '1';

                const onEnd = function (e) {
                    if (e.propertyName === 'max-height') {
                        // Clear fixed max-height so content can grow/shrink naturally
                        content.style.maxHeight = '';
                        content.removeEventListener('transitionend', onEnd);
                        content._transitionHandler = null;
                    }
                };
                content._transitionHandler = onEnd;
                content.addEventListener('transitionend', onEnd);

                module.classList.remove('collapsed');
            } else {
                // Collapse
                const height = content.scrollHeight;
                // Ensure starting height is set
                content.style.maxHeight = height + 'px';
                content.style.opacity = '1';
                // Force reflow
                content.getBoundingClientRect();
                // Animate to 0
                content.style.maxHeight = '0px';
                content.style.opacity = '0';

                const onEnd = function (e) {
                    if (e.propertyName === 'max-height') {
                        // Hide after collapsing to remove from tab order
                        content.style.display = 'none';
                        content.removeEventListener('transitionend', onEnd);
                        content._transitionHandler = null;
                    }
                };
                content._transitionHandler = onEnd;
                content.addEventListener('transitionend', onEnd);

                module.classList.add('collapsed');
            }

            // 保存模块状态到 localStorage
            saveModuleStates();
        }

        // 规范化PATH字段
        function normalizePath(path) {
            // 如果为空，返回原值
            if (!path) return path;

            // 移除 '#' 及其之后的所有内容（注释）
            let normalizedPath = path.split('#')[0];

            // 去除首尾空格
            normalizedPath = normalizedPath.trim();

            // 如果第一个字符不是 '/'，则添加 '/'
            if (normalizedPath && !normalizedPath.startsWith('/')) {
                normalizedPath = '/' + normalizedPath;
            }

            return normalizedPath;
        }

        // 处理PATH输入完成后的规范化
        function handlePathChange() {
            const nodePathInput = document.getElementById('nodePATH');
            const originalValue = nodePathInput.value;
            const normalizedValue = normalizePath(originalValue);

            // 如果规范化后的值与原值不同，更新输入框
            if (normalizedValue !== originalValue) {
                nodePathInput.value = normalizedValue;
            }

            // 标记为已修改
            markModified('config');
        }

        function markModified(section) {
            modifiedSections.add(section);

            // 特殊处理 notification 部分：更新 TG.启用 状态
            if (section === 'notification') {
                const telegramCheckbox = document.getElementById('telegramEnabled');
                if (!currentConfig.TG) currentConfig.TG = {};
                currentConfig.TG.启用 = telegramCheckbox.checked;
            }

            updateButtonStates();
        }

        function updateButtonStates() {
            // 辅助函数，安全设置disabled属性
            const setDisabled = (id, disabled) => {
                const el = document.getElementById(id);
                if (el) el.disabled = disabled;
            };

            // 订阅生成模块
            const subModified = modifiedSections.has('sub');
            setDisabled('saveSubBtn', !subModified);
            setDisabled('cancelSubBtn', !subModified);

            // 配置信息模块
            const configModified = modifiedSections.has('config');
            setDisabled('saveConfigBtn', !configModified);
            setDisabled('cancelConfigBtn', !configModified);

            // ECH设置模块
            const echModified = modifiedSections.has('ech');
            setDisabled('saveEchBtn', !echModified);
            setDisabled('cancelEchBtn', !echModified);

            // 反代设置模块
            const proxyModified = modifiedSections.has('proxy');
            setDisabled('saveProxyBtn', !proxyModified);
            setDisabled('cancelProxyBtn', !proxyModified);

            // 订阅转换模块
            const convertModified = modifiedSections.has('convert');
            setDisabled('saveConvertBtn', !convertModified);
            setDisabled('cancelConvertBtn', !convertModified);

            // 通知设置模块
            const notificationModified = modifiedSections.has('notification');
            setDisabled('saveNotificationBtn', !notificationModified);
            setDisabled('cancelNotificationBtn', !notificationModified);
        }

        function resetAllButtons() {
            document.querySelectorAll('[id^="save"]').forEach(btn => { if(btn) btn.disabled = true; });
            document.querySelectorAll('[id^="cancel"]').forEach(btn => { if(btn) btn.disabled = true; });
        }

        function copySubscription(elementId) {
            const element = document.getElementById(elementId);
            navigator.clipboard.writeText(element.value).then(() => {
                showToast('已复制到剪贴板', 'success');
            }).catch(() => {
                showToast('复制失败', 'error');
            });
        }

        function handleTLSFragmentChange(type) {
            const shadowrocket = document.getElementById('tlsFragmentShadowrocket');
            const happ = document.getElementById('tlsFragmentHapp');

            if (type === 'Shadowrocket') {
                if (shadowrocket.checked) {
                    happ.checked = false;
                }
            } else if (type === 'Happ') {
                if (happ.checked) {
                    shadowrocket.checked = false;
                }
            }
        }

        function showQRCode(elementId) {
            const text = document.getElementById(elementId).value;
            const container = document.getElementById('qrcodeContainer');
            container.innerHTML = '';

            // 如果文本过长，使用较低的纠错等级来支持更长的内容
            let correctLevel = QRCode.CorrectLevel.H;
            if (text.length > 1500) {
                correctLevel = QRCode.CorrectLevel.M;
            }
            if (text.length > 2500) {
                correctLevel = QRCode.CorrectLevel.L;
            }

            try {
                new QRCode(container, {
                    text: text,
                    width: 300,
                    height: 300,
                    colorDark: '#000',
                    colorLight: '#fff',
                    correctLevel: correctLevel
                });
                document.getElementById('qrcodeModal').classList.add('show');
            } catch (error) {
                // 如果文本过长，显示错误提示
                console.error('二维码生成失败:', error);
                showToast('链接过长，无法生成二维码。联系项目作者修复问题。', 'error');
                container.innerHTML = '<div style="padding:20px;text-align:center;color:#f44336;">二维码生成失败：内容过长</div>';
            }
        }

        function closeQRCode(event) {
            if (!event || event.target.id === 'qrcodeModal') {
                document.getElementById('qrcodeModal').classList.remove('show');
            }
        }

        function handleSkipVerifyChange(event) {
            if (event.target.checked) {
                // 显示警告弹窗
                event.target.checked = false; // 先取消勾选
                document.getElementById('skipVerifyWarningModal').classList.add('show');
            } else {
                markModified('config');
            }
        }

        function closeSkipVerifyWarning(event) {
            if (!event || event.target.id === 'skipVerifyWarningModal') {
                document.getElementById('skipVerifyWarningModal').classList.remove('show');
            }
        }

        function confirmSkipVerify() {
            document.getElementById('skipVerify').checked = true;
            markModified('config');
            closeSkipVerifyWarning();
        }

        // HOSTS 编辑模态框相关函数
        function openHostsEditModal(event) {
            if (event) event.stopPropagation();
            const modal = document.getElementById('hostsEditModal');
            const textarea = document.getElementById('hostsEditTextarea');

            // 将 HOSTS 数组内容填入文本框，每行一个
            if (currentConfig.HOSTS && Array.isArray(currentConfig.HOSTS)) {
                textarea.value = currentConfig.HOSTS.join('\n');
            } else {
                textarea.value = '';
            }

            modal.classList.add('show');
            textarea.focus();
        }

        function closeHostsEditModal(event) {
            if (event && event.target !== event.currentTarget) return;
            const modal = document.getElementById('hostsEditModal');
            modal.classList.remove('show');
        }

        function confirmHostsEdit() {
            const textarea = document.getElementById('hostsEditTextarea');
            const nodeHostInput = document.getElementById('nodeHost');

            // 将文本框内容按 逗号、中文逗号 和 换行 分割成数组
            const text = textarea.value;
            // 使用正则表达式，将 , 、， 和 \n 都作为分隔符
            const items = text.split(/[ ,，。\n]+/)
                .map(item => cleanHostDomain(item.trim()))
                .filter(item => item.length > 0);

            if (items.length === 0) {
                showToast('请至少输入一个域名', 'error');
                return;
            }

            // 更新 currentConfig.HOSTS 数组
            currentConfig.HOSTS = items;

            // 更新输入框显示（用逗号连接）
            nodeHostInput.value = items.join('、');

            // 关闭模态框
            closeHostsEditModal();

            // 标记配置已修改
            markModified('config');

            showToast('域名列表已更新，请保存配置', 'success');
        }

        // 清理域名格式：去掉协议、路径、端口号，只保留纯域名
        function cleanHostDomain(input) {
            if (!input) return '';

            let domain = input;

            // 去掉协议前缀 (http:// 或 https://)
            domain = domain.replace(/^https?:\/\//i, '');

            // 去掉路径部分（第一个 / 及之后的内容）
            const slashIndex = domain.indexOf('/');
            if (slashIndex !== -1) {
                domain = domain.substring(0, slashIndex);
            }

            // 去掉端口号（: 及之后的数字）
            domain = domain.replace(/:\d+$/, '');

            return domain.trim();
        }

        async function saveSub() {
            const customIPs = document.getElementById('customIPs').value.trim();
            if (!customIPs) {
                showToast('自定义优选地址不能为空', 'error');
                return;
            }
            const subConfig = ensureSubGeneratorDefaults(currentConfig);

            const updates = {
                local: true,
                本地IP库: {
                    ...currentConfig.优选订阅生成?.本地IP库,
                    随机IP: false
                },
                SUB: null,
                SUBNAME: subConfig.SUBNAME,
                SUBUpdateTime: subConfig.SUBUpdateTime,
                TOKEN: subConfig.TOKEN
            };

            currentConfig.优选订阅生成 = { ...currentConfig.优选订阅生成, ...updates };

            try {
                await fetch('/admin/ADD.txt', { method: 'POST', body: customIPs });
            } catch (error) {
                showToast('保存自定义IP失败', 'error');
                return;
            }

            await saveConfigToServer('sub');
        }

        async function saveConfig() {
            const subConfig = ensureSubGeneratorDefaults(currentConfig);
            subConfig.SUBNAME = document.getElementById('subName').value;
            currentConfig.协议类型 = document.getElementById('protocol').value;
            //currentConfig.传输协议 = currentConfig.协议类型 === 'trojan' ? 'ws' : document.getElementById('transport').value;
            currentConfig.跳过证书验证 = document.getElementById('skipVerify').checked;

            // 保存PATH（如果"完整节点路径"字段存在，表示后端支持编辑PATH）
            if (currentConfig['完整节点路径'] !== undefined) {
                currentConfig.PATH = document.getElementById('nodePATH').value;
            }

            // 保存Fingerprint（如果字段存在）
            if (currentConfig['Fingerprint'] !== undefined) {
                currentConfig['Fingerprint'] = document.getElementById('fingerprint').value;
            }

            // 保存随机路径（如果字段存在）
            if (currentConfig['随机路径'] !== undefined) {
                currentConfig['随机路径'] = document.getElementById('randomPath').checked;
            }

            // 保存启用0RTT（如果字段存在）
            if (currentConfig['启用0RTT'] !== undefined) {
                currentConfig['启用0RTT'] = document.getElementById('enable0RTT').checked;
            }

            // 保存TLS分片（如果字段存在）
            if (currentConfig['TLS分片'] !== undefined) {
                const shadowrocket = document.getElementById('tlsFragmentShadowrocket').checked;
                const happ = document.getElementById('tlsFragmentHapp').checked;

                if (shadowrocket) {
                    currentConfig['TLS分片'] = 'Shadowrocket';
                } else if (happ) {
                    currentConfig['TLS分片'] = 'Happ';
                } else {
                    currentConfig['TLS分片'] = null;
                }
            }

            await saveConfigToServer('config');
            // 更新网页标题
            document.title = `${currentConfig.优选订阅生成?.SUBNAME || '控制台'}设置页面 - 管理后台`;
        }

        async function saveEch() {
            // 保存ECH（如果字段存在）
            if (currentConfig['ECH'] !== undefined) {
                currentConfig['ECH'] = document.getElementById('enableECH').checked;

                // 保存ECHConfig.DNS（如果存在）
                if (currentConfig.ECHConfig?.DNS !== undefined) {
                    const dnsValue = document.getElementById('echDNSValue').value;
                    if (dnsValue) {
                        currentConfig.ECHConfig.DNS = dnsValue;
                    }
                }

                // 保存ECHConfig.SNI（如果存在）
                if (currentConfig.ECHConfig?.SNI !== undefined) {
                    const sniValue = document.getElementById('echSNIValue').value;
                    currentConfig.ECHConfig.SNI = sniValue === '' ? null : sniValue;
                }
            }

            await saveConfigToServer('ech');
        }

        async function saveProxy() {
            const mode = document.getElementById('proxyMode').value;
            let socksEnabled = null;
            let socksAccount = '';
            let globalProxy = false;
            let proxyIP = currentConfig.反代.PROXYIP;

            // 检查文本框内容是否为空
            if (mode === 'auto') {
                socksEnabled = null;
                const autoProxy = document.getElementById('autoProxy').checked;
                proxyIP = autoProxy ? 'auto' : document.getElementById('proxyIP').value.trim();

                if (!autoProxy && !proxyIP) {
                    showToast('PROXYIP地址不能为空', 'error');
                    return;
                }
            } else if (mode === 'socks5') {
                socksEnabled = 'socks5';
                socksAccount = document.getElementById('socks5Addr').value.trim();
                globalProxy = document.getElementById('globalSocks5').checked;

                if (!socksAccount) {
                    showToast('SOCKS5地址不能为空', 'error');
                    return;
                }
            } else if (mode === 'http') {
                socksEnabled = 'http';
                socksAccount = document.getElementById('httpAddr').value.trim();
                globalProxy = document.getElementById('globalHTTP').checked;

                if (!socksAccount) {
                    showToast('HTTP地址不能为空', 'error');
                    return;
                }
            }

            currentConfig.反代 = {
                PROXYIP: proxyIP,
                SOCKS5: {
                    启用: socksEnabled,
                    全局: globalProxy,
                    账号: socksAccount,
                    白名单: currentConfig.反代.SOCKS5.白名单
                }
            };

            await saveConfigToServer('proxy');
        }

        // 加载SubConfig JSON数据
        async function loadSubConfigData() {
            try {
                const url = 'https://raw.githubusercontent.com/cmliu/cmliu/main/SUBCONFIG.json';
                const text = await fetchWithAutoMirror(url, 'SubConfig');
                subConfigData = JSON.parse(text);
                populateSubConfigSelect();
                console.log('[订阅转换配置列表] SUBCONFIG 数据加载成功');
            } catch (error) {
                console.error('Error loading SubConfig:', error);
                // 加载失败时，仍然显示下拉框（只有自定义选项）
                subConfigData = null;
                populateSubConfigSelect();
            }
        }

        // 填充SubConfig下拉框
        function populateSubConfigSelect() {
            const select = document.getElementById('subConfigSelect');
            const customInput = document.getElementById('subConfigCustomInput');
            if (!select) return; // 元素还不存在，等待后续调用

            // 始终添加"自定义"选项作为第一项
            select.innerHTML = '<option value="custom">&nbsp;&nbsp;&nbsp;&nbsp;自定义</option>';

            // 如果有数据，添加分组选项
            if (subConfigData && Array.isArray(subConfigData)) {
                subConfigData.forEach(group => {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = group.label;

                    if (group.options && Array.isArray(group.options)) {
                        group.options.forEach(option => {
                            const opt = document.createElement('option');
                            opt.value = option.value;
                            opt.textContent = option.label;
                            optgroup.appendChild(opt);
                        });
                    }

                    select.appendChild(optgroup);
                });
            }

            // 显示下拉框
            select.style.display = 'block';

            // 如果已有保存的配置值，设置选中状态
            const savedSubConfig = currentConfig.订阅转换配置?.SUBCONFIG || '';
            if (savedSubConfig) {
                // 尝试在下拉框中找到匹配的选项
                select.value = savedSubConfig;

                // 如果没有匹配到（值不在列表中），选择"自定义"并显示输入框
                if (select.value !== savedSubConfig) {
                    select.value = 'custom';
                    customInput.value = savedSubConfig;
                    customInput.style.display = 'block';
                    document.getElementById('subConfig').value = savedSubConfig;
                } else {
                    // 匹配成功，隐藏自定义输入框
                    customInput.style.display = 'none';
                    customInput.value = '';
                    document.getElementById('subConfig').value = savedSubConfig;
                }
            } else {
                // 没有保存值，默认选择"自定义"
                select.value = 'custom';
                customInput.style.display = 'block';
            }

            // 设置change事件监听
            select.onchange = function () {
                if (this.value === 'custom') {
                    // 选择自定义，显示输入框
                    customInput.style.display = 'block';
                    document.getElementById('subConfig').value = customInput.value;
                } else {
                    // 选择预设值，隐藏输入框并更新值
                    customInput.style.display = 'none';
                    customInput.value = '';
                    document.getElementById('subConfig').value = this.value;
                }
                markModified('convert');
            };
        }

        // 自定义输入框变化时的处理
        function onSubConfigCustomInput() {
            const customInput = document.getElementById('subConfigCustomInput');
            document.getElementById('subConfig').value = customInput.value;
            markModified('convert');
        }

        async function saveConvert() {
            currentConfig.订阅转换配置 = {
                SUBAPI: document.getElementById('subAPI').value,
                SUBCONFIG: document.getElementById('subConfig').value,
                SUBEMOJI: document.getElementById('emoji').checked
            };

            await saveConfigToServer('convert');
        }

        async function ensureRequiredConfigFields() {
            if (currentConfig.UUID && currentConfig.HOST) return;

            const response = await fetch('/admin/config.json', {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (!response.ok) return;
            const serverConfig = await response.json();
            currentConfig = {
                ...serverConfig,
                ...currentConfig,
                订阅转换配置: {
                    ...(serverConfig.订阅转换配置 || {}),
                    ...(currentConfig.订阅转换配置 || {})
                }
            };
        }

        async function saveConfigToServer(section) {
            try {
                await ensureRequiredConfigFields();
                if (!currentConfig.UUID || !currentConfig.HOST) {
                    throw new Error('配置缺少 HOST 或 UUID');
                }

                const response = await fetch('/admin/config.json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    },
                    body: JSON.stringify(currentConfig)
                });

                if (!response.ok) {
                    let errorMessage = '保存失败';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    } catch (_) { }
                    throw new Error(errorMessage);
                }
                showToast('✅ 配置已保存，请更新订阅，才能获取最新节点内容！', 'success');
                modifiedSections.delete(section);
                updateButtonStates();
            } catch (error) {
                showToast('😢 ' + error.message, 'error');
            }
        }

        function cancelEdit(section) {
            currentConfig = JSON.parse(JSON.stringify(originalConfig));

            // 只重置该模块的值，不调用 renderUI 以保持展开状态
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

                // 处理PATH字段的只读状态
                const nodePathInput = document.getElementById('nodePATH');
                if (currentConfig['完整节点路径'] !== undefined) {
                    nodePathInput.removeAttribute('readonly');
                    nodePathInput.title = '节点的伪装路径';
                    nodePathInput.onchange = handlePathChange;
                } else {
                    nodePathInput.setAttribute('readonly', '');
                    nodePathInput.title = '节点的伪装路径 仅可通过 \'PATH\'环境变量 进行修改';
                    nodePathInput.onchange = null;
                }

                // 重置随机路径（如果字段存在）
                if (currentConfig['随机路径'] !== undefined) {
                    document.getElementById('randomPath').checked = currentConfig['随机路径'] || false;
                }

                // 重置启用0RTT（如果字段存在）
                if (currentConfig['启用0RTT'] !== undefined) {
                    document.getElementById('enable0RTT').checked = currentConfig['启用0RTT'] || false;
                }

                // 重置TLS分片（如果字段存在）
                if (currentConfig['TLS分片'] !== undefined) {
                    document.getElementById('tlsFragmentShadowrocket').checked = currentConfig['TLS分片'] === 'Shadowrocket';
                    document.getElementById('tlsFragmentHapp').checked = currentConfig['TLS分片'] === 'Happ';
                }

                // 重置ECH（如果字段存在）
                if (currentConfig['ECH'] !== undefined) {
                    document.getElementById('enableECH').checked = currentConfig['ECH'] || false;

                    // 重置ECHConfig的下拉框
                    populateEchDNSSelect();
                    populateEchSNISelect();
                }

                updateProtocol();
            } else if (section === 'ech') {
                // 重置ECH设置
                if (currentConfig['ECH'] !== undefined) {
                    document.getElementById('enableECH').checked = currentConfig['ECH'] || false;

                    // 重置ECHConfig的下拉框
                    populateEchDNSSelect();
                    populateEchSNISelect();
                }
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
                document.getElementById('subAPI').value = ensureConvertConfigDefaults(currentConfig);
                document.getElementById('subConfig').value = currentConfig.订阅转换配置?.SUBCONFIG || '';
                document.getElementById('emoji').checked = currentConfig.订阅转换配置?.SUBEMOJI || false;
                // 重新填充下拉框以恢复正确的选中状态
                populateSubConfigSelect();
            }

            modifiedSections.delete(section);
            updateButtonStates();
        }

        // 保存模块展开/折叠状态到 localStorage
        function saveModuleStates() {
            const states = {};
            document.querySelectorAll('.module').forEach((module, index) => {
                const title = module.querySelector('.module-title')?.textContent?.trim() || ('module-' + index);
                // 不保存"查看操作日志"模块的状态
                if (title !== '📋 查看操作日志') {
                    states[title] = !module.classList.contains('collapsed');
                }
            });
            localStorage.setItem('adminModuleStates', JSON.stringify(states));
        }

        // 从 localStorage 加载模块展开/折叠状态
        function loadModuleStates() {
            const savedStates = localStorage.getItem('adminModuleStates');
            const states = savedStates ? JSON.parse(savedStates) : {};

            // 如果是第一次访问（localStorage中没有保存状态），所有模块默认折叠
            const isFirstVisit = !savedStates;

            document.querySelectorAll('.module').forEach((module, index) => {
                const title = module.querySelector('.module-title')?.textContent?.trim() || ('module-' + index);
                let shouldBeExpanded;

                // "查看操作日志"模块始终保持折叠状态
                if (title === '📋 查看操作日志') {
                    shouldBeExpanded = false;
                } else {
                    shouldBeExpanded = isFirstVisit ? false : (states[title] !== false); // 第一次默认折叠，之后按保存的状态
                }

                const isCurrentlyCollapsed = module.classList.contains('collapsed');
                const content = module.querySelector('.module-content');

                if (shouldBeExpanded && isCurrentlyCollapsed) {
                    // 需要展开
                    module.classList.remove('collapsed');
                    if (content) {
                        content.style.display = 'block';
                        content.style.maxHeight = '';
                        content.style.opacity = '1';
                    }
                } else if (!shouldBeExpanded && !isCurrentlyCollapsed) {
                    // 需要折叠
                    module.classList.add('collapsed');
                    if (content) {
                        content.style.display = 'none';
                        content.style.maxHeight = '0px';
                        content.style.opacity = '0';
                    }
                }
            });
        }

        async function refreshConfig() {
            await loadConfig();
            const loadTime = currentConfig.加载时间 || '未知';
            showToast(`配置已刷新 (加载时间: ${loadTime})`, 'success');
        }

        function resetConfigWithConfirm() {
            document.getElementById('resetModal').classList.add('show');
        }

        function closeResetModal(event) {
            if (event && event.target.id !== 'resetModal') return;
            document.getElementById('resetModal').classList.remove('show');
        }

        async function confirmReset() {
            try {
                const response = await fetch('/admin/init');
                if (!response.ok) throw new Error('重置失败');

                closeResetModal();
                showToast('配置已重置为默认值', 'success');

                // 延迟1秒后刷新页面，让用户看到成功提示
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } catch (error) {
                showToast('重置失败: ' + error.message, 'error');
            }
        }

        function logout() {
            window.location.href = '/logout';
        }

        // 切换用户模式（小白模式 / 高手模式）
        function toggleUserMode() {
            const cardContainer = document.querySelector('.card-container');
            const btn = document.getElementById('modeToggleBtn');

            if (cardContainer.classList.contains('simple-mode')) {
                // 切换到高手模式
                cardContainer.classList.remove('simple-mode');
                btn.textContent = '🐣 我是小白！我想简单点！';
                localStorage.setItem('userMode', 'expert');
                showToast('🚀 已切换到高手模式，显示所有功能', 'success');
            } else {
                // 切换到小白模式
                cardContainer.classList.add('simple-mode');
                btn.textContent = '🚀 我是高手！我就要折腾！';
                localStorage.setItem('userMode', 'simple');
                showToast('🐣 已切换到小白模式，只显示常用功能', 'success');
            }

            // 使用 requestAnimationFrame 确保动画流畅
            requestAnimationFrame(() => {
                void cardContainer.offsetHeight;
            });
        }

        // 初始化用户模式
        function initUserMode() {
            const userMode = localStorage.getItem('userMode') || 'simple'; // 默认为小白模式
            const cardContainer = document.querySelector('.card-container');
            const btn = document.getElementById('modeToggleBtn');

            if (userMode === 'simple') {
                cardContainer.classList.add('simple-mode');
                btn.textContent = '🚀 我是高手！我就要折腾！';
            } else {
                cardContainer.classList.remove('simple-mode');
                btn.textContent = '🐣 我是小白！我想简单点！';
            }
        }

        function showToast(message, type = 'info') {
            // 移除现有的toast
            const existingToast = document.querySelector('.toast');
            if (existingToast) {
                existingToast.remove();
            }

            // 创建新的toast
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);

            // 显示动画
            setTimeout(() => toast.classList.add('show'), 10);

            // 自动隐藏
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // 日志类型翻译
        const LOG_SENSITIVE_QUERY_KEYS = new Set([
            'token', 'key', 'apikey', 'api_key', 'access_token', 'refresh_token',
            'password', 'passwd', 'pwd', 'secret', 'auth', 'authorization',
            'session', 'sid', 'cookie', 'code', 'email'
        ]);

        function escapeLogHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function maskMiddle(value, prefix = 2, suffix = 2) {
            const text = String(value ?? '');
            if (!text) return text;
            if (text.length <= prefix + suffix) return '*'.repeat(Math.max(text.length, 1));
            return `${text.slice(0, prefix)}${'*'.repeat(text.length - prefix - suffix)}${text.slice(-suffix)}`;
        }

        function desensitizeIP(ip) {
            const text = String(ip ?? '').trim();
            if (!text || text === '未知') return '未知';

            if (text.includes('.')) {
                const parts = text.split('.');
                if (parts.length === 4 && parts.every(p => /^\d+$/.test(p))) {
                    return `${parts[0]}.${parts[1]}.*.*`;
                }
            }

            if (text.includes(':')) {
                const parts = text.split(':').filter(Boolean);
                if (parts.length >= 3) {
                    return `${parts[0]}:${parts[1]}:****:****`;
                }
            }

            return maskMiddle(text, 3, 2);
        }

        function desensitizeURL(rawUrl) {
            const text = String(rawUrl ?? '').trim();
            if (!text || text === '无') return '无';

            try {
                const parsed = new URL(text);

                if (parsed.username) parsed.username = maskMiddle(parsed.username, 1, 0);
                if (parsed.password) parsed.password = '***';

                const params = parsed.searchParams;
                for (const key of [...params.keys()]) {
                    const lowerKey = key.toLowerCase();
                    const value = params.get(key) || '';
                    if (LOG_SENSITIVE_QUERY_KEYS.has(lowerKey)) {
                        params.set(key, '***');
                        continue;
                    }
                    if (value.length >= 16 && /^[a-z0-9._\-~+/=]+$/i.test(value)) {
                        params.set(key, maskMiddle(value, 3, 2));
                    }
                }

                return parsed.toString();
            } catch (_) {
                return text.replace(
                    /([?&](?:token|key|apikey|api_key|access_token|refresh_token|password|passwd|pwd|secret|auth|authorization|session|sid|cookie|code|email)=)[^&#]*/ig,
                    '$1***'
                );
            }
        }

        function desensitizeUA(ua) {
            const text = String(ua ?? '').trim();
            if (!text || text === '无') return '无';
            const masked = text.replace(/[a-z0-9+/_=\-]{24,}/ig, (token) => maskMiddle(token, 4, 4));
            return masked.length > 80 ? `${masked.slice(0, 80)}...` : masked;
        }

        function translateLogType(type, ua = '') {
            // 如果是 Get_SUB 类型，检查 UA 是否包含 subconverter
            if (type === 'Get_SUB') {
                const uaLowercase = (ua || '').toLowerCase();
                if (uaLowercase.includes('subconverter')) {
                    return { text: '订阅转换', color: '#3b82f6' };
                }
                return { text: '获取订阅', color: '#10b981' };
            }

            const typeMap = {
                'Admin_Login': { text: '登录后台', color: '#f59e0b' },
                'Save_Config': { text: '保存配置', color: '#8b5cf6' },
                'Init_Config': { text: '重置配置', color: '#ef4444' },
                'Save_Custom_IPs': { text: '自定义优选', color: '#06b6d4' }
            };
            return typeMap[type] || { text: type, color: '#6b7280' };
        }

        // 格式化时间戳为 UTC+8
        function formatTime(timestamp) {
            const date = new Date(timestamp + 8 * 3600 * 1000);
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }

        // 在展开日志模块时加载日志
        let logsLoaded = false;
        function loadLogsOnExpand(titleEl) {
            const module = titleEl.parentElement;
            const isCollapsed = module.classList.contains('collapsed');

            // 如果是展开状态且还未加载过日志，则加载
            if (!isCollapsed && !logsLoaded) {
                loadLogs();
            }
        }

        // 加载最近8条日志
        async function loadLogs() {
            try {
                const response = await fetch('/admin/log.json?_t=' + Date.now(), {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                if (!response.ok) throw new Error('加载日志失败');
                const logs = await response.json();
                logsLoaded = true;

                // 按时间从新到旧排序，取前6条
                const recentLogs = logs.sort((a, b) => b.TIME - a.TIME).slice(0, 6);

                const container = document.getElementById('logsContainer');
                if (recentLogs.length === 0) {
                    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;">暂无日志记录</div>';
                    return;
                }

                // 检查是否为移动设备
                const isMobile = window.innerWidth <= 768;

                let html = '<table style="width: 100%; border-collapse: collapse;">';
                if (isMobile) {
                    // 移动设备：显示时间、IP、操作
                    html += '<thead><tr style="border-bottom: 2px solid #e5e7eb;"><th style="text-align: left; padding: 10px; font-weight: 600;">时间 (UTC+8)</th><th style="text-align: left; padding: 10px; font-weight: 600;">IP</th><th style="text-align: left; padding: 10px; font-weight: 600;">操作</th></tr></thead>';
                } else {
                    // 桌面设备：显示时间、IP、地区、操作
                    html += '<thead><tr style="border-bottom: 2px solid #e5e7eb;"><th style="text-align: left; padding: 10px; font-weight: 600;">时间 (UTC+8)</th><th style="text-align: left; padding: 10px; font-weight: 600;">IP</th><th style="text-align: left; padding: 10px; font-weight: 600;">地区</th><th style="text-align: left; padding: 10px; font-weight: 600;">操作</th></tr></thead>';
                }
                html += '<tbody>';

                recentLogs.forEach(log => {
                    const logType = translateLogType(log.TYPE, log.UA);
                    const cc = escapeLogHtml(log.CC || '未知');
                    const timeStr = escapeLogHtml(formatTime(log.TIME));
                    const ip = escapeLogHtml(desensitizeIP(log.IP));
                    const typeText = escapeLogHtml(logType.text);

                    if (isMobile) {
                        // 移动设备：不显示地区
                        html += `<tr style="border-bottom: 1px solid #f3f4f6;"><td style="padding: 10px; font-size: 12px;">${timeStr}</td><td style="padding: 10px; font-family: monospace; font-size: 12px;">${ip}</td><td style="padding: 10px;"><span style="display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; color: #fff; background-color: ${logType.color};">${typeText}</span></td></tr>`;
                    } else {
                        // 桌面设备：显示地区
                        html += `<tr style="border-bottom: 1px solid #f3f4f6;"><td style="padding: 10px;">${timeStr}</td><td style="padding: 10px; font-family: monospace; font-size: 12px;">${ip}</td><td style="padding: 10px;">${cc}</td><td style="padding: 10px;"><span style="display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; color: #fff; background-color: ${logType.color};">${typeText}</span></td></tr>`;
                    }
                });

                html += '</tbody></table>';
                container.innerHTML = html;
            } catch (error) {
                const container = document.getElementById('logsContainer');
                container.innerHTML = `<div style="text-align: center; padding: 20px; color: #ef4444;">加载日志失败: ${error.message}</div>`;
            }
        }

        // 显示全部日志
        async function showAllLogs() {
            try {
                const response = await fetch('/admin/log.json?_t=' + Date.now(), {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                if (!response.ok) throw new Error('加载日志失败');
                const logs = await response.json();

                // 按时间从新到旧排序
                const sortedLogs = logs.sort((a, b) => b.TIME - a.TIME);

                const container = document.getElementById('allLogsContainer');
                let html = '<table style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: auto;">';
                html += '<thead><tr style="border-bottom: 2px solid #e5e7eb; background: #f9fafb; white-space: nowrap;"><th style="text-align: left; padding: 10px; font-weight: 600; width: 160px;">时间 (UTC+8)</th><th style="text-align: left; padding: 10px; font-weight: 600; width: 120px;">IP</th><th style="text-align: left; padding: 10px; font-weight: 600; width: 80px;">地区</th><th style="text-align: left; padding: 10px; font-weight: 600; width: 80px;">ASN</th><th style="text-align: left; padding: 10px; font-weight: 600; width: 150px;">操作</th><th style="text-align: left; padding: 10px; font-weight: 600; flex: 1; min-width: 300px;">URL</th><th style="text-align: left; padding: 10px; font-weight: 600; flex: 1; min-width: 200px;">UA</th></tr></thead>';
                html += '<tbody>';

                sortedLogs.forEach(log => {
                    const logType = translateLogType(log.TYPE, log.UA);
                    const cc = escapeLogHtml(log.CC || '未知');
                    const asn = escapeLogHtml(log.ASN || '未知');
                    const timeStr = escapeLogHtml(formatTime(log.TIME));
                    const ip = escapeLogHtml(desensitizeIP(log.IP));
                    const url = escapeLogHtml(desensitizeURL(log.URL));
                    const ua = escapeLogHtml(desensitizeUA(log.UA));
                    const typeText = escapeLogHtml(logType.text);

                    html += `<tr style="border-bottom: 1px solid #f3f4f6;"><td style="text-align: left; padding: 8px; white-space: nowrap; width: 160px; font-size: 11px;">${timeStr}</td><td style="text-align: left; padding: 8px; font-family: monospace; font-size: 10px; white-space: nowrap; width: 120px; word-break: break-word;">${ip}</td><td style="text-align: left; padding: 8px; white-space: nowrap; width: 80px; font-size: 11px;">${cc}</td><td style="text-align: left; padding: 8px; white-space: nowrap; width: 80px; font-size: 11px; font-family: monospace;">${asn}</td><td style="text-align: left; padding: 8px; width: 150px;"><span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; color: #fff; background-color: ${logType.color}; white-space: nowrap;">${typeText}</span></td><td style="text-align: left; padding: 8px; font-size: 11px; word-break: break-word; min-width: 300px;">${url}</td><td style="text-align: left; padding: 8px; font-size: 10px; color: #6b7280; min-width: 200px; word-break: break-word;">${ua}</td></tr>`;
                });

                html += '</tbody></table>';
                container.innerHTML = html;
                document.getElementById('logsModal').classList.add('show');
            } catch (error) {
                showToast('加载日志失败: ' + error.message, 'error');
            }
        }

        // 关闭日志模态框
        function closeLogsModal(event) {
            if (event && event.target.id !== 'logsModal') return;
            document.getElementById('logsModal').classList.remove('show');
        }

        // 初始化
        initializeTheme();
        window.addEventListener('DOMContentLoaded', () => {
            loadConfig();
            initUserMode();
            initLineEditor('customIPs');
            // 独立预加载 SubConfig 数据，不阻塞主流程
            loadSubConfigData().catch(err => console.error('SubConfig预加载失败:', err));
        });

        // 启动倒计时更新
        setInterval(updateCountdown, 1000);
        updateCountdown();
