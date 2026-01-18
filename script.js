document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded');

    // 状态管理
    const state = {
        fonts: [],
        wallpapers: [],
        icons: {},
        css: '',
        currentFont: 'default',
        currentWallpaper: null,
        fontPresets: [],
        cssPresets: [],
        aiSettings: {
            url: '',
            key: '',
            model: '',
            temperature: 0.7
        },
        aiPresets: [],
        aiSettings2: {
            url: '',
            key: '',
            model: '',
            temperature: 0.7
        },
        aiPresets2: [],
        contacts: [], // { id, name, remark, avatar, persona, style, myAvatar, chatBg }
        currentChatContactId: null,
        chatHistory: {}, // { contactId: [{ role: 'user'|'assistant', content: '...' }] }
        worldbook: [], // { id, keys: [], content: '', enabled: true }
        userPersonas: [], // { id, title, aiPrompt, name }
        currentUserPersonaId: null,
        userProfile: { // 全局资料卡信息
            name: 'User Name',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            bgImage: '',
            momentsBgImage: '',
            desc: '点击此处添加个性签名',
            wxid: 'wxid_123456'
        },
        moments: [] // { id, contactId, content, images: [], time, likes: [], comments: [] }
    };

    // DOM 元素
    const appScreen = document.getElementById('theme-app');
    const openBtn = document.getElementById('app-theme');
    const closeBtn = document.getElementById('close-theme-app');
    
    const settingsAppScreen = document.getElementById('settings-app');
    const openSettingsBtn = document.getElementById('app-settings');
    const closeSettingsBtn = document.getElementById('close-settings-app');
    
    const wechatAppScreen = document.getElementById('wechat-app');
    const openWechatBtn = document.getElementById('app-wechat');
    const closeWechatBtn = document.getElementById('close-wechat-app');
    
    const worldbookAppScreen = document.getElementById('worldbook-app');
    const openWorldbookBtn = document.getElementById('app-worldbook');
    const closeWorldbookBtn = document.getElementById('close-worldbook-app');
    
    const screenContainer = document.getElementById('screen-container');

    // 应用列表配置
    const appList = [
        { id: 'icon-envelope', name: '信息', selector: '.icon-envelope' },
        { id: 'icon-wechat', name: '微信', selector: '.icon-wechat' },
        { id: 'icon-world', name: '世界书', selector: '.icon-world' },
        { id: 'icon-settings', name: '设置', selector: '.icon-settings' },
        { id: 'icon-theme', name: '美化', selector: '.icon-theme' },
        { id: 'icon-shopping', name: '购物', selector: '.icon-shopping' },
        { id: 'icon-forum', name: '论坛', selector: '.icon-forum' },
        { id: 'icon-phone', name: '查手机', selector: '.icon-phone' }
    ];

    // 处理应用点击
    function handleAppClick(app) {
        console.log('App clicked:', app.name);
        
        // 定义应用ID到全屏页面ID的映射
        const appMap = {
            'icon-theme': 'theme-app',
            'icon-settings': 'settings-app',
            'icon-wechat': 'wechat-app',
            'icon-world': 'worldbook-app'
        };

        const screenId = appMap[app.id];
        
        if (screenId) {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.remove('hidden');
            }
        } else {
            alert(`${app.name} 功能开发中...`);
        }
    }

    // 初始化
    init();

    function init() {
        setupEventListeners();
        setupIOSFullScreen(); // 添加iOS全屏适配
        
        try {
            loadConfig();
        } catch (e) {
            console.error('加载配置失败:', e);
        }

        try {
            renderWallpaperGallery();
        } catch (e) {
            console.error('渲染壁纸画廊失败:', e);
        }

        try {
            renderIconSettings();
        } catch (e) {
            console.error('渲染图标设置失败:', e);
        }

        try {
            applyConfig();
        } catch (e) {
            console.error('应用配置失败:', e);
        }
        
        renderFontPresets();
        renderCssPresets();
        renderAiPresets();
        renderAiPresets(true);
        updateAiUi();
        updateAiUi(true);
        renderContactList();
        renderWorldbookList();
        renderMeTab();
        renderMoments();
    }

    // iOS全屏适配逻辑
    function setupIOSFullScreen() {
        // 检测是否在iOS独立应用模式下运行
        function isInStandaloneMode() {
            return (
                window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone ||
                document.referrer.includes('android-app://')
            );
        }

        // 检测是否在iOS中
        function isIOS() {
            return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        }

        // 页面加载时应用全屏样式
        if (isIOS() && isInStandaloneMode()) {
            document.body.classList.add('ios-standalone');
            
            // 动态添加meta标签（如果需要）
            if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
                const meta = document.createElement('meta');
                meta.name = 'apple-mobile-web-app-capable';
                meta.content = 'yes';
                document.head.appendChild(meta);
            }
        }

        // 防止iOS缩放
        document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // 事件监听设置
    function setupEventListeners() {
        console.log('Setting up event listeners');
        
        // 统一绑定应用图标点击事件
        appList.forEach(app => {
            // 通过选择器找到图标元素
            const iconEl = document.querySelector(app.selector);
            if (iconEl) {
                // 找到最近的 .app-item 父元素作为点击目标
                const appItem = iconEl.closest('.app-item');
                if (appItem) {
                    // 移除旧的监听器（如果有）并添加新的
                    appItem.onclick = () => handleAppClick(app);
                    appItem.style.cursor = 'pointer';
                }
            }
        });

        // 绑定关闭按钮事件
        if (closeBtn) closeBtn.addEventListener('click', () => appScreen.classList.add('hidden'));
        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsAppScreen.classList.add('hidden'));
        if (closeWechatBtn) closeWechatBtn.addEventListener('click', () => wechatAppScreen.classList.add('hidden'));
        if (closeWorldbookBtn) closeWorldbookBtn.addEventListener('click', () => worldbookAppScreen.classList.add('hidden'));

        // 微信底栏切换
        const wechatTabs = document.querySelectorAll('.wechat-tab-item');
        const addContactBtn = document.getElementById('wechat-add-contact');

        wechatTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                wechatTabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.wechat-tab-content').forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`wechat-tab-${tab.dataset.tab}`).classList.add('active');

                // 控制右上角按钮显示
                if (tab.dataset.tab === 'contacts') {
                    addContactBtn.style.display = 'block';
                } else {
                    addContactBtn.style.display = 'none';
                }
            });
        });

        // 微信添加联系人
        const addContactModal = document.getElementById('add-contact-modal');
        const closeAddContactBtn = document.getElementById('close-add-contact');
        const saveContactBtn = document.getElementById('save-contact-btn');

        if (addContactBtn) addContactBtn.addEventListener('click', () => addContactModal.classList.remove('hidden'));
        if (closeAddContactBtn) closeAddContactBtn.addEventListener('click', () => addContactModal.classList.add('hidden'));
        if (saveContactBtn) saveContactBtn.addEventListener('click', handleSaveContact);

        // 微信聊天页面返回
        const backToContactsBtn = document.getElementById('back-to-contacts');
        if (backToContactsBtn) backToContactsBtn.addEventListener('click', () => {
            document.getElementById('chat-screen').classList.add('hidden');
            state.currentChatContactId = null;
        });

        // 聊天设置
        const chatSettingsBtn = document.getElementById('chat-settings-btn');
        const chatSettingsScreen = document.getElementById('chat-settings-screen');
        const closeChatSettingsBtn = document.getElementById('close-chat-settings');
        const saveChatSettingsBtn = document.getElementById('save-chat-settings-btn');
        const triggerAiMomentBtn = document.getElementById('trigger-ai-moment-btn');

        if (chatSettingsBtn) chatSettingsBtn.addEventListener('click', openChatSettings);
        if (closeChatSettingsBtn) closeChatSettingsBtn.addEventListener('click', () => chatSettingsScreen.classList.add('hidden'));
        if (saveChatSettingsBtn) saveChatSettingsBtn.addEventListener('click', handleSaveChatSettings);
        if (triggerAiMomentBtn) triggerAiMomentBtn.addEventListener('click', () => generateAiMoment(false));

        const clearChatHistoryBtn = document.getElementById('clear-chat-history-btn');
        if (clearChatHistoryBtn) clearChatHistoryBtn.addEventListener('click', handleClearChatHistory);

        // 聊天输入
        const chatInput = document.getElementById('chat-input');
        const triggerAiReplyBtn = document.getElementById('trigger-ai-reply-btn');

        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const text = chatInput.value.trim();
                    if (text) {
                        sendMessage(text, true);
                        chatInput.value = '';
                    }
                }
            });
        }

        if (triggerAiReplyBtn) {
            triggerAiReplyBtn.addEventListener('click', generateAiReply);
        }

        // 世界书相关
        const addWorldbookEntryBtn = document.getElementById('add-worldbook-entry');
        const worldbookEditModal = document.getElementById('worldbook-edit-modal');
        const closeWorldbookEditBtn = document.getElementById('close-worldbook-edit');
        const saveWorldbookBtn = document.getElementById('save-worldbook-btn');
        const deleteWorldbookBtn = document.getElementById('delete-worldbook-btn');

        if (addWorldbookEntryBtn) addWorldbookEntryBtn.addEventListener('click', () => openWorldbookEdit());
        if (closeWorldbookEditBtn) closeWorldbookEditBtn.addEventListener('click', () => worldbookEditModal.classList.add('hidden'));
        if (saveWorldbookBtn) saveWorldbookBtn.addEventListener('click', handleSaveWorldbookEntry);
        if (deleteWorldbookBtn) deleteWorldbookBtn.addEventListener('click', handleDeleteWorldbookEntry);

        // 字体相关
        const fontUpload = document.getElementById('font-upload');
        if (fontUpload) fontUpload.addEventListener('change', handleFontUpload);
        
        const applyFontUrlBtn = document.getElementById('apply-font-url');
        if (applyFontUrlBtn) applyFontUrlBtn.addEventListener('click', handleFontUrl);
        
        // 字体预设相关
        const saveFontPresetBtn = document.getElementById('save-font-preset');
        if (saveFontPresetBtn) saveFontPresetBtn.addEventListener('click', handleSaveFontPreset);
        
        const deleteFontPresetBtn = document.getElementById('delete-font-preset');
        if (deleteFontPresetBtn) deleteFontPresetBtn.addEventListener('click', handleDeleteFontPreset);
        
        const fontPresetSelect = document.getElementById('font-preset-select');
        if (fontPresetSelect) fontPresetSelect.addEventListener('change', handleApplyFontPreset);

        // 壁纸相关
        const wallpaperUpload = document.getElementById('wallpaper-upload');
        if (wallpaperUpload) wallpaperUpload.addEventListener('change', handleWallpaperUpload);
        
        const resetWallpaperBtn = document.getElementById('reset-wallpaper');
        if (resetWallpaperBtn) {
            resetWallpaperBtn.addEventListener('click', () => {
                state.currentWallpaper = null;
                applyWallpaper(null);
                saveConfig();
                renderWallpaperGallery();
            });
        }

        // 图标相关
        const resetIconsBtn = document.getElementById('reset-icons');
        if (resetIconsBtn) {
            resetIconsBtn.addEventListener('click', () => {
                state.icons = {};
                applyIcons();
                saveConfig();
                renderIconSettings();
            });
        }

        // CSS相关
        const saveCssBtn = document.getElementById('save-css');
        if (saveCssBtn) {
            saveCssBtn.addEventListener('click', () => {
                state.css = document.getElementById('css-editor').value;
                applyCSS(state.css);
                saveConfig();
                alert('CSS配置已保存');
            });
        }
        
        const exportCssBtn = document.getElementById('export-css');
        if (exportCssBtn) exportCssBtn.addEventListener('click', exportCSS);

        // CSS预设相关
        const saveCssPresetBtn = document.getElementById('save-css-preset');
        if (saveCssPresetBtn) saveCssPresetBtn.addEventListener('click', handleSaveCssPreset);
        
        const deleteCssPresetBtn = document.getElementById('delete-css-preset');
        if (deleteCssPresetBtn) deleteCssPresetBtn.addEventListener('click', handleDeleteCssPreset);
        
        const cssPresetSelect = document.getElementById('css-preset-select');
        if (cssPresetSelect) cssPresetSelect.addEventListener('change', handleApplyCssPreset);

        // AI 设置相关 (主)
        setupAiListeners(false);
        
        // AI 设置相关 (副)
        setupAiListeners(true);

        // 保存所有配置
        const saveAllSettingsBtn = document.getElementById('save-all-settings');
        if (saveAllSettingsBtn) {
            saveAllSettingsBtn.addEventListener('click', () => {
                saveConfig();
                alert('所有配置已保存');
            });
        }

        // 身份管理相关
        const switchPersonaBtn = document.getElementById('switch-persona-btn');
        const closePersonaManageBtn = document.getElementById('close-persona-manage');
        const addPersonaBtn = document.getElementById('add-persona-btn');
        const closePersonaEditBtn = document.getElementById('close-persona-edit');
        const savePersonaBtn = document.getElementById('save-persona-btn');
        const deletePersonaBtn = document.getElementById('delete-persona-btn');

        if (switchPersonaBtn) switchPersonaBtn.addEventListener('click', openPersonaManage);
        if (closePersonaManageBtn) closePersonaManageBtn.addEventListener('click', () => document.getElementById('persona-manage-modal').classList.add('hidden'));
        if (addPersonaBtn) addPersonaBtn.addEventListener('click', () => {
            document.getElementById('persona-manage-modal').classList.add('hidden');
            openPersonaEdit(null);
        });
        if (closePersonaEditBtn) closePersonaEditBtn.addEventListener('click', () => document.getElementById('persona-edit-modal').classList.add('hidden'));
        if (savePersonaBtn) savePersonaBtn.addEventListener('click', handleSavePersona);
        if (deletePersonaBtn) deletePersonaBtn.addEventListener('click', handleDeletePersona);

        // 数据管理
        const saveConfigBtn = document.getElementById('save-config');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', () => {
                saveConfig();
                alert('配置已保存');
            });
        }
        
        const loadConfigBtn = document.getElementById('load-config');
        if (loadConfigBtn) {
            loadConfigBtn.addEventListener('click', () => {
                loadConfig();
                alert('配置已加载');
            });
        }
        
        const exportJsonBtn = document.getElementById('export-json');
        if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);
        
        const importJsonInput = document.getElementById('import-json');
        if (importJsonInput) importJsonInput.addEventListener('change', importJSON);

        // 朋友圈背景上传
        const momentsBgInput = document.getElementById('moments-bg-input');
        if (momentsBgInput) momentsBgInput.addEventListener('change', (e) => handleMeImageUpload(e, 'momentsBgImage'));

        // 发布动态相关
        const addMomentBtn = document.getElementById('add-moment-btn');
        const postMomentModal = document.getElementById('post-moment-modal');
        const closePostMomentBtn = document.getElementById('close-post-moment');
        const doPostMomentBtn = document.getElementById('do-post-moment');
        const addMomentImageBtn = document.getElementById('add-moment-image-btn');
        const postMomentFileInput = document.getElementById('post-moment-file-input');

        if (addMomentBtn) {
            // 长按发文字
            let pressTimer;
            addMomentBtn.addEventListener('mousedown', () => {
                pressTimer = setTimeout(() => {
                    openPostMoment(true); // 纯文字模式
                }, 800);
            });
            addMomentBtn.addEventListener('mouseup', () => clearTimeout(pressTimer));
            addMomentBtn.addEventListener('touchstart', () => {
                pressTimer = setTimeout(() => {
                    openPostMoment(true); // 纯文字模式
                }, 800);
            });
            addMomentBtn.addEventListener('touchend', () => clearTimeout(pressTimer));
            
            // 点击发图文
            addMomentBtn.addEventListener('click', (e) => {
                if (e.detail === 1) { // 区分点击和长按
                    openPostMoment(false);
                }
            });
        }

        if (closePostMomentBtn) closePostMomentBtn.addEventListener('click', () => postMomentModal.classList.add('hidden'));
        if (doPostMomentBtn) doPostMomentBtn.addEventListener('click', handlePostMoment);
        if (addMomentImageBtn) addMomentImageBtn.addEventListener('click', () => postMomentFileInput.click());
        if (postMomentFileInput) postMomentFileInput.addEventListener('change', handlePostMomentImages);
    }

    let postMomentImages = [];

    function openPostMoment(isTextOnly) {
        const modal = document.getElementById('post-moment-modal');
        const textInput = document.getElementById('post-moment-text');
        const imageContainer = document.getElementById('post-moment-images');
        
        textInput.value = '';
        postMomentImages = [];
        renderPostMomentImages();
        
        if (isTextOnly) {
            imageContainer.style.display = 'none';
            textInput.placeholder = '这一刻的想法...';
        } else {
            imageContainer.style.display = 'grid';
            textInput.placeholder = '这一刻的想法...';
        }
        
        modal.classList.remove('hidden');
    }

    function handlePostMomentImages(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (postMomentImages.length < 9) {
                    postMomentImages.push(event.target.result);
                    renderPostMomentImages();
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    }

    function renderPostMomentImages() {
        const container = document.getElementById('post-moment-images');
        const addBtn = document.getElementById('add-moment-image-btn');
        
        // 清除旧的图片预览（保留添加按钮）
        const oldItems = container.querySelectorAll('.post-image-item');
        oldItems.forEach(item => item.remove());
        
        postMomentImages.forEach((imgSrc, index) => {
            const item = document.createElement('div');
            item.className = 'post-image-item';
            item.innerHTML = `<img src="${imgSrc}">`;
            container.insertBefore(item, addBtn);
        });

        if (postMomentImages.length >= 9) {
            addBtn.style.display = 'none';
        } else {
            addBtn.style.display = 'flex';
        }
    }

    function handlePostMoment() {
        const content = document.getElementById('post-moment-text').value.trim();
        
        if (!content && postMomentImages.length === 0) {
            alert('请输入内容或选择图片');
            return;
        }

        addMoment('me', content, [...postMomentImages]);

        // 同步动态发布信息到所有联系人的聊天记录（隐藏消息）
        // 这样AI在任何聊天中都能知道用户发了动态
        const momentSummary = content || '[图片动态]';
        const imageTag = postMomentImages.length > 0 ? ` [包含${postMomentImages.length}张图片]` : '';
        const hiddenMsg = `[发布了动态]: ${momentSummary}${imageTag}`;

        state.contacts.forEach(contact => {
            if (!state.chatHistory[contact.id]) {
                state.chatHistory[contact.id] = [];
            }
            state.chatHistory[contact.id].push({
                role: 'user',
                content: hiddenMsg
            });
        });
        
        // 如果当前在聊天界面，且该消息是隐藏的，不需要更新UI，但需要保存
        saveConfig();

        document.getElementById('post-moment-modal').classList.add('hidden');
    }

    function setupAiListeners(isSecondary) {
        const suffix = isSecondary ? '-2' : '';
        const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
        
        const aiApiUrl = document.getElementById(`ai-api-url${suffix}`);
        if (aiApiUrl) aiApiUrl.addEventListener('change', (e) => {
            state[settingsKey].url = e.target.value;
        });

        const aiApiKey = document.getElementById(`ai-api-key${suffix}`);
        if (aiApiKey) aiApiKey.addEventListener('change', (e) => {
            state[settingsKey].key = e.target.value;
        });

        const fetchModelsBtn = document.getElementById(`fetch-models${suffix}`);
        if (fetchModelsBtn) fetchModelsBtn.addEventListener('click', () => handleFetchModels(isSecondary));

        const aiModelSelect = document.getElementById(`ai-model-select${suffix}`);
        if (aiModelSelect) aiModelSelect.addEventListener('change', (e) => {
            state[settingsKey].model = e.target.value;
        });

        const aiTemperature = document.getElementById(`ai-temperature${suffix}`);
        if (aiTemperature) aiTemperature.addEventListener('input', (e) => {
            state[settingsKey].temperature = parseFloat(e.target.value);
            document.getElementById(`ai-temp-value${suffix}`).textContent = state[settingsKey].temperature;
        });

        // AI 预设相关
        const saveAiPresetBtn = document.getElementById(`save-ai-preset${suffix}`);
        if (saveAiPresetBtn) saveAiPresetBtn.addEventListener('click', () => handleSaveAiPreset(isSecondary));

        const deleteAiPresetBtn = document.getElementById(`delete-ai-preset${suffix}`);
        if (deleteAiPresetBtn) deleteAiPresetBtn.addEventListener('click', () => handleDeleteAiPreset(isSecondary));

        const aiPresetSelect = document.getElementById(`ai-preset-select${suffix}`);
        if (aiPresetSelect) aiPresetSelect.addEventListener('change', (e) => handleApplyAiPreset(e, isSecondary));
    }

    // --- 身份管理功能 ---

    let currentEditingPersonaId = null;

    function renderMeTab() {
        const container = document.getElementById('me-profile-container');
        if (!container) return;

        // 确保 userProfile 存在
        if (!state.userProfile) {
            state.userProfile = {
                name: 'User Name',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                bgImage: '',
                desc: '点击此处添加个性签名',
                wxid: 'wxid_123456'
            };
        }

        const { name, wxid, avatar, bgImage, desc } = state.userProfile;
        const bg = bgImage || '';

        container.innerHTML = `
            <div class="me-profile-card">
                <div class="me-bg" id="me-bg-trigger" style="background-image: url('${bg}'); background-color: ${bg ? 'transparent' : '#ccc'};"></div>
                <div class="me-info">
                    <div class="me-avatar-row">
                        <img class="me-avatar" id="me-avatar-trigger" src="${avatar}">
                    </div>
                    <div class="me-name" id="me-name-trigger">${name}</div>
                    <div class="me-id">微信号：<span id="me-id-trigger">${wxid}</span></div>
                    <div class="me-desc" id="me-desc-trigger">${desc}</div>
                </div>
            </div>
        `;

        // 绑定事件
        const avatarInput = document.getElementById('me-avatar-input');
        const bgInput = document.getElementById('me-bg-input');

        document.getElementById('me-avatar-trigger').addEventListener('click', () => avatarInput.click());
        document.getElementById('me-bg-trigger').addEventListener('click', () => bgInput.click());

        avatarInput.onchange = (e) => handleMeImageUpload(e, 'avatar');
        bgInput.onchange = (e) => handleMeImageUpload(e, 'bgImage');

        makeEditable('me-name-trigger', 'name');
        makeEditable('me-id-trigger', 'wxid');
        makeEditable('me-desc-trigger', 'desc');
    }

    function handleMeImageUpload(e, type) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            updateUserProfile(type, event.target.result);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // 重置，允许重复选择同一文件
    }

    function makeEditable(elementId, field) {
        const el = document.getElementById(elementId);
        el.addEventListener('click', () => {
            const currentText = el.textContent;
            const input = document.createElement(field === 'desc' ? 'textarea' : 'input');
            input.value = currentText === '点击此处添加个性签名' ? '' : currentText;
            input.className = 'editable-input'; // 需要在CSS中定义，或者内联样式
            input.style.width = '100%';
            input.style.fontSize = 'inherit';
            input.style.fontFamily = 'inherit';
            
            el.replaceWith(input);
            input.focus();

            const save = () => {
                const newValue = input.value.trim();
                updateUserProfile(field, newValue);
                // renderMeTab 会重新渲染，所以不需要手动替换回 div
            };

            input.addEventListener('blur', save);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && field !== 'desc') {
                    save();
                }
            });
        });
    }

    function updateUserProfile(field, value) {
        if (!state.userProfile) {
            state.userProfile = {
                name: 'User Name',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                bgImage: '',
                momentsBgImage: '',
                desc: '点击此处添加个性签名',
                wxid: 'wxid_123456'
            };
        }
        state.userProfile[field] = value;
        saveConfig();
        renderMeTab();
        renderMoments();
    }

    function renderMoments() {
        const container = document.getElementById('moments-container');
        if (!container) return;

        // 确保 userProfile 存在
        if (!state.userProfile) {
            state.userProfile = {
                name: 'User Name',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                bgImage: '',
                momentsBgImage: '',
                desc: '点击此处添加个性签名',
                wxid: 'wxid_123456'
            };
        }

        const { name, avatar, momentsBgImage, desc } = state.userProfile;
        const bg = momentsBgImage || '';

        // 检查是否已经渲染过结构
        const coverEl = document.getElementById('moments-cover-trigger');
        if (coverEl) {
            // 更新内容
            coverEl.style.backgroundImage = `url('${bg}')`;
            coverEl.style.backgroundColor = ''; // 移除内联背景色，交由CSS控制
            
            document.getElementById('moments-user-name').textContent = name;
            document.getElementById('moments-user-avatar').src = avatar;
        } else {
            // 首次渲染
            container.innerHTML = `
                <div class="moments-header">
                    <div class="moments-cover" id="moments-cover-trigger" style="background-image: url('${bg}');">
                        <div class="moments-user-info">
                            <span class="moments-user-name" id="moments-user-name">${name}</span>
                            <img class="moments-user-avatar" id="moments-user-avatar" src="${avatar}">
                        </div>
                    </div>
                </div>
                <div class="moments-list" id="moments-list-content">
                    <!-- 朋友圈列表内容 -->
                </div>
            `;
            
            // 绑定事件
            document.getElementById('moments-cover-trigger').addEventListener('click', () => {
                document.getElementById('moments-bg-input').click();
            });
        }

        renderMomentsList();
    }

    function renderMomentsList() {
        const listContainer = document.getElementById('moments-list-content');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (!state.moments) state.moments = [];

        // 按时间倒序
        const sortedMoments = [...state.moments].sort((a, b) => b.time - a.time);

        sortedMoments.forEach(moment => {
            let avatar, name;
            
            if (moment.contactId === 'me') {
                avatar = state.userProfile.avatar;
                name = state.userProfile.name;
            } else {
                const contact = state.contacts.find(c => c.id === moment.contactId);
                if (contact) {
                    avatar = contact.avatar;
                    name = contact.remark || contact.name;
                } else {
                    avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown';
                    name = '未知用户';
                }
            }

            const item = document.createElement('div');
            item.className = 'moment-item';
            
            // 图片HTML
            let imagesHtml = '';
            if (moment.images && moment.images.length > 0) {
                const gridClass = moment.images.length === 1 ? 'single' : 'grid';
                imagesHtml = `<div class="moment-images ${gridClass}">
                    ${moment.images.map(img => `<img src="${img}" class="moment-img">`).join('')}
                </div>`;
            }

            // 点赞列表HTML
            let likesHtml = '';
            if (moment.likes && moment.likes.length > 0) {
                likesHtml = `<div class="moment-likes"><i class="far fa-heart"></i> ${moment.likes.join(', ')}</div>`;
            }

            // 评论列表HTML
            let commentsHtml = '';
            if (moment.comments && moment.comments.length > 0) {
                commentsHtml = `<div class="moment-comments">
                    ${moment.comments.map((c, index) => {
                        let userHtml = `<span class="comment-user">${c.user}</span>`;
                        if (c.replyTo) {
                            userHtml += `回复<span class="comment-user">${c.replyTo}</span>`;
                        }
                        return `<div class="comment-item" onclick="event.stopPropagation(); window.handleCommentClick(this, ${moment.id}, ${index}, '${c.user}')" style="display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer; padding: 2px 4px; border-radius: 2px;">
                            <span style="flex: 1;">${userHtml}：<span class="comment-content">${c.content}</span></span>
                            <span class="comment-delete-btn" style="display: none; color: #576b95; margin-left: 8px; font-size: 12px; padding: 0 4px;">✕</span>
                        </div>`;
                    }).join('')}
                </div>`;
            }

            // 底部区域HTML
            let footerHtml = '';
            if (likesHtml || commentsHtml) {
                footerHtml = `<div class="moment-likes-comments">${likesHtml}${commentsHtml}</div>`;
            }

            // 时间格式化 (简单处理)
            const date = new Date(moment.time);
            const timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

            item.innerHTML = `
                <img src="${avatar}" class="moment-avatar">
                <div class="moment-content">
                    <div class="moment-name">${name}</div>
                    <div class="moment-text">${moment.content}</div>
                    ${imagesHtml}
                    <div class="moment-info">
                        <div style="display: flex; align-items: center;">
                            <span class="moment-time">${timeStr}</span>
                            <span class="moment-delete" onclick="window.deleteMoment(${moment.id})">删除</span>
                        </div>
                        <div style="position: relative;">
                            <button class="moment-action-btn" onclick="window.toggleActionMenu(this, ${moment.id})"><i class="fas fa-ellipsis-h"></i></button>
                            <div class="action-menu" id="action-menu-${moment.id}">
                                <button class="action-menu-btn" onclick="window.toggleLike(${moment.id})"><i class="far fa-heart"></i> 赞</button>
                                <button class="action-menu-btn" onclick="window.showCommentInput(${moment.id})"><i class="far fa-comment"></i> 评论</button>
                            </div>
                        </div>
                    </div>
                    ${footerHtml}
                </div>
            `;
            
            listContainer.appendChild(item);
        });
    }

    window.deleteMoment = function(id) {
        if (confirm('确定删除这条动态吗？')) {
            state.moments = state.moments.filter(m => m.id !== id);
            saveConfig();
            renderMomentsList();
        }
    };

    window.handleCommentClick = function(el, momentId, index, user) {
        const deleteBtn = el.querySelector('.comment-delete-btn');
        
        // 检查是否已经显示
        if (deleteBtn.style.display !== 'none') {
            // 已经显示了，再次点击 -> 回复
            window.replyToComment(momentId, user);
        } else {
            // 未显示 -> 显示删除按钮，隐藏其他的
            document.querySelectorAll('.comment-delete-btn').forEach(btn => btn.style.display = 'none');
            document.querySelectorAll('.comment-item').forEach(item => item.style.backgroundColor = '');
            
            deleteBtn.style.display = 'inline-block';
            el.style.backgroundColor = '#e5e5e5'; // 选中背景
            
            // 绑定删除事件
            deleteBtn.onclick = function(e) {
                e.stopPropagation();
                window.deleteComment(momentId, index);
            };
            
            // 点击其他地方隐藏
            const closeDelete = () => {
                deleteBtn.style.display = 'none';
                el.style.backgroundColor = '';
                document.removeEventListener('click', closeDelete);
            };
            setTimeout(() => document.addEventListener('click', closeDelete), 0);
        }
    };

    window.deleteComment = function(momentId, commentIndex) {
        if (confirm('确定删除这条评论吗？')) {
            const moment = state.moments.find(m => m.id === momentId);
            if (moment && moment.comments) {
                moment.comments.splice(commentIndex, 1);
                saveConfig();
                renderMomentsList();
            }
        }
    };

    window.toggleActionMenu = function(btn, id) {
        // 关闭其他打开的菜单
        document.querySelectorAll('.action-menu.show').forEach(el => {
            if (el.id !== `action-menu-${id}`) el.classList.remove('show');
        });
        
        const menu = document.getElementById(`action-menu-${id}`);
        menu.classList.toggle('show');
        
        // 点击其他地方关闭
        const closeMenu = (e) => {
            if (!btn.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.remove('show');
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    };

    window.toggleLike = function(id, userName = null) {
        const moment = state.moments.find(m => m.id === id);
        if (!moment) return;

        if (!moment.likes) moment.likes = [];
        
        const likerName = userName || state.userProfile.name;
        const index = moment.likes.indexOf(likerName);
        
        if (index > -1) {
            moment.likes.splice(index, 1);
        } else {
            moment.likes.push(likerName);
        }
        
        saveConfig();
        renderMomentsList();
    };

    window.showCommentInput = function(id) {
        const content = prompt('请输入评论内容：');
        if (content) {
            window.submitComment(id, content);
        }
        // 关闭菜单
        const menu = document.getElementById(`action-menu-${id}`);
        if (menu) menu.classList.remove('show');
    };

    window.replyToComment = function(momentId, toUser) {
        if (toUser === state.userProfile.name) {
            alert('不能回复自己');
            return;
        }
        const content = prompt(`回复 ${toUser}：`);
        if (content) {
            window.submitComment(momentId, content, toUser);
        }
    };

    window.submitComment = function(id, content, replyTo = null, userName = null) {
        const moment = state.moments.find(m => m.id === id);
        if (!moment) return;

        if (!moment.comments) moment.comments = [];
        
        const commenterName = userName || state.userProfile.name;

        moment.comments.push({
            user: commenterName,
            content: content,
            replyTo: replyTo
        });

        // 同步到聊天记录 (如果是用户评论AI的动态)
        if (moment.contactId !== 'me' && !userName) {
            const contactId = moment.contactId;
            // 截取动态内容防止过长
            let momentText = moment.content;
            if (momentText.length > 50) momentText = momentText.substring(0, 50) + '...';
            
            let chatMsg = `[评论了你的动态: "${momentText}"] ${content}`;
            if (replyTo) {
                chatMsg = `[评论了你的动态: "${momentText}"] (回复 ${replyTo}) ${content}`;
            }
            
            if (!state.chatHistory[contactId]) {
                state.chatHistory[contactId] = [];
            }
            state.chatHistory[contactId].push({
                role: 'user',
                content: chatMsg
            });
            
            // 如果当前正在该聊天窗口，更新UI
            if (state.currentChatContactId === contactId) {
                appendMessageToUI(chatMsg, true);
                scrollToBottom();
            }
        }
        
        saveConfig();
        renderMomentsList();

        // 触发AI回复评论 (如果是AI发的动态，且不是AI自己评论的)
        if (moment.contactId !== 'me' && !userName) {
            setTimeout(() => {
                generateAiCommentReply(moment, { user: state.userProfile.name, content: content, replyTo: replyTo });
            }, 2000);
        }
    };

    async function generateAiCommentReply(moment, userComment) {
        const contact = state.contacts.find(c => c.id === moment.contactId);
        if (!contact) return;

        const settings = state.aiSettings.url ? state.aiSettings : state.aiSettings2;
        if (!settings.url || !settings.key) return;

        try {
            let contextDesc = `你的朋友 ${userComment.user} 在下面评论说：“${userComment.content}”`;
            if (userComment.replyTo) {
                contextDesc = `你的朋友 ${userComment.user} 回复了 ${userComment.replyTo} 说：“${userComment.content}”`;
            }

            let systemPrompt = `你现在扮演 ${contact.name}。
人设：${contact.persona || '无'}

【当前情境】
你发了一条朋友圈：“${moment.content}”
${contextDesc}

【任务】
请回复 ${userComment.user}。
回复要求：
1. 简短自然，像微信朋友圈回复。
2. 符合你的人设。
3. 直接返回回复内容，不要包含任何解释。`;

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.key}`
                },
                body: JSON.stringify({
                    model: settings.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: '请回复' }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) return;

            const data = await response.json();
            let replyContent = data.choices[0].message.content.trim();
            
            // 去除可能的引号
            if ((replyContent.startsWith('"') && replyContent.endsWith('"')) || (replyContent.startsWith('“') && replyContent.endsWith('”'))) {
                replyContent = replyContent.slice(1, -1);
            }

            // 添加回复到评论列表
            if (!moment.comments) moment.comments = [];
            moment.comments.push({
                user: contact.remark || contact.name,
                content: replyContent,
                replyTo: userComment.user
            });
            
            saveConfig();
            renderMomentsList();

        } catch (error) {
            console.error('AI回复评论失败:', error);
        }
    }

    function addMoment(contactId, content, images = []) {
        if (!state.moments) state.moments = [];
        
        const newMoment = {
            id: Date.now(),
            contactId,
            content,
            images,
            time: Date.now(),
            likes: [],
            comments: []
        };
        
        state.moments.unshift(newMoment);
        saveConfig();
        renderMomentsList();
    }

    async function generateAiMoment(isSilent = false) {
        if (!state.currentChatContactId) {
            if (!isSilent) alert('请先进入一个聊天窗口');
            return;
        }
        
        const contact = state.contacts.find(c => c.id === state.currentChatContactId);
        if (!contact) return;

        const settings = state.aiSettings.url ? state.aiSettings : state.aiSettings2;
        if (!settings.url || !settings.key) {
            if (!isSilent) alert('请先在设置中配置AI API');
            return;
        }

        const btn = document.getElementById('trigger-ai-moment-btn');
        let originalText = '';
        if (btn) {
            originalText = btn.textContent;
            btn.textContent = '生成中...';
            btn.disabled = true;
        }

        try {
            let systemPrompt = `你现在扮演 ${contact.name}。
人设：${contact.persona || '无'}
请生成一条朋友圈动态内容。
内容要求：
1. 符合你的人设。
2. 像真实的朋友圈，可以是心情、生活分享、吐槽等。
3. 不要太长，通常在100字以内。
4. 直接返回内容文本，不要包含任何解释、引号或前缀后缀。`;

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.key}`
                },
                body: JSON.stringify({
                    model: settings.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: '发一条朋友圈' }
                    ],
                    temperature: 0.8
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            let content = data.choices[0].message.content.trim();
            
            // 去除可能的引号
            if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith('“') && content.endsWith('”'))) {
                content = content.slice(1, -1);
            }

            addMoment(contact.id, content);
            
            if (!isSilent) {
                alert('动态发布成功！');
                document.getElementById('chat-settings-screen').classList.add('hidden');
            }

        } catch (error) {
            console.error('AI生成动态失败:', error);
            if (!isSilent) alert('生成失败，请检查配置');
        } finally {
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
    }

    function openPersonaManage() {
        const list = document.getElementById('persona-list');
        list.innerHTML = '';

        // 确保 userProfile 存在
        if (!state.userProfile) {
            state.userProfile = {
                name: 'User Name',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                bgImage: '',
                desc: '点击此处添加个性签名',
                wxid: 'wxid_123456'
            };
        }

        state.userPersonas.forEach(p => {
            const item = document.createElement('div');
            item.className = `persona-item`;
            // 使用全局头像，名字使用身份的名字
            item.innerHTML = `
                <img src="${state.userProfile.avatar}" class="persona-avatar">
                <div class="persona-info">
                    <div class="persona-name">${p.name || '未命名身份'}</div>
                </div>
                <button class="ios-btn-small" style="margin-left: 10px;" onclick="event.stopPropagation(); window.editPersona('${p.id}')">设置</button>
            `;
            // item.addEventListener('click', () => switchPersona(p.id));
            list.appendChild(item);
        });

        document.getElementById('persona-manage-modal').classList.remove('hidden');
    }

    window.editPersona = function(id) {
        // 关闭管理弹窗，打开编辑弹窗
        document.getElementById('persona-manage-modal').classList.add('hidden');
        openPersonaEdit(parseInt(id));
    }

    function switchPersona(id) {
        state.currentUserPersonaId = id;
        saveConfig();
        renderMeTab();
        document.getElementById('persona-manage-modal').classList.add('hidden');
    }

    function openPersonaEdit(id = null) {
        currentEditingPersonaId = id;
        const modal = document.getElementById('persona-edit-modal');
        const title = document.getElementById('persona-modal-title');
        const deleteBtn = document.getElementById('delete-persona-btn');
        
        if (id) {
            const p = state.userPersonas.find(p => p.id === id);
            if (p) {
                title.textContent = '编辑身份信息';
                document.getElementById('persona-name').value = p.name || '';
                document.getElementById('persona-ai-prompt').value = p.aiPrompt || '';
                deleteBtn.style.display = 'block';
            }
        } else {
            title.textContent = '新建身份';
            document.getElementById('persona-name').value = '';
            document.getElementById('persona-ai-prompt').value = '';
            deleteBtn.style.display = 'none';
        }
        
        modal.classList.remove('hidden');
    }

    function handleSavePersona() {
        const name = document.getElementById('persona-name').value;
        const aiPrompt = document.getElementById('persona-ai-prompt').value;

        if (currentEditingPersonaId) {
            const p = state.userPersonas.find(p => p.id === currentEditingPersonaId);
            if (p) {
                p.name = name;
                p.title = name; // 保持兼容
                p.aiPrompt = aiPrompt;
            }
        } else {
            const newId = Date.now();
            const newPersona = {
                id: newId,
                title: name || '未命名身份',
                name: name || '未命名身份',
                aiPrompt,
                // 以下字段不再使用，但为了兼容性保留或设为空
                personaId: '',
                desc: '',
                avatar: '',
                bgImage: ''
            };
            state.userPersonas.push(newPersona);
            state.currentUserPersonaId = newId; // 自动切换
        }
        
        saveConfig();
        // renderMeTab(); // 资料卡不再随身份变化，不需要重新渲染
        document.getElementById('persona-edit-modal').classList.add('hidden');
    }

    function handleDeletePersona() {
        if (!currentEditingPersonaId) return;
        if (confirm('确定要删除此身份吗？')) {
            state.userPersonas = state.userPersonas.filter(p => p.id !== currentEditingPersonaId);
            if (state.currentUserPersonaId === currentEditingPersonaId) {
                state.currentUserPersonaId = state.userPersonas.length > 0 ? state.userPersonas[0].id : null;
            }
            saveConfig();
            renderMeTab();
            document.getElementById('persona-edit-modal').classList.add('hidden');
        }
    }

    // --- 世界书功能 ---

    let currentEditingEntryId = null;

    function renderWorldbookList() {
        const list = document.getElementById('worldbook-list');
        const emptyState = document.getElementById('worldbook-empty');
        if (!list) return;

        list.innerHTML = '';

        if (!state.worldbook || state.worldbook.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        state.worldbook.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'wb-entry';
            item.innerHTML = `
                <div class="wb-header">
                    <span class="wb-keys">${entry.keys.join(', ')}</span>
                    <span class="wb-status ${entry.enabled ? 'enabled' : 'disabled'}">${entry.enabled ? '启用' : '禁用'}</span>
                </div>
                <div class="wb-content">${entry.content}</div>
            `;
            item.addEventListener('click', () => openWorldbookEdit(entry.id));
            list.appendChild(item);
        });
    }

    function openWorldbookEdit(entryId = null) {
        currentEditingEntryId = entryId;
        const modal = document.getElementById('worldbook-edit-modal');
        const title = document.getElementById('worldbook-modal-title');
        const keysInput = document.getElementById('wb-keys');
        const contentInput = document.getElementById('wb-content');
        const enabledInput = document.getElementById('wb-enabled');
        const deleteBtn = document.getElementById('delete-worldbook-btn');

        if (entryId) {
            const entry = state.worldbook.find(e => e.id === entryId);
            if (entry) {
                title.textContent = '编辑条目';
                keysInput.value = entry.keys.join(', ');
                contentInput.value = entry.content;
                enabledInput.checked = entry.enabled;
                deleteBtn.style.display = 'block';
            }
        } else {
            title.textContent = '新建条目';
            keysInput.value = '';
            contentInput.value = '';
            enabledInput.checked = true;
            deleteBtn.style.display = 'none';
        }

        modal.classList.remove('hidden');
    }

    function handleSaveWorldbookEntry() {
        const keysInput = document.getElementById('wb-keys');
        const contentInput = document.getElementById('wb-content');
        const enabledInput = document.getElementById('wb-enabled');

        const keys = keysInput.value.split(/[,，]/).map(k => k.trim()).filter(k => k);
        const content = contentInput.value.trim();
        const enabled = enabledInput.checked;

        if (keys.length === 0) {
            alert('请输入至少一个关键字');
            return;
        }

        if (!content) {
            alert('请输入内容');
            return;
        }

        if (currentEditingEntryId) {
            // 编辑现有
            const entry = state.worldbook.find(e => e.id === currentEditingEntryId);
            if (entry) {
                entry.keys = keys;
                entry.content = content;
                entry.enabled = enabled;
            }
        } else {
            // 新建
            const newEntry = {
                id: Date.now(),
                keys: keys,
                content: content,
                enabled: enabled
            };
            if (!state.worldbook) state.worldbook = [];
            state.worldbook.push(newEntry);
        }

        saveConfig();
        renderWorldbookList();
        document.getElementById('worldbook-edit-modal').classList.add('hidden');
    }

    function handleDeleteWorldbookEntry() {
        if (!currentEditingEntryId) return;

        if (confirm('确定要删除此条目吗？')) {
            state.worldbook = state.worldbook.filter(e => e.id !== currentEditingEntryId);
            saveConfig();
            renderWorldbookList();
            document.getElementById('worldbook-edit-modal').classList.add('hidden');
        }
    }

    // --- 微信功能 ---

    function handleSaveContact() {
        const name = document.getElementById('contact-name').value;
        const remark = document.getElementById('contact-remark').value;
        const persona = document.getElementById('contact-persona').value;
        const style = document.getElementById('contact-style').value;
        const avatarInput = document.getElementById('contact-avatar-upload');
        
        if (!name) {
            alert('请输入姓名');
            return;
        }

        const contact = {
            id: Date.now(),
            name,
            remark,
            persona,
            style,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + name // 默认头像
        };

        if (avatarInput.files && avatarInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                contact.avatar = e.target.result;
                saveContactAndClose(contact);
            };
            reader.readAsDataURL(avatarInput.files[0]);
        } else {
            saveContactAndClose(contact);
        }
    }

    function saveContactAndClose(contact) {
        state.contacts.push(contact);
        saveConfig();
        renderContactList();
        
        // 清空输入
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-remark').value = '';
        document.getElementById('contact-persona').value = '';
        document.getElementById('contact-style').value = '';
        document.getElementById('contact-avatar-upload').value = '';
        
        document.getElementById('add-contact-modal').classList.add('hidden');
        openChat(contact.id);
    }

    function renderContactList() {
        const list = document.getElementById('contact-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        state.contacts.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'contact-item';
            item.innerHTML = `
                <img src="${contact.avatar}" class="contact-avatar">
                <div class="contact-info">
                    <div class="contact-name">${contact.remark || contact.name}</div>
                </div>
            `;
            item.addEventListener('click', () => openChat(contact.id));
            list.appendChild(item);
        });
    }

    function openChat(contactId) {
        const contact = state.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        state.currentChatContactId = contactId;
        document.getElementById('chat-title').textContent = contact.remark || contact.name;
        
        // 应用聊天背景
        const chatScreen = document.getElementById('chat-screen');
        if (contact.chatBg) {
            chatScreen.style.backgroundImage = `url(${contact.chatBg})`;
            chatScreen.style.backgroundSize = 'cover';
            chatScreen.style.backgroundPosition = 'center';
        } else {
            chatScreen.style.backgroundImage = '';
        }
        
        chatScreen.classList.remove('hidden');
        
        renderChatHistory(contactId);
    }

    function openChatSettings() {
        if (!state.currentChatContactId) return;
        const contact = state.contacts.find(c => c.id === state.currentChatContactId);
        if (!contact) return;

        document.getElementById('chat-setting-remark').value = contact.remark || '';
        document.getElementById('chat-setting-persona').value = contact.persona || '';
        // 清空文件输入
        document.getElementById('chat-setting-avatar').value = '';
        document.getElementById('chat-setting-my-avatar').value = '';
        document.getElementById('chat-setting-bg').value = '';

        // 填充用户身份下拉框
        const userPersonaSelect = document.getElementById('chat-setting-user-persona');
        userPersonaSelect.innerHTML = '<option value="">-- 选择身份 --</option>';
        state.userPersonas.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name || '未命名身份';
            userPersonaSelect.appendChild(option);
        });
        
        // 选中当前设置的身份
        if (contact.userPersonaId) {
            userPersonaSelect.value = contact.userPersonaId;
        }

        document.getElementById('chat-settings-screen').classList.remove('hidden');
    }

    function handleClearChatHistory() {
        if (!state.currentChatContactId) return;
        
        if (confirm('确定要清空与该联系人的所有聊天记录吗？此操作不可恢复。')) {
            state.chatHistory[state.currentChatContactId] = [];
            saveConfig();
            renderChatHistory(state.currentChatContactId);
            alert('聊天记录已清空');
            document.getElementById('chat-settings-screen').classList.add('hidden');
        }
    }

    function handleSaveChatSettings() {
        if (!state.currentChatContactId) return;
        const contact = state.contacts.find(c => c.id === state.currentChatContactId);
        if (!contact) return;

        const remark = document.getElementById('chat-setting-remark').value;
        const persona = document.getElementById('chat-setting-persona').value;
        const userPersonaId = document.getElementById('chat-setting-user-persona').value;
        const avatarInput = document.getElementById('chat-setting-avatar');
        const myAvatarInput = document.getElementById('chat-setting-my-avatar');
        const bgInput = document.getElementById('chat-setting-bg');

        contact.remark = remark;
        contact.persona = persona;
        contact.userPersonaId = userPersonaId ? parseInt(userPersonaId) : null;
        document.getElementById('chat-title').textContent = remark || contact.name;

        const promises = [];

        if (avatarInput.files && avatarInput.files[0]) {
            promises.push(new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    contact.avatar = e.target.result;
                    resolve();
                };
                reader.readAsDataURL(avatarInput.files[0]);
            }));
        }

        if (myAvatarInput.files && myAvatarInput.files[0]) {
            promises.push(new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    contact.myAvatar = e.target.result;
                    resolve();
                };
                reader.readAsDataURL(myAvatarInput.files[0]);
            }));
        }

        if (bgInput.files && bgInput.files[0]) {
            promises.push(new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    contact.chatBg = e.target.result;
                    resolve();
                };
                reader.readAsDataURL(bgInput.files[0]);
            }));
        }

        Promise.all(promises).then(() => {
            saveConfig();
            renderContactList(); // 更新列表头像/备注
            renderChatHistory(contact.id); // 更新聊天记录头像
            
            // 更新背景
            const chatScreen = document.getElementById('chat-screen');
            if (contact.chatBg) {
                chatScreen.style.backgroundImage = `url(${contact.chatBg})`;
                chatScreen.style.backgroundSize = 'cover';
                chatScreen.style.backgroundPosition = 'center';
            } else {
                chatScreen.style.backgroundImage = '';
            }

            document.getElementById('chat-settings-screen').classList.add('hidden');
        });
    }

    function renderChatHistory(contactId) {
        const messages = state.chatHistory[contactId] || [];
        const container = document.getElementById('chat-messages');
        container.innerHTML = '';
        
        messages.forEach(msg => {
            appendMessageToUI(msg.content, msg.role === 'user');
        });
        
        scrollToBottom();
    }

    function sendMessage(text, isUser) {
        if (!state.currentChatContactId) return;
        
        // 保存消息
        if (!state.chatHistory[state.currentChatContactId]) {
            state.chatHistory[state.currentChatContactId] = [];
        }
        
        state.chatHistory[state.currentChatContactId].push({
            role: isUser ? 'user' : 'assistant',
            content: text
        });
        
        saveConfig(); // 简单起见，每次发送都保存
        
        appendMessageToUI(text, isUser);
        scrollToBottom();
    }

    function appendMessageToUI(text, isUser) {
        // 隐藏自动同步的评论消息和动态发布消息，但保留在历史记录中供AI读取
        if (text && typeof text === 'string') {
            if (text.startsWith('[评论了你的动态: "') || text.startsWith('[发布了动态]:')) {
                return;
            }
        }

        const container = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${isUser ? 'user' : 'other'}`;
        
        const contact = state.contacts.find(c => c.id === state.currentChatContactId);
        
        if (!isUser) {
            const avatar = contact ? contact.avatar : '';
            msgDiv.innerHTML = `
                <img src="${avatar}" class="chat-avatar">
                <div class="message-content">${text}</div>
            `;
        } else {
            let myAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
            
            // 优先使用聊天特定的设置
            if (contact && contact.myAvatar) {
                myAvatar = contact.myAvatar;
            } else if (state.currentUserPersonaId) {
                // 使用全局人设
                const p = state.userPersonas.find(p => p.id === state.currentUserPersonaId);
                if (p) myAvatar = p.avatar;
            }

            msgDiv.innerHTML = `
                <img src="${myAvatar}" class="chat-avatar">
                <div class="message-content">${text}</div>
            `;
        }
        
        container.appendChild(msgDiv);
    }

    function scrollToBottom() {
        const container = document.getElementById('chat-messages');
        container.scrollTop = container.scrollHeight;
    }

    async function generateAiReply() {
        if (!state.currentChatContactId) return;
        
        const contact = state.contacts.find(c => c.id === state.currentChatContactId);
        if (!contact) return;

        const settings = state.aiSettings.url ? state.aiSettings : state.aiSettings2;
        if (!settings.url || !settings.key) {
            alert('请先在设置中配置AI API');
            return;
        }

        const history = state.chatHistory[state.currentChatContactId] || [];
        
        // 获取当前用户人设信息
        let userPromptInfo = '';
        let currentPersona = null;

        // 优先使用聊天设置中指定的身份
        if (contact.userPersonaId) {
            currentPersona = state.userPersonas.find(p => p.id === contact.userPersonaId);
        }

        // 如果没有指定，或者找不到，则不发送特定人设信息，或者可以回退到全局资料卡名字
        if (currentPersona) {
            userPromptInfo = `\n用户(我)的网名：${currentPersona.name || '未命名'}`;
            if (currentPersona.aiPrompt) {
                userPromptInfo += `\n用户(我)的人设：${currentPersona.aiPrompt}`;
            }
        } else if (state.userProfile) {
             // 回退到全局资料卡名字，但不发送人设 Prompt
            userPromptInfo = `\n用户(我)的网名：${state.userProfile.name}`;
        }

        // 获取最近的朋友圈互动上下文
        let momentContext = '';
        const contactMoments = state.moments.filter(m => m.contactId === contact.id);
        if (contactMoments.length > 0) {
            // 按时间倒序，取最新的
            const lastMoment = contactMoments.sort((a, b) => b.time - a.time)[0];
            momentContext += `\n【朋友圈状态】\n你最新的一条朋友圈是：“${lastMoment.content}”\n`;
            
            if (lastMoment.comments && lastMoment.comments.length > 0) {
                // 查找用户的最新评论
                const userName = currentPersona ? currentPersona.name : state.userProfile.name;
                const userComments = lastMoment.comments.filter(c => c.user === userName);
                if (userComments.length > 0) {
                    const lastComment = userComments[userComments.length - 1];
                    momentContext += `用户刚刚评论了你的朋友圈：“${lastComment.content}”\n`;
                }
            }
        }

        // 构建 Prompt
        let systemPrompt = `你现在扮演 ${contact.name}。
人设：${contact.persona || '无'}
聊天风格：${contact.style || '正常'}
${userPromptInfo}
${momentContext}

你拥有一个“微信朋友圈”功能。
1. 当用户发送的消息格式为 '[评论了你的动态: "..."] ...' 时，表示用户在朋友圈评论了你的动态。请结合动态内容和用户的评论进行回复。
2. 当用户发送的消息格式为 '[发布了动态]: ...' 时，表示用户刚刚发了一条朋友圈。你可以根据人设决定是否去点赞或评论。

【指令说明】
- 如果你想发朋友圈，请在回复最后另起一行输出：MOMENT: 内容
- 如果你想给用户最新的动态点赞，请在回复最后另起一行输出：ACTION: LIKE_MOMENT
- 如果你想评论用户最新的动态，请在回复最后另起一行输出：ACTION: COMMENT_MOMENT: 评论内容

注意：
1. 指令必须在回复的最后，不要放在中间。
2. 正常回复应该自然，不要机械地说“我点赞了”。
3. 如果不想执行操作，就不要输出指令。

请回复对方的消息。保持简短，像微信聊天一样。
请生成 1 到 3 条回复，每条回复之间用 '|||' 分隔。不要包含其他解释性文字。`;

        // 添加世界书内容
        if (state.worldbook && state.worldbook.length > 0) {
            const activeEntries = state.worldbook.filter(e => e.enabled);
            if (activeEntries.length > 0) {
                systemPrompt += '\n\n世界书信息：\n';
                activeEntries.forEach(entry => {
                    // 简单匹配：如果历史记录中包含关键字，则添加内容
                    // 这里为了简化，直接添加所有启用的条目，或者可以做更复杂的匹配逻辑
                    // 考虑到上下文长度，这里简单添加所有启用的
                    systemPrompt += `${entry.content}\n`;
                });
            }
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map(h => ({ role: h.role, content: h.content }))
        ];

        // UI 显示正在输入...
        const titleEl = document.getElementById('chat-title');
        const originalTitle = titleEl.textContent;
        titleEl.textContent = '正在输入中...';

        try {
            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.key}`
                },
                body: JSON.stringify({
                    model: settings.model,
                    messages: messages,
                    temperature: settings.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            let replyContent = data.choices[0].message.content;

            // 解析朋友圈指令
            const momentRegex = /(?:^|\n)MOMENT:\s*([\s\S]*?)$/;
            const momentMatch = replyContent.match(momentRegex);
            
            if (momentMatch) {
                const momentContent = momentMatch[1].trim();
                if (momentContent) {
                    addMoment(contact.id, momentContent);
                }
                replyContent = replyContent.replace(momentMatch[0], '').trim();
            }

            // 解析点赞指令
            const likeRegex = /(?:^|\n)ACTION:\s*LIKE_MOMENT\s*$/;
            const likeMatch = replyContent.match(likeRegex);
            if (likeMatch) {
                // 查找用户最新的一条动态
                const userMoments = state.moments.filter(m => m.contactId === 'me');
                if (userMoments.length > 0) {
                    const latestMoment = userMoments.sort((a, b) => b.time - a.time)[0];
                    // 检查是否已经点赞
                    const aiName = contact.remark || contact.name;
                    if (!latestMoment.likes || !latestMoment.likes.includes(aiName)) {
                        toggleLike(latestMoment.id, aiName);
                    }
                }
                replyContent = replyContent.replace(likeMatch[0], '').trim();
            }

            // 解析评论指令
            const commentRegex = /(?:^|\n)ACTION:\s*COMMENT_MOMENT:\s*([\s\S]*?)$/;
            const commentMatch = replyContent.match(commentRegex);
            if (commentMatch) {
                const commentContent = commentMatch[1].trim();
                // 查找用户最新的一条动态
                const userMoments = state.moments.filter(m => m.contactId === 'me');
                if (userMoments.length > 0 && commentContent) {
                    const latestMoment = userMoments.sort((a, b) => b.time - a.time)[0];
                    const aiName = contact.remark || contact.name;
                    submitComment(latestMoment.id, commentContent, null, aiName);
                }
                replyContent = replyContent.replace(commentMatch[0], '').trim();
            }

            // 解析多条回复
            const replies = replyContent.split('|||').map(r => r.trim()).filter(r => r);

            for (const reply of replies) {
                await typewriterEffect(reply, contact.avatar);
                // 简单的延迟，让多条消息之间有间隔
                await new Promise(r => setTimeout(r, 500));
            }

        } catch (error) {
            console.error('AI生成失败:', error);
            alert('AI生成失败，请检查配置');
        } finally {
            // 恢复标题
            const currentContact = state.contacts.find(c => c.id === state.currentChatContactId);
            if (currentContact) {
                titleEl.textContent = currentContact.remark || currentContact.name;
            } else {
                titleEl.textContent = originalTitle;
            }
        }
    }

    function typewriterEffect(text, avatarUrl) {
        return new Promise(resolve => {
            const container = document.getElementById('chat-messages');
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message other';
            msgDiv.innerHTML = `
                <img src="${avatarUrl}" class="chat-avatar">
                <div class="message-content">${text}</div>
            `;
            container.appendChild(msgDiv);
            
            // 保存完整的消息到历史记录
            if (!state.chatHistory[state.currentChatContactId]) {
                state.chatHistory[state.currentChatContactId] = [];
            }
            state.chatHistory[state.currentChatContactId].push({
                role: 'assistant',
                content: text
            });
            saveConfig();
            
            scrollToBottom();
            resolve();
        });
    }

    // --- 字体功能 ---

    function handleFontUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const fontName = `CustomFont_${Date.now()}`;
            const fontFace = new FontFace(fontName, `url(${event.target.result})`);
            
            fontFace.load().then((loadedFace) => {
                document.fonts.add(loadedFace);
                addFontToState(fontName, event.target.result, 'local');
            }).catch(err => {
                console.error('字体加载失败:', err);
                alert('字体加载失败，请检查文件格式');
            });
        };
        reader.readAsDataURL(file);
    }

    function handleFontUrl() {
        const url = document.getElementById('font-url').value.trim();
        if (!url) return;

        const fontName = `WebFont_${Date.now()}`;
        const style = document.createElement('style');
        style.textContent = `@font-face { font-family: '${fontName}'; src: url('${url}'); }`;
        document.head.appendChild(style);
        
        addFontToState(fontName, url, 'url');
        document.getElementById('font-url').value = '';
    }

    function addFontToState(name, source, type) {
        state.fonts.push({ name, source, type });
        state.currentFont = name;
        applyFont(name);
        saveConfig();
    }

    function applyFont(fontName) {
        if (fontName === 'default') {
            document.documentElement.style.setProperty('--font-family', '-apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Helvetica, Arial, sans-serif');
        } else {
            const font = state.fonts.find(f => f.name === fontName);
            if (font) {
                if (font.type === 'local') {
                    const fontFace = new FontFace(font.name, `url(${font.source})`);
                    fontFace.load().then(loadedFace => {
                        document.fonts.add(loadedFace);
                        document.documentElement.style.setProperty('--font-family', fontName);
                    }).catch(() => {
                        document.documentElement.style.setProperty('--font-family', fontName);
                    });
                } else {
                    if (!document.getElementById(`style-${font.name}`)) {
                        const style = document.createElement('style');
                        style.id = `style-${font.name}`;
                        style.textContent = `@font-face { font-family: '${font.name}'; src: url('${font.source}'); }`;
                        document.head.appendChild(style);
                    }
                    document.documentElement.style.setProperty('--font-family', fontName);
                }
            }
        }
    }

    function handleDeleteFont() {
        if (state.currentFont === 'default') return;
        state.fonts = state.fonts.filter(f => f.name !== state.currentFont);
        state.currentFont = 'default';
        applyFont('default');
        saveConfig();
    }

    // --- 字体预设功能 ---

    function handleSaveFontPreset() {
        const name = prompt('请输入字体预设名称：');
        if (!name) return;
        
        const preset = {
            name: name,
            font: state.currentFont
        };
        
        state.fontPresets.push(preset);
        saveConfig();
        renderFontPresets();
        document.getElementById('font-preset-select').value = name;
        alert('字体预设已保存');
    }

    function handleDeleteFontPreset() {
        const select = document.getElementById('font-preset-select');
        const name = select.value;
        if (!name) return;
        
        if (confirm(`确定要删除预设 "${name}" 吗？`)) {
            state.fontPresets = state.fontPresets.filter(p => p.name !== name);
            saveConfig();
            renderFontPresets();
        }
    }

    function handleApplyFontPreset(e) {
        const name = e.target.value;
        if (!name) return;
        
        const preset = state.fontPresets.find(p => p.name === name);
        if (preset) {
            state.currentFont = preset.font;
            applyFont(state.currentFont);
            saveConfig();
        }
    }

    function renderFontPresets() {
        const select = document.getElementById('font-preset-select');
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- 选择预设 --</option>';
        
        if (state.fontPresets) {
            state.fontPresets.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.name;
                option.textContent = preset.name;
                select.appendChild(option);
            });
        }
        
        // 尝试恢复选中状态
        if (currentValue && state.fontPresets.some(p => p.name === currentValue)) {
            select.value = currentValue;
        }
    }

    // --- 壁纸功能 ---

    function handleWallpaperUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const wallpaper = {
                id: Date.now(),
                data: event.target.result
            };
            state.wallpapers.push(wallpaper);
            state.currentWallpaper = wallpaper.id;
            applyWallpaper(wallpaper.id);
            renderWallpaperGallery();
            saveConfig();
        };
        reader.readAsDataURL(file);
    }

    function renderWallpaperGallery() {
        const gallery = document.getElementById('wallpaper-gallery');
        if (!gallery) return;
        
        gallery.innerHTML = '';
        
        state.wallpapers.forEach(wp => {
            const item = document.createElement('div');
            item.className = `gallery-item ${state.currentWallpaper === wp.id ? 'selected' : ''}`;
            item.innerHTML = `
                <img src="${wp.data}" alt="Wallpaper">
                <button class="delete-wp-btn" data-id="${wp.id}">&times;</button>
            `;
            
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-wp-btn')) {
                    deleteWallpaper(wp.id);
                } else {
                    state.currentWallpaper = wp.id;
                    applyWallpaper(wp.id);
                    renderWallpaperGallery();
                    saveConfig();
                }
            });
            
            gallery.appendChild(item);
        });
    }

    function deleteWallpaper(id) {
        state.wallpapers = state.wallpapers.filter(wp => wp.id !== id);
        if (state.currentWallpaper === id) {
            state.currentWallpaper = null;
            applyWallpaper(null);
        }
        renderWallpaperGallery();
        saveConfig();
    }

    function applyWallpaper(id) {
        if (!id) {
            document.documentElement.style.setProperty('--wallpaper', 'none');
            return;
        }
        const wp = state.wallpapers.find(w => w.id === id);
        if (wp) {
            document.documentElement.style.setProperty('--wallpaper', `url(${wp.data})`);
        }
    }

    // --- 图标功能 ---

    function renderIconSettings() {
        const list = document.getElementById('icon-setting-list');
        if (!list) return;
        
        list.innerHTML = '';

        appList.forEach(app => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            const currentIcon = state.icons[app.id];
            let previewContent = '';
            
            // 安全地获取预览内容
            if (currentIcon) {
                previewContent = `<img src="${currentIcon}">`;
            } else {
                const el = document.querySelector(app.selector + ' i');
                if (el) {
                    previewContent = `<i class="${el.className}"></i>`;
                } else {
                    // 如果找不到i标签（可能已经被替换为img但state中没有记录），尝试恢复默认
                    previewContent = '<i class="fas fa-question"></i>';
                }
            }

            item.innerHTML = `
                <div class="icon-row">
                    <div class="icon-preview-small" id="preview-${app.id}">
                        ${previewContent}
                    </div>
                    <div class="icon-info">${app.name}</div>
                    <div class="icon-actions">
                        <input type="file" id="upload-${app.id}" accept="image/*" class="file-input-hidden">
                        <label for="upload-${app.id}" class="ios-btn">更换</label>
                        ${currentIcon ? `<button class="ios-btn-small danger" onclick="resetAppIcon('${app.id}')">还原</button>` : ''}
                    </div>
                </div>
            `;

            // 绑定上传事件
            const input = item.querySelector('input');
            input.addEventListener('change', (e) => handleIconUpload(e, app.id));
            
            // 绑定还原事件
            const resetBtn = item.querySelector('button');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => resetAppIcon(app.id));
            }

            list.appendChild(item);
        });
    }

    function handleIconUpload(e, appId) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            state.icons[appId] = event.target.result;
            applyIcons();
            renderIconSettings();
            saveConfig();
        };
        reader.readAsDataURL(file);
    }

    window.resetAppIcon = function(appId) {
        delete state.icons[appId];
        applyIcons();
        renderIconSettings();
        saveConfig();
    };

    function applyIcons() {
        appList.forEach(app => {
            const el = document.querySelector(app.selector);
            if (!el) return;
            
            const iconData = state.icons[app.id];
            
            if (iconData) {
                el.innerHTML = `<img src="${iconData}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--icon-radius);">`;
                el.style.background = 'transparent';
            } else {
                const originalIcons = {
                    'icon-envelope': 'fas fa-envelope',
                    'icon-wechat': 'fab fa-weixin',
                    'icon-world': 'fas fa-globe',
                    'icon-settings': 'fas fa-cog',
                    'icon-theme': 'fas fa-paint-brush',
                    'icon-shopping': 'fas fa-shopping-bag',
                    'icon-forum': 'fas fa-comments',
                    'icon-phone': 'fas fa-mobile-alt'
                };
                el.innerHTML = `<i class="${originalIcons[app.id]}"></i>`;
                el.style.background = '';
            }
        });
    }

    // --- CSS功能 ---

    function applyCSS(cssContent) {
        let styleEl = document.getElementById('custom-user-css');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'custom-user-css';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = cssContent;
    }

    function exportCSS() {
        const blob = new Blob([state.css], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'custom-theme.css';
        a.click();
        URL.revokeObjectURL(url);
    }

    // --- CSS预设功能 ---

    function handleSaveCssPreset() {
        const name = prompt('请输入CSS预设名称：');
        if (!name) return;
        
        const cssContent = document.getElementById('css-editor').value;
        
        const preset = {
            name: name,
            css: cssContent
        };
        
        state.cssPresets.push(preset);
        saveConfig();
        renderCssPresets();
        document.getElementById('css-preset-select').value = name;
        alert('CSS预设已保存');
    }

    function handleDeleteCssPreset() {
        const select = document.getElementById('css-preset-select');
        const name = select.value;
        if (!name) return;
        
        if (confirm(`确定要删除预设 "${name}" 吗？`)) {
            state.cssPresets = state.cssPresets.filter(p => p.name !== name);
            saveConfig();
            renderCssPresets();
        }
    }

    function handleApplyCssPreset(e) {
        const name = e.target.value;
        if (!name) return;
        
        const preset = state.cssPresets.find(p => p.name === name);
        if (preset) {
            state.css = preset.css;
            document.getElementById('css-editor').value = state.css;
            applyCSS(state.css);
            saveConfig();
        }
    }

    function renderCssPresets() {
        const select = document.getElementById('css-preset-select');
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- 选择预设 --</option>';
        
        if (state.cssPresets) {
            state.cssPresets.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.name;
                option.textContent = preset.name;
                select.appendChild(option);
            });
        }
        
        if (currentValue && state.cssPresets.some(p => p.name === currentValue)) {
            select.value = currentValue;
        }
    }

    // --- AI 设置功能 ---

    async function handleFetchModels(isSecondary = false) {
        const suffix = isSecondary ? '-2' : '';
        const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
        
        const url = state[settingsKey].url;
        const key = state[settingsKey].key;

        if (!url) {
            alert('请先输入API地址');
            return;
        }

        const btn = document.getElementById(`fetch-models${suffix}`);
        const originalText = btn.textContent;
        btn.textContent = '拉取中...';
        btn.disabled = true;

        try {
            // 尝试适配不同的API格式，通常是 /v1/models
            let fetchUrl = url;
            if (!fetchUrl.endsWith('/models')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'models' : fetchUrl + '/models';
            }

            const headers = {};
            if (key) {
                headers['Authorization'] = `Bearer ${key}`;
            }

            const response = await fetch(fetchUrl, { headers });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const models = data.data || data.models || []; // 适配不同API返回格式

            const select = document.getElementById(`ai-model-select${suffix}`);
            select.innerHTML = '<option value="">请选择模型</option>';
            
            models.forEach(model => {
                const id = model.id || model;
                const option = document.createElement('option');
                option.value = id;
                option.textContent = id;
                select.appendChild(option);
            });

            alert(`成功获取 ${models.length} 个模型`);
            
            // 如果当前有选中的模型，尝试恢复
            if (state[settingsKey].model) {
                select.value = state[settingsKey].model;
            }

        } catch (error) {
            console.error('获取模型失败:', error);
            alert('获取模型失败，请检查API地址和密钥是否正确，或跨域设置。');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    function handleSaveAiPreset(isSecondary = false) {
        const suffix = isSecondary ? '-2' : '';
        const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
        const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
        
        const name = prompt('请输入AI配置预设名称：');
        if (!name) return;

        const preset = {
            name: name,
            settings: { ...state[settingsKey] }
        };

        state[presetsKey].push(preset);
        saveConfig();
        renderAiPresets(isSecondary);
        document.getElementById(`ai-preset-select${suffix}`).value = name;
        alert('AI预设已保存');
    }

    function handleDeleteAiPreset(isSecondary = false) {
        const suffix = isSecondary ? '-2' : '';
        const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
        
        const select = document.getElementById(`ai-preset-select${suffix}`);
        const name = select.value;
        if (!name) return;

        if (confirm(`确定要删除预设 "${name}" 吗？`)) {
            state[presetsKey] = state[presetsKey].filter(p => p.name !== name);
            saveConfig();
            renderAiPresets(isSecondary);
        }
    }

    function handleApplyAiPreset(e, isSecondary = false) {
        const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
        const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
        
        const name = e.target.value;
        if (!name) return;

        const preset = state[presetsKey].find(p => p.name === name);
        if (preset) {
            state[settingsKey] = { ...preset.settings };
            updateAiUi(isSecondary);
            saveConfig();
        }
    }

    function renderAiPresets(isSecondary = false) {
        const suffix = isSecondary ? '-2' : '';
        const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
        
        const select = document.getElementById(`ai-preset-select${suffix}`);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">-- 选择预设 --</option>';

        if (state[presetsKey]) {
            state[presetsKey].forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.name;
                option.textContent = preset.name;
                select.appendChild(option);
            });
        }

        if (currentValue && state[presetsKey].some(p => p.name === currentValue)) {
            select.value = currentValue;
        }
    }

    function updateAiUi(isSecondary = false) {
        const suffix = isSecondary ? '-2' : '';
        const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
        
        const urlInput = document.getElementById(`ai-api-url${suffix}`);
        const keyInput = document.getElementById(`ai-api-key${suffix}`);
        const modelSelect = document.getElementById(`ai-model-select${suffix}`);
        const tempInput = document.getElementById(`ai-temperature${suffix}`);
        const tempValue = document.getElementById(`ai-temp-value${suffix}`);

        if (urlInput) urlInput.value = state[settingsKey].url || '';
        if (keyInput) keyInput.value = state[settingsKey].key || '';
        if (tempInput) tempInput.value = state[settingsKey].temperature || 0.7;
        if (tempValue) tempValue.textContent = state[settingsKey].temperature || 0.7;
        
        // 模型下拉框可能需要重新拉取才能显示正确，这里只能先设置值，如果option不存在则显示为空
        if (modelSelect && state[settingsKey].model) {
            // 如果下拉框里没有这个模型，添加一个临时的
            if (!modelSelect.querySelector(`option[value="${state[settingsKey].model}"]`)) {
                const option = document.createElement('option');
                option.value = state[settingsKey].model;
                option.textContent = state[settingsKey].model;
                modelSelect.appendChild(option);
            }
            modelSelect.value = state[settingsKey].model;
        }
    }

    // --- 数据管理 ---

    function saveConfig() {
        try {
            localStorage.setItem('iphoneSimConfig', JSON.stringify(state));
        } catch (e) {
            alert('存储空间不足，无法保存所有数据（可能是图片太大）。建议减少壁纸或图标数量。');
            console.error(e);
        }
    }

    function loadConfig() {
        const saved = localStorage.getItem('iphoneSimConfig');
        if (saved) {
            try {
                const loadedState = JSON.parse(saved);
                Object.assign(state, loadedState);
                
                // 确保预设数组存在
                if (!state.fontPresets) state.fontPresets = [];
                if (!state.cssPresets) state.cssPresets = [];
                if (!state.aiSettings) state.aiSettings = { url: '', key: '', model: '', temperature: 0.7 };
                if (!state.aiPresets) state.aiPresets = [];
                if (!state.aiSettings2) state.aiSettings2 = { url: '', key: '', model: '', temperature: 0.7 };
                if (!state.aiPresets2) state.aiPresets2 = [];
                if (!state.contacts) state.contacts = [];
                if (!state.chatHistory) state.chatHistory = {};
                if (!state.worldbook) state.worldbook = [];
                if (!state.userPersonas) state.userPersonas = [];
                if (!state.moments) state.moments = [];
                
                const cssEditor = document.getElementById('css-editor');
                if (cssEditor) cssEditor.value = state.css;
                
                applyFont(state.currentFont);
                applyWallpaper(state.currentWallpaper);
                applyIcons();
                applyCSS(state.css);
                
                renderFontPresets();
                renderCssPresets();
                renderAiPresets();
                renderAiPresets(true);
                updateAiUi();
                updateAiUi(true);
                renderContactList();
                renderWorldbookList();
                renderMeTab();
                renderMoments();
            } catch (e) {
                console.error('解析配置失败:', e);
            }
        }
    }

    function exportJSON() {
        const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'iphone-sim-config.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function importJSON(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const loadedState = JSON.parse(event.target.result);
                Object.assign(state, loadedState);
                
                // 确保预设数组存在
                if (!state.fontPresets) state.fontPresets = [];
                if (!state.cssPresets) state.cssPresets = [];
                if (!state.aiSettings) state.aiSettings = { url: '', key: '', model: '', temperature: 0.7 };
                if (!state.aiPresets) state.aiPresets = [];
                if (!state.aiSettings2) state.aiSettings2 = { url: '', key: '', model: '', temperature: 0.7 };
                if (!state.aiPresets2) state.aiPresets2 = [];
                if (!state.contacts) state.contacts = [];
                if (!state.chatHistory) state.chatHistory = {};
                if (!state.worldbook) state.worldbook = [];
                if (!state.userPersonas) state.userPersonas = [];
                if (!state.moments) state.moments = [];
                
                const cssEditor = document.getElementById('css-editor');
                if (cssEditor) cssEditor.value = state.css;
                
                applyFont(state.currentFont);
                applyWallpaper(state.currentWallpaper);
                applyIcons();
                applyCSS(state.css);
                renderWallpaperGallery();
                renderIconSettings();
                renderFontPresets();
                renderCssPresets();
                renderAiPresets();
                renderAiPresets(true);
                updateAiUi();
                updateAiUi(true);
                renderContactList();
                renderWorldbookList();
                renderMeTab();
                renderMoments();
                
                saveConfig();
                alert('配置导入成功');
            } catch (err) {
                alert('配置文件格式错误');
                console.error(err);
            }
        };
        reader.readAsText(file);
    }
});
