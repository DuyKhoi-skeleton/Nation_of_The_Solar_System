// --- GAME ENGINE CHÍNH ---
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.maps = {
            earth: { name: 'Trái Đất (Sảnh Chờ)', color: '#0a0d14' },
            moon: { name: 'Mặt Trăng (Vùng Tối)', color: '#0f141d' },
            mars: { name: 'Sao Hỏa (Bão Cát)', color: '#1a0d0a' },
            venus: { name: 'Sao Kim (Núi Lửa)', color: '#1a160a' },
            jupiter: { name: 'Sao Mộc (Tâm Bão)', color: '#1a0a12' }
        };
        this.currentMapKey = 'earth';

        this.chunkMgr = new ChunkManager();
        this.uiMgr = new UIManager();
        this.player = new Player(0, 0);

        this.enemies = [];
        this.droppedItems = [];
        this.effects = [];
        this.camera = { x: 0, y: 0 };
        this.controls = { keys: {}, joyDir: { x: 0, y: 0 } };

        this.unlockedSkills = { k: true, l: true };
        this.cooldowns = {};

        this.bossTimer = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.initInput();
        this.spawnMobs();
        
        this.loadSave();

        this.lastTime = performance.now();
        this.fps = 60;
        this.frames = 0;
        this.fpsClock = performance.now();
        
        requestAnimationFrame((t) => this.loop(t));
    }

    loadSave() {
        try {
            const result = SaveSystem.loadGame(this.player);
            if (result) {
                this.unlockedSkills = result.skills || { k: true, l: true };
                this.currentMapKey = result.mapKey || 'earth';
                if (this.uiMgr) {
                    this.uiMgr.update(this.player, this.fps, this.maps[this.currentMapKey]?.name || 'Trái Đất');
                }
            }
        } catch (e) {
            console.log("Lỗi load save:", e);
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.controls.keys[key] = true;

            // Spacebar: Đấm thường
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                this.atkNormal();
            }

            // Shift: Phím Lướt
            if (e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                e.preventDefault();
                this.player.dash();
            }
            
            // UI Toggle & Đóng (Esc / M / I / B)
            if (key === 'b') { e.preventDefault(); if (this.uiMgr) this.uiMgr.toggleShop(); }
            if (key === 'i') { e.preventDefault(); if (this.uiMgr) this.uiMgr.toggleInventory(); }
            if (key === 'm') { e.preventDefault(); if (this.uiMgr) this.uiMgr.toggleMapScreen(); }
            if (key === 'escape') { if (this.uiMgr) this.uiMgr.closeModals(); }
            
            // Skills
            if (['k', 'l', 'o', 'p', 'u', 'j'].includes(key)) {
                e.preventDefault();
                this.useSkill(key);
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.controls.keys[key] = false;
        });

        // Touch input Mobile
        const bindTouch = (id, fn) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('pointerdown', (e) => { e.preventDefault(); fn(); });
                btn.addEventListener('touchstart', (e) => { e.preventDefault(); fn(); }, { passive: false });
            }
        };

        bindTouch('btn-atk', () => this.atkNormal());
        bindTouch('btn-dash', () => this.player.dash());
        bindTouch('btn-skill-k', () => this.useSkill('k'));
        bindTouch('btn-skill-l', () => this.useSkill('l'));
        bindTouch('btn-skill-o', () => this.useSkill('o'));
        bindTouch('btn-skill-p', () => this.useSkill('p'));
        bindTouch('btn-skill-u', () => this.useSkill('u'));
        bindTouch('btn-skill-j', () => this.useSkill('j'));

        const respawnBtn = document.getElementById('btn-respawn');
        if (respawnBtn) {
            respawnBtn.addEventListener('click', () => {
                if (this.player) this.player.respawn();
            });
        }

        this.initJoystick();
    }

    initJoystick() {
        const base = document.getElementById('joystick-base');
        const stick = document.getElementById('joystick-stick');
        if (!base || !stick) return;

        let active = false;
        let touchId = null;

        const handleMove = (clientX, clientY) => {
            const rect = base.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            let dx = clientX - cx;
            let dy = clientY - cy;
            const dist = Math.hypot(dx, dy);
            const max = rect.width / 2;
            
            if (dist > max) {
                dx = (dx / dist) * max;
                dy = (dy / dist) * max;
            }
            
            stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            this.controls.joyDir = { x: dx / max, y: dy / max };
        };

        const handleStart = (e) => {
            e.preventDefault();
            active = true;
            const point = e.touches ? e.touches[0] : e;
            if (e.touches) touchId = point.identifier;
            handleMove(point.clientX, point.clientY);
        };

        const handleMoveEvent = (e) => {
            if (!active) return;
            e.preventDefault();
            let point = e.touches ? Array.from(e.touches).find(t => t.identifier === touchId) : e;
            if (point) handleMove(point.clientX, point.clientY);
        };

        const handleEnd = (e) => {
            e.preventDefault();
            active = false;
            touchId = null;
            stick.style.transform = 'translate(-50%, -50%)';
            this.controls.joyDir = { x: 0, y: 0 };
        };

        base.addEventListener('touchstart', handleStart, { passive: false });
        base.addEventListener('touchmove', handleMoveEvent, { passive: false });
        base.addEventListener('touchend', handleEnd, { passive: false });
        base.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMoveEvent);
        window.addEventListener('mouseup', handleEnd);
    }

    switchMap(key) {
        const mapReqs = { earth: 1, moon: 10, mars: 25, venus: 40, jupiter: 60 };
        if (this.player.level < mapReqs[key]) {
            this.uiMgr.showNotice("❌ Chưa đủ Level để vào Map này!");
            return;
        }
        this.currentMapKey = key;
        this.enemies = []; // Reset quái khi đổi map
        this.spawnMobs();
        this.uiMgr.closeModals();
        this.uiMgr.showNotice(`🚀 Đã chuyển sang ${this.maps[key]?.name || key}`);
    }

    buySkill(id, price) {
        if (this.player.coin < price) {
            this.uiMgr.showNotice("❌ Không đủ Coin để mua Kỹ năng!");
            return;
        }
        this.player.coin -= price;
        this.unlockedSkills[id] = true;
        this.uiMgr.renderShopContent();
        this.uiMgr.showNotice("🎉 Đã mở khóa Kỹ năng mới!");
    }

    atkNormal() {
        if (this.player.isDead || this.player.isUltimating) return;

        this.player.comboCount++;
        
        const angle = Math.atan2(this.player.dirY, this.player.dirX);
        this.effects.push({
            type: 'slash',
            x: this.player.x + this.player.dirX * 15,
            y: this.player.y + this.player.dirY * 15,
            angle: angle, life: 0, maxLife: 10, color: '#00ffcc'
        });

        this.hitEnemies(this.player.damage + (this.player.bonusDamage || 0), 1.0, 30);

        if (this.player.comboCount >= this.player.maxCombo) {
            this.triggerUltraRush();
        }
    }

    triggerUltraRush() {
        this.player.isUltimating = true;
        this.player.comboCount = 0;

        let punches = 0;
        const interval = setInterval(() => {
            if (this.player.isDead || punches >= 8) {
                clearInterval(interval);
                this.player.isUltimating = false;
                return;
            }

            const spreadAngle = Math.atan2(this.player.dirY, this.player.dirX) + (Math.random() - 0.5) * 0.6;
            this.effects.push({
                type: 'slash',
                x: this.player.x + Math.cos(spreadAngle) * 25,
                y: this.player.y + Math.sin(spreadAngle) * 25,
                angle: spreadAngle, life: 0, maxLife: 8, color: '#ffcc00'
            });

            this.hitEnemies((this.player.damage + (this.player.bonusDamage || 0)) * 0.9, 1.2, 55);
            punches++;
        }, 80);
    }

    hitEnemies(baseDmg, multiplier, range) {
        this.enemies.forEach((enemy, index) => {
            const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
            if (dist < this.player.radius + enemy.radius + range) {
                const dmg = Math.max(1, Math.floor(baseDmg * multiplier) - Math.floor(enemy.hp * 0.02));
                enemy.hp -= dmg;
                enemy.applyKnockback((enemy.x - this.player.x) / (dist || 1), (enemy.y - this.player.y) / (dist || 1), 6);

                if (enemy.hp <= 0) {
                    this.player.addExp(15 + this.player.level * 2);
                    this.player.coin += 3 + this.player.level;
                    this.enemies.splice(index, 1);
                }
            }
        });
    }

    useSkill(key) {
        if (!this.unlockedSkills[key] || this.cooldowns[key] || this.player.isDead) return;
        
        this.cooldowns[key] = true;
        setTimeout(() => { this.cooldowns[key] = false; }, 2000);

        const angle = Math.atan2(this.player.dirY, this.player.dirX);

        if (key === 'k') {
            this.effects.push({ type: 'ring', x: this.player.x, y: this.player.y, r: 10, maxR: 140, life: 0, maxLife: 20, color: '#ff00ff' });
        } else if (key === 'l') {
            this.effects.push({ type: 'beam', x: this.player.x, y: this.player.y, dirX: this.player.dirX, dirY: this.player.dirY, life: 0, maxLife: 15, color: '#00e5ff' });
        } else {
            this.effects.push({ type: 'slash', x: this.player.x, y: this.player.y, angle: angle, life: 0, maxLife: 15, color: '#ff5500' });
        }

        this.hitEnemies(this.player.damage + (this.player.bonusDamage || 0), 1.8, 100);
    }

    spawnMobs() {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 200 + Math.random() * 200;
            this.enemies.push(new Enemy(
                this.player.x + Math.cos(angle) * dist,
                this.player.y + Math.sin(angle) * dist,
                'goblin',
                this.player.level
            ));
        }
    }

    spawnBoss() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 300;
        const boss = new Enemy(
            this.player.x + Math.cos(angle) * dist,
            this.player.y + Math.sin(angle) * dist,
            'boss',
            this.player.level + 3
        );
        boss.radius = 35;
        boss.maxHp = 500 + this.player.level * 100;
        boss.hp = boss.maxHp;
        this.enemies.push(boss);

        if (this.uiMgr && this.uiMgr.showNotice) {
            this.uiMgr.showNotice("⚠️ BOSS ĐÃ XUẤT HIỆN! ⚠️");
        }
    }

    loop(now) {
        this.frames++;
        if (now - this.fpsClock >= 1000) {
            this.fps = this.frames;
            this.frames = 0;
            this.fpsClock = now;
        }

        // Tự động Spam Boss sau mỗi 30 giây
        this.bossTimer += 16.67;
        if (this.bossTimer >= 30000) {
            this.bossTimer = 0;
            this.spawnBoss();
        }

        const visibleObjects = this.chunkMgr.getVisibleObjects(this.player.x, this.player.y);
        this.player.update(this.controls, visibleObjects);
        this.enemies.forEach(e => e.update(this.player, visibleObjects));
        
        if (this.enemies.length < 3) this.spawnMobs();

        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.maps[this.currentMapKey]?.color || '#0a0d14';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid('#00ffcc15');

        visibleObjects.forEach(obj => {
            this.ctx.save();
            this.ctx.fillStyle = obj.type === 'crystal' ? '#00ffcc44' : '#ff005544';
            this.ctx.beginPath();
            this.ctx.arc(obj.x - this.camera.x, obj.y - this.camera.y, obj.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        this.enemies.forEach(e => e.draw(this.ctx, this.camera));
        this.player.draw(this.ctx, this.camera, now);

        for (let idx = this.effects.length - 1; idx >= 0; idx--) {
            const ef = this.effects[idx];
            ef.life++;
            const progress = ef.life / ef.maxLife;
            const alpha = 1 - progress;

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, alpha);

            if (ef.type === 'slash') {
                this.ctx.translate(ef.x - this.camera.x, ef.y - this.camera.y);
                this.ctx.rotate(ef.angle);
                this.ctx.strokeStyle = ef.color;
                this.ctx.lineWidth = 5;
                this.ctx.beginPath();
                this.ctx.arc(10, 0, 25 + progress * 20, -Math.PI / 3, Math.PI / 3);
                this.ctx.stroke();
            } else if (ef.type === 'beam') {
                this.ctx.strokeStyle = ef.color;
                this.ctx.lineWidth = 10 * alpha;
                this.ctx.beginPath();
                this.ctx.moveTo(ef.x - this.camera.x, ef.y - this.camera.y);
                this.ctx.lineTo((ef.x + ef.dirX * 220) - this.camera.x, (ef.y + ef.dirY * 220) - this.camera.y);
                this.ctx.stroke();
            } else {
                const cr = ef.r ? ef.r + (ef.maxR - ef.r) * progress : progress * 80;
                this.ctx.strokeStyle = ef.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(ef.x - this.camera.x, ef.y - this.camera.y, cr, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            this.ctx.restore();

            if (ef.life >= ef.maxLife) {
                this.effects.splice(idx, 1);
            }
        }

        if (this.uiMgr) {
            this.uiMgr.update(this.player, this.fps, this.maps[this.currentMapKey]?.name || 'Trái Đất');
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    drawGrid(color) {
        const size = 64;
        const sx = Math.floor(this.camera.x / size) * size;
        const sy = Math.floor(this.camera.y / size) * size;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        
        for (let x = sx; x < sx + this.canvas.width + size; x += size) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - this.camera.x, 0);
            this.ctx.lineTo(x - this.camera.x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = sy; y < sy + this.canvas.height + size; y += size) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y - this.camera.y);
            this.ctx.lineTo(this.canvas.width, y - this.camera.y);
            this.ctx.stroke();
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.engine = new GameEngine(); });
} else {
    window.engine = new GameEngine();
}