/**
 * SPECTRA - Viewfinder OSD & Thumb-wheel (v1.7)
 */

class ThumbDial {
    constructor(id, data, onActiveChange, onEndDrag) {
        this.container = document.getElementById(id);
        this.data = data;
        this.onActiveChange = onActiveChange;
        this.onEndDrag = onEndDrag;
        this.radius = 180; 
        this.anglePerItem = 25; // Wider angle for spacing out items
        this.currentRotation = 0;
        this.startX = 0;
        this.isDragging = false;
        this.lastVibratedIdx = 0;
        this.init();
    }

    init() {
        this.data.forEach((v, i) => {
            const item = document.createElement('div');
            item.className = 'wheel-item';
            item.innerText = v;
            const angle = i * this.anglePerItem;
            item.style.transform = `rotateY(${angle}deg) translateZ(${this.radius}px)`;
            this.container.appendChild(item);
        });

        const parent = this.container.parentElement;
        parent.addEventListener('touchstart', e => this.onStart(e), {passive: false});
        window.addEventListener('touchmove', e => this.onMove(e), {passive: false});
        window.addEventListener('touchend', () => this.onEnd(), {passive: false});
        
        parent.addEventListener('mousedown', e => this.onStart(e));
        window.addEventListener('mousemove', e => this.onMove(e));
        window.addEventListener('mouseup', () => this.onEnd());

        this.updateWheel();
    }

    onStart(e) { 
        this.isDragging = true; 
        this.startX = e.touches ? e.touches[0].pageX : e.pageX; 
        this.startRotation = this.currentRotation; 
        this.lastVibratedIdx = Math.round(this.currentRotation / this.anglePerItem);
    }
    onMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        const delta = (this.startX - (e.touches ? e.touches[0].pageX : e.pageX)) * 0.55;
        let targetRot = this.startRotation + delta;
        const maxRot = (this.data.length - 1) * this.anglePerItem;
        if (targetRot < -15) targetRot = -15;
        if (targetRot > maxRot + 15) targetRot = maxRot + 15;
        this.currentRotation = targetRot;
        this.updateWheel();
        
        let idx = Math.round(this.currentRotation / this.anglePerItem);
        idx = Math.max(0, Math.min(idx, this.data.length - 1));
        if (this.lastVibratedIdx !== idx && window.navigator.vibrate) {
            window.navigator.vibrate(5);
            this.lastVibratedIdx = idx;
            this.onActiveChange(this.data[idx]);
        }
    }
    onEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        let idx = Math.round(this.currentRotation / this.anglePerItem);
        idx = Math.max(0, Math.min(idx, this.data.length - 1));
        this.currentRotation = idx * this.anglePerItem;
        this.updateWheel();
        
        this.onEndDrag(this.data[idx]);
    }
    updateWheel() {
        this.container.style.transform = `rotateY(${-this.currentRotation}deg)`;
        const activeIdx = Math.round(this.currentRotation / this.anglePerItem);
        const clampedIdx = Math.max(0, Math.min(activeIdx, this.data.length - 1));
        Array.from(this.container.children).forEach((child, i) => {
            child.classList.toggle('active', i === clampedIdx);
            const diff = Math.abs(i - (this.currentRotation / this.anglePerItem));
            if (diff < 0.5) child.style.opacity = 1;
            else if (diff < 1.5) child.style.opacity = 0.8;
            else if (diff < 2.5) child.style.opacity = 0.3;
            else child.style.opacity = 0;
        });
    }
}

class RadialFilmWheel {
    constructor(triggerId, containerId, wheelId, onChange) {
        this.trigger = document.getElementById(triggerId);
        this.container = document.getElementById(containerId);
        this.wheel = document.getElementById(wheelId);
        this.onChange = onChange;
        this.items = Array.from(this.wheel.children);
        this.anglePerItem = 35; // Widened spacing
        this.currentRotation = 0;
        this.startY = 0;
        this.isDragging = false;
        this.lastVibratedIdx = 0;
        this.hideTimer = null;
        this.init();
    }

    init() {
        this.items.forEach((item, i) => {
            const angle = (i * this.anglePerItem) - 45; // Center the arc
            item.style.transform = `rotate(${angle}deg)`;
        });

        this.trigger.addEventListener('touchstart', e => this.onStart(e), {passive: false});
        window.addEventListener('touchmove', e => this.onMove(e), {passive: false});
        window.addEventListener('touchend', () => this.onEnd(), {passive: false});
        
        this.trigger.addEventListener('mousedown', e => this.onStart(e));
        window.addEventListener('mousemove', e => this.onMove(e));
        window.addEventListener('mouseup', () => this.onEnd());
    }

    onStart(e) {
        this.isDragging = true;
        this.startY = e.touches ? e.touches[0].pageY : e.pageY;
        this.startRotation = this.currentRotation;
        this.lastVibratedIdx = Math.round(-this.currentRotation / this.anglePerItem);
        clearTimeout(this.hideTimer);
        this.container.classList.remove('film-dial-hidden');
        this.container.classList.add('film-dial-visible');
    }

    onMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        const y = e.touches ? e.touches[0].pageY : e.pageY;
        // Flipped delta to match standard physical scroll direction
        const delta = (this.startY - y) * 0.45; 
        this.currentRotation = this.startRotation + delta;
        this.updateWheel();
        
        const idx = Math.round(-this.currentRotation / this.anglePerItem);
        if (this.lastVibratedIdx !== idx && window.navigator.vibrate) {
            window.navigator.vibrate(5);
            this.lastVibratedIdx = idx;
        }
    }

    onEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        const idx = Math.round(-this.currentRotation / this.anglePerItem);
        const clamped = Math.max(0, Math.min(idx, this.items.length - 1));
        this.currentRotation = -clamped * this.anglePerItem;
        this.updateWheel();
        this.onChange(this.items[clamped].dataset.filter, this.items[clamped].innerText);
        
        this.hideTimer = setTimeout(() => {
            this.container.classList.remove('film-dial-visible');
            this.container.classList.add('film-dial-hidden');
        }, 1500);
    }

    updateWheel() {
        this.wheel.style.transform = `rotate(${this.currentRotation}deg)`;
        const activeIdx = Math.round(-this.currentRotation / this.anglePerItem);
        this.items.forEach((item, i) => item.classList.toggle('active', i === activeIdx));
    }
}

const App = {
    state: {
        lang: 'en',
        iso: 'AUTO', ss: 'AUTO', f: 'AUTO',
        ev: 8,
        filter: 'provia',
        wb: 50, // 0-100 => 2000K - 10000K
        isLocked: false,
        onboardingStep: 0
    },

    init() {
        this.cacheElements();
        this.bindGlobalEvents();
        this.elements.langModal.style.display = 'flex';
        this.setupOrientation();
    },

    cacheElements() {
        this.elements = {
            video: document.getElementById('camera-feed'),
            needle: document.getElementById('exposure-needle'),
            toast: document.getElementById('toast-inner'),
            shutter: document.getElementById('shutter-btn'),
            filmDial: document.getElementById('film-dial'),
            filmArea: document.getElementById('film-area'),
            langModal: document.getElementById('lang-modal'),
            helpBtn: document.getElementById('help-btn'),
            langBtn: document.getElementById('lang-entry-btn'),
            wbArea: document.getElementById('wb-area'),
            wbBar: document.getElementById('wb-slider-bar'),
            wbThumb: document.getElementById('wb-thumb'),
            wbKelvin: document.getElementById('wb-kelvin'),
            level: document.getElementById('spirit-level'),
            onboardingOverlay: document.getElementById('onboarding-overlay'),
            guideText: document.getElementById('guide-text'),
            guidePrev: document.getElementById('guide-prev'),
            guideNext: document.getElementById('guide-next'),
            spotlight: document.getElementById('spotlight-shape'),
            guideCard: document.getElementById('guide-card')
        };
    },

    getEffectMessage(type, val) {
        const ko = this.state.lang === 'ko';
        if (type === 'ISO') {
            const num = parseInt(val);
            if (num <= 200) return ko ? `${val} (최고 화질)` : `${val} (Highest Quality)`;
            if (num >= 3200) return ko ? `${val} (노이즈 증가)` : `${val} (Increased Noise)`;
            return val;
        }
        if (type === 'SS') {
            if (val === 'B') return ko ? `벌브 (무한개방)` : `Bulb (Hold Shutter)`;
            const isSeconds = val.includes('s');
            const num = isSeconds ? parseInt(val) : parseInt(val.split('/')[1]);
            if (!isSeconds && num >= 500) return ko ? `${val} (모션 프리즈)` : `${val} (Freeze Motion)`;
            if (isSeconds || (!isSeconds && num <= 60)) return ko ? `${val} (모션 블러)` : `${val} (Motion Blur)`;
            return val;
        }
        if (type === 'A') {
            const num = parseFloat(val);
            if (num <= 2.8) return ko ? `F${val} (아웃포커싱/밝음)` : `F${val} (Bokeh/Bright)`;
            if (num >= 8.0) return ko ? `F${val} (팬포커스/어두움)` : `F${val} (Deep Focus/Dark)`;
            return `F${val}`;
        }
        if (type === 'WB') {
            if (val >= 6500) return ko ? `${val}K (따뜻한 톤)` : `${val}K (Warm Tone)`;
            if (val <= 4000) return ko ? `${val}K (차가운 톤)` : `${val}K (Cool Tone)`;
            return ko ? `${val}K (주광)` : `${val}K (Daylight)`;
        }
        return val;
    },

    bindGlobalEvents() {
        document.querySelectorAll('.modal-btns button').forEach(btn => {
            btn.onclick = () => {
                this.state.lang = btn.dataset.lang;
                this.elements.langModal.style.display = 'none';
                this.startApp();
                this.startOnboarding();
            };
        });
        this.elements.helpBtn.onclick = () => this.startOnboarding();
        this.elements.langBtn.onclick = () => this.elements.langModal.style.display = 'flex';
        
        this.elements.guideNext.onclick = () => {
            this.state.onboardingStep++;
            if (this.state.onboardingStep > 5) this.finishOnboarding();
            else this.updateOnboardingStep();
        };
        this.elements.guidePrev.onclick = () => {
            if (this.state.onboardingStep > 0) {
                this.state.onboardingStep--;
                this.updateOnboardingStep();
            }
        };
    },

    startApp() {
        this.setupDials();
        this.setupFilmWheel();
        this.setupWBSlider();
        this.setupCamera();
        this.setupShutter();
        this.toast(this.state.lang === 'ko' ? "시스템 준비 완료" : "SYSTEM READY");
    },

    setupDials() {
        const update = (k, v) => { this.state[k] = v; this.calculateExposure(); };
        const toastEnd = (type, v) => { if(v !== 'AUTO') this.toast(`${type} ${this.getEffectMessage(type, v)}`); else this.toast(`${type} AUTO`); };

        new ThumbDial('iso-wheel', ['AUTO','100','200','400','800','1600','3200','6400'], 
            v => update('iso', v), v => toastEnd('ISO', v)
        );
        new ThumbDial('ss-wheel', ['AUTO','1/4000','1/2000','1/1000','1/500','1/250','1/125','1/60','1/30','1/15','1/8','1/4','1/2','1s','2s','4s','8s','15s','30s','B'], 
            v => update('ss', v), v => toastEnd('SS', v)
        );
        new ThumbDial('f-wheel', ['AUTO','1.4','1.8','2.0','2.8','4.0','5.6','8.0','11','16'], 
            v => update('f', v), v => toastEnd('A', v)
        );
    },

    setupFilmWheel() {
        new RadialFilmWheel('film-area', 'film-dial', 'film-internal-wheel', (filter, name) => {
            this.state.filter = filter;
            if (this.elements.filterLabel) this.elements.filterLabel.innerText = name;
            this.toast(name);
            this.applyEffects();
        });
    },

    setupWBSlider() {
        let startY = 0;
        let isDrag = false;
        let hideT;
        const area = this.elements.wbArea;
        const start = (e) => { startY = e.touches?.[0].pageY || e.pageY; isDrag = true; this.elements.wbBar.className='wb-bar-visible'; clearTimeout(hideT); };
        const move = (e) => {
            if(!isDrag) return;
            e.preventDefault();
            const y = e.touches?.[0].pageY || e.pageY;
            this.state.wb = Math.max(0, Math.min(100, this.state.wb + (startY - y)/1.5));
            this.elements.wbThumb.style.bottom = `${this.state.wb}%`;
            // Calc Kelvin
            const k = Math.round(2000 + (this.state.wb * 80));
            this.elements.wbKelvin.innerText = `${k}K`;
            startY = y;
            this.applyEffects();
        };
        const end = () => { 
            isDrag = false; 
            hideT = setTimeout(()=>this.elements.wbBar.className='wb-bar-hidden', 1500); 
            const k = Math.round(2000 + (this.state.wb * 80));
            this.toast(`WB: ${this.getEffectMessage('WB', k)}`);
        };
        area.addEventListener('touchstart', start, {passive:false});
        window.addEventListener('touchmove', move, {passive:false});
        window.addEventListener('touchend', end);
    },

    // --- Hardware Sensors ---
    setupOrientation() {
        window.addEventListener('deviceorientation', e => {
            if (e.gamma === null) return;
            let tilt = -e.gamma; // default portrait
            const angle = (screen.orientation || {}).angle || window.orientation || 0;
            
            if (angle === 90) tilt = -e.beta;
            else if (angle === -90 || angle === 270) tilt = e.beta;
            else if (angle === 180) tilt = e.gamma;
            
            if (this.targetTilt === undefined) this.currentTilt = tilt;
            this.targetTilt = tilt;
        });

        // Smooth rotation using rAF
        const smoothLevel = () => {
            if (this.currentTilt !== undefined && this.targetTilt !== undefined) {
                // Lerp formula
                this.currentTilt = this.currentTilt * 0.85 + this.targetTilt * 0.15;
                if (this.elements.level) {
                    this.elements.level.style.transform = `rotate(${this.currentTilt}deg)`;
                }
            }
            requestAnimationFrame(smoothLevel);
        };
        smoothLevel();
    },

    async setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    focusMode: "continuous" 
                } 
            });
            this.elements.video.srcObject = stream;
            this.startAnalysis();
        } catch (e) { this.toast("CAMERA ERROR"); }
    },

    startAnalysis() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const loop = () => {
            if (this.elements.video.readyState === this.elements.video.HAVE_ENOUGH_DATA && !this.state.isLocked) {
                canvas.width = 100; canvas.height = 100;
                ctx.drawImage(this.elements.video, 0, 0, 100, 100);
                const data = ctx.getImageData(0, 0, 100, 100).data;
                let b = 0;
                let pixels = 0;
                // Check every 4th pixel for speed
                for (let i = 0; i < data.length; i += 16) {
                    b += (0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]);
                    pixels++;
                }
                const avgLuma = b / pixels; // 0 to 255
                
                // Smartphone cameras auto-expose natively to avgLuma ~ 127
                // This means typical indoor lighting yields luma 127.
                // We linearly map this to absolute EV (Luma 0 => EV 1, Luma 255 => EV 16)
                // Result: Indoors (Luma~127) => EV 8.5, which is physically accurate.
                this.state.ev = ((avgLuma / 255) * 15 + 1).toFixed(1);
                this.calculateExposure();
            }
            requestAnimationFrame(loop);
        };
        loop();
    },

    calculateExposure() {
        let N = this.state.f === 'AUTO' ? null : parseFloat(this.state.f);
        let tStr = this.state.ss;
        let t = null;
        if (tStr !== 'AUTO') {
            if (tStr === 'B') t = 30; // Treat Bulb as 30s base for live meter
            else if (tStr.includes('s')) t = parseInt(tStr);
            else t = 1 / parseInt(tStr.split('/')[1]);
        }
        let iso = this.state.iso === 'AUTO' ? null : parseInt(this.state.iso);

        // Program Mode logic (fallback sequence)
        if (N === null && t === null && iso === null) { iso = 400; N = 4.0; }
        if (N === null && t === null) { N = 4.0; }
        if (N === null && iso === null) { iso = 400; }
        if (t === null && iso === null) { iso = 400; }

        let ev = Math.max(0, parseFloat(this.state.ev) || 8);
        const C = Math.pow(2, ev);

        let dynamicISO = iso;
        let dynamicSS = t;
        let dynamicF = N;

        if (iso === null) {
            dynamicISO = (N * N * 100) / (t * C);
            dynamicISO = Math.max(100, Math.min(12800, dynamicISO));
        } else if (t === null) {
            dynamicSS = (N * N * 100) / (iso * C);
            dynamicSS = Math.max(1/4000, Math.min(2, dynamicSS));
        } else if (N === null) {
            dynamicF = Math.sqrt((t * iso * C) / 100);
            dynamicF = Math.max(1.4, Math.min(16, dynamicF));
        }

        const formatSS = (v) => v >= 1 ? v.toFixed(1) + 's' : '1/' + Math.max(1, Math.round(1/v));
        
        const osdISO = this.state.iso === 'AUTO' ? `<span class="auto-val">${Math.round(dynamicISO)}</span>` : `<span class="val">${dynamicISO}</span>`;
        const osdSS = this.state.ss === 'AUTO' ? `<span class="auto-val">${formatSS(dynamicSS)}</span>` : `<span class="val">${tStr}</span>`;
        const osdF = this.state.f === 'AUTO' ? `<span class="auto-val">${dynamicF.toFixed(1)}</span>` : `<span class="val">${dynamicF.toFixed(1)}</span>`;

        document.getElementById('osd-iso').innerHTML = `<span class="osd-label">ISO</span>${osdISO}`;
        document.getElementById('osd-ss').innerHTML = `<span class="osd-label">SS</span>${osdSS}`;
        document.getElementById('osd-f').innerHTML = `<span class="osd-label">A</span>${osdF}`;

        const currentEV = Math.log2((dynamicF * dynamicF) / dynamicSS) - Math.log2(dynamicISO / 100);
        const diff = ev - currentEV;
        
        // Store for real-time visual simulation
        this.state.dynamicISO = dynamicISO;
        this.state.exposureDiff = diff;
        
        const percentage = Math.max(0, Math.min(100, 50 + (diff * 16.66)));
        if (this.elements.needle) this.elements.needle.style.left = percentage + '%';
        
        this.applyEffects();
    },

    setupShutter() {
        let halfPressTimer;
        let bulbStart = 0;
        
        this.elements.shutter.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            if (window.navigator.vibrate) window.navigator.vibrate(15);
            
            if (this.state.ss === 'B') {
                bulbStart = Date.now();
                this.elements.video.style.opacity = '0';
                this.toast("BULB EXPOSURE... (Hold)");
                return;
            }
            
            // Half-press AE/AF Lock simulation
            this.state.isLocked = false;
            halfPressTimer = setTimeout(() => {
                this.state.isLocked = true; // Locks EV analysis loop
                this.toast("🟢 AE/AF LOCKED");
                if (window.navigator.vibrate) window.navigator.vibrate([10, 20]);
            }, 500); 
        });
        
        this.elements.shutter.addEventListener('touchend', () => { 
            if (this.state.ss === 'B') {
                this.elements.video.style.opacity = '1';
                let sec = ((Date.now() - bulbStart) / 1000).toFixed(1);
                this.toast(`📸 BULB SAVED (${sec}s)`);
                this.capturePhoto();
                if (window.navigator.vibrate) window.navigator.vibrate([20, 20]);
                return;
            }
            
            clearTimeout(halfPressTimer);
            this.state.isLocked = false; 
            
            this.toast("📸 SNAP SAVED"); 
            this.capturePhoto();
            if (window.navigator.vibrate) window.navigator.vibrate(40); 
        });
    },

    capturePhoto() {
        if (!this.elements.video.videoWidth) return;
        const canvas = document.createElement('canvas');
        canvas.width = this.elements.video.videoWidth;
        canvas.height = this.elements.video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Copy exact CSS visual filters for the final JPG!
        ctx.filter = this.elements.video.style.filter;
        ctx.drawImage(this.elements.video, 0, 0, canvas.width, canvas.height);
        
        // Add Vintage EXIF Watermark
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(canvas.width - 600, canvas.height - 80, 600, 80);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 26px monospace';
        const stamp = `SPECTRA [${this.state.filter.toUpperCase()}] | ISO ${this.state.iso} | SS ${this.state.ss} | F${this.state.f}`;
        ctx.fillText(stamp, canvas.width - 570, canvas.height - 30);
        
        // Trigger download
        const link = document.createElement('a');
        link.download = `spectra_snap_${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
    },

    applyEffects() {
        const v = this.elements.video;
        const f = this.state.filter;
        
        // 1. Exposure Physics Simulation
        const diff = this.state.exposureDiff || 0;
        const simBright = Math.max(0.08, Math.min(4.0, Math.pow(2, diff))); // Simulates actual shutter/aperture physics
        
        let line = "";
        if (f === 'classic') line = `brightness(${1.05 * simBright}) contrast(1.1) saturate(0.8) sepia(0.2)`;
        else if (f === 'vivid') line = `brightness(${1.0 * simBright}) saturate(1.6) contrast(1.2)`;
        else if (f === 'soft') line = `brightness(${1.1 * simBright}) contrast(0.9) saturate(0.9)`;
        else if (f === 'mono') line = `brightness(${1.0 * simBright}) grayscale(1) contrast(1.3)`;
        else line = `brightness(${1.0 * simBright}) contrast(1.05) saturate(1.1)`;
        
        // WB Simulation
        let wbFilter = "";
        if (this.state.wb > 50) {
            let s = (this.state.wb - 50) / 100;
            wbFilter = `sepia(${s}) hue-rotate(-20deg)`;
        } else if (this.state.wb < 50) {
            let s = (50 - this.state.wb) / 100;
            wbFilter = `sepia(${s}) hue-rotate(180deg)`;
        }
        
        v.style.filter = `${line} ${wbFilter}`;
        
        // 2. High ISO Visual Noise Simulation
        const noiseEl = document.getElementById('sensor-noise');
        if (noiseEl && this.state.dynamicISO) {
            let iso = this.state.dynamicISO;
            let noiseOp = 0;
            if (iso > 400) noiseOp = (iso - 400) / 6000 * 0.65;
            noiseEl.style.opacity = Math.max(0, Math.min(0.85, noiseOp));
        }
    },

    toast(msg) { this.elements.toast.innerText = msg; },

    // --- Onboarding ---
    startOnboarding() {
        this.state.onboardingStep = 0;
        this.elements.onboardingOverlay.classList.remove('overlay-hidden');
        this.updateOnboardingStep();
    },

    updateOnboardingStep() {
        const t = translations[this.state.lang];
        const steps = [
            { el: null, text: t.guide_welcome },
            { el: 'viewport-zone', text: t.guide_compo },
            { el: 'iso-block', text: `[ISO] ${t.guide_iso}` },
            { el: 'ss-block', text: `[SS] ${t.guide_ss}` },
            { el: 'f-block', text: `[A] ${t.guide_f}` },
            { el: 'shutter-btn', text: t.guide_shutter }
        ];

        const step = steps[this.state.onboardingStep];
        this.elements.guideText.innerText = step.text;
        const card = this.elements.guideCard;
        if (step.el) {
            const target = document.getElementById(step.el);
            const rect = target.getBoundingClientRect();
            const pad = 12;
            
            this.elements.spotlight.setAttribute('x', rect.left - pad);
            this.elements.spotlight.setAttribute('y', rect.top - pad);
            this.elements.spotlight.setAttribute('width', rect.width + pad * 2);
            this.elements.spotlight.setAttribute('height', rect.height + pad * 2);
            
            const cy = rect.top + rect.height / 2;
            card.style.left = '50%'; card.style.transform = 'translateX(-50%)';
            if (cy > window.innerHeight / 2) card.style.top = (rect.top - 240) + 'px';
            else card.style.top = (rect.bottom + pad + 20) + 'px';
        } else {
            this.elements.spotlight.setAttribute('width', 0);
            this.elements.spotlight.setAttribute('height', 0);
            card.style.top = '50%'; card.style.left = '50%'; card.style.transform = 'translate(-50%, -50%)';
        }
        
        this.elements.guideNext.innerText = (this.state.onboardingStep === 5) ? (t.finish || "Start") : (t.next || (this.state.lang === 'ko' ? "다음" : "NEXT"));
        this.elements.guidePrev.innerText = t.prev || (this.state.lang === 'ko' ? "이전" : "PREV");
    },

    finishOnboarding() { this.elements.onboardingOverlay.classList.add('overlay-hidden'); }
};

window.onload = () => App.init();
