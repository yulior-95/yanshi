const TradeVerification = (() => {
    const STORAGE_KEY = 'tradeVerificationMethod';
    const METHOD_LABELS = {
        google: '谷歌交易验证',
        phone: '手机交易验证',
        email: '邮箱交易验证'
    };

    function getMethod() {
        const value = localStorage.getItem(STORAGE_KEY);
        if (value === 'google' || value === 'phone' || value === 'email') {
            return value;
        }
        localStorage.setItem(STORAGE_KEY, 'phone');
        return 'phone';
    }

    function setMethod(method) {
        localStorage.setItem(STORAGE_KEY, method);
    }

    function label(method) {
        return METHOD_LABELS[method] || '当前验证方式';
    }

    function showModal(options) {
        const modal = document.getElementById('confirmModal');
        const title = document.getElementById('confirmTitle');
        const message = document.getElementById('confirmMessage');
        const cancelBtn = document.getElementById('cancelSwitchBtn');
        const confirmBtn = document.getElementById('confirmSwitchBtn');

        title.textContent = options.title;
        message.textContent = options.message;
        confirmBtn.textContent = options.confirmText || '确认';
        modal.classList.add('show');

        const onCancel = () => {
            cleanup();
            if (typeof options.onCancel === 'function') {
                options.onCancel();
            }
        };

        const onConfirm = () => {
            cleanup();
            if (typeof options.onConfirm === 'function') {
                options.onConfirm();
            }
        };

        function cleanup() {
            cancelBtn.removeEventListener('click', onCancel);
            confirmBtn.removeEventListener('click', onConfirm);
            modal.classList.remove('show');
        }

        cancelBtn.addEventListener('click', onCancel);
        confirmBtn.addEventListener('click', onConfirm);
    }

    function showToast(text) {
        const toast = document.getElementById('toast');
        if (!toast) {
            return;
        }
        toast.textContent = text;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
    }

    function bindToggle(options) {
        const toggle = document.getElementById(options.toggleId);
        const statusEl = document.getElementById(options.statusId);
        const method = options.method;
        const current = getMethod();
        toggle.checked = current === method;
        statusEl.textContent = toggle.checked ? '已开启' : '未开启';
        statusEl.classList.toggle('active', toggle.checked);

        toggle.addEventListener('change', () => {
            const latest = getMethod();
            if (toggle.checked) {
                if (latest !== method) {
                    showModal({
                        title: '切换交易验证方式',
                        message: `当前已开启${label(latest)}。确认后将关闭当前方式，并开启${label(method)}。`,
                        confirmText: '确认切换',
                        onCancel: () => {
                            toggle.checked = false;
                        },
                        onConfirm: () => {
                            setMethod(method);
                            toggle.checked = true;
                            statusEl.textContent = '已开启';
                            statusEl.classList.add('active');
                            showToast(`${label(method)}已开启`);
                        }
                    });
                } else {
                    statusEl.textContent = '已开启';
                    statusEl.classList.add('active');
                }
                return;
            }

            if (latest === method) {
                toggle.checked = true;
                showToast('交易验证方式必须至少开启一种');
                return;
            }
            statusEl.textContent = '未开启';
            statusEl.classList.remove('active');
        });
    }

    return {
        getMethod,
        setMethod,
        label,
        bindToggle,
        showToast
    };
})();
