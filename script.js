class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Định nghĩa Maps thuộc Hệ Mặt Trời
        this.maps = {
            earth: { name: 'Trái Đất (Sảnh Chờ)', minLevel: 1, color: '#050508', gridColor: 'rgba(0, 255, 204, 0.04)' },
            moon: { name: 'Mặt Trăng', minLevel: 10, color: '#0b0f19', gridColor: 'rgba(255, 255, 255, 0.05)' },
            mars: { name: 'Sao Hỏa', minLevel: 25, color: '#1a0805', gridColor: 'rgba(255, 102, 0, 0.06)' },
            jupiter: { name: 'Sao Mộc', minLevel: 45, color: '#1a1005', gridColor: 'rgba(255, 204, 0, 0.06)' },
            saturn: { name: 'Sao Thổ', minLevel: 65, color: '#141408', gridColor: 'rgba(230, 230, 0, 0.06)' },
            pluto: { name: 'Sao Diêm Vương', minLevel: 90, color: '#0f051a', gridColor: 'rgba(204, 0, 255, 0.06)' }
        };
        this.currentMapKey = 'earth';

        this.chunkMgr = new ChunkManager();
        this.uiMgr = new UIManager();
        this.player = new Player(0, 0);

        this.enemies = []; this.droppedItems = []; this.effects = [];
        this.camera = { x: 0, y: 0 };
        this.controls = { keys: {}, joyDir: { x: 0, y: 0 } };

        // Đã đổi kỹ năng 'i' thành 'j'
        this.unlockedSkills = { k: true, l: true, o: false, p: false, u: false, j: false };
        this.cooldowns = { space: false, k: false, l: false, o: false, p: false, u: false, j: false };

        this.bossTimer = performance.now();
        this.spawned15 = false; this.spawned50 = false; this.lastApocalypseMilestone = 0;

        // Load Save Game
        const savedData = SaveSystem.loadGame(this.player);
        if (savedData) {
            if (savedData.skills) this.unlockedSkills = savedData.skills;
            if (savedData.mapKey) this.currentMapKey = savedData.mapKey;
        }

        // SỬA LỖI F11 / RESIZE MÀN HÌNH CẮT KÉO
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.initInput();
        this.initShop();
        this.initMapSelector();
        this.spawnMobs();

        // Tự động lưu game 5 giây một lần
        setInterval(() => SaveSystem.saveGame(this.player, this.unlockedSkills, this.currentMapKey), 5000);

        this.lastTime = performance.now(); this.fps = 60; this.frames = 0; this.fpsClock = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    // Hàm tự căn chỉnh tỷ lệ chuẩn xác khi bật F11 / thay đổi kích thước trình duyệt
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            const k = e.key.toLowerCase(); this.controls.keys[k] = true;
            if (k === 'b') this.uiMgr.toggleShop();
            if (k === 'i' && !e.ctrlKey) this.uiMgr.toggleInventory(); // Phím I dùng cho Túi đồ
            if (k === 'm') this.uiMgr.toggleMapScreen();
            if (k === 'escape') this.uiMgr.closeModals();
            if (e.code === 'Space') { e.preventDefault(); this.atkNormal(); }
            if (k === 'shift') this.player.dash();
            if (['k','l','o','p','u','j'].includes(k)) this.triggerSkill(k); // Đã đổi 'i' -> 'j'
        });
        window.addEventListener('keyup', (e) => this.controls.keys[e.key.toLowerCase()] = false);

        document.getElementById('btn-respawn').onclick = () => this.player.respawn();
        document.getElementById('btn-open-shop').onclick = () => this.uiMgr.toggleShop();
        document.getElementById('btn-close-shop').onclick = () => this.uiMgr.toggleShop();
        document.getElementById('btn-open-inv').onclick = () => this.uiMgr.toggleInventory();
        document.getElementById('btn-close-inv').onclick = () => this.uiMgr.toggleInventory();
        document.getElementById('btn-open-map').onclick = () => this.uiMgr.toggleMapScreen();
        document.getElementById('btn-close-map').onclick = () => this.uiMgr.toggleMapScreen();

        // Mobile touch controls
        document.getElementById('btn-atk').onclick = () => this.atkNormal();
        document.getElementById('btn-dash').onclick = () => this.player.dash();
        document.getElementById('btn-skill-k').onclick = () => this.triggerSkill('k');
        document.getElementById('btn-skill-l').onclick = () => this.triggerSkill('l');
        document.getElementById('btn-skill-o').onclick = () => this.triggerSkill('o');
        document.getElementById('btn-skill-p').onclick = () => this.triggerSkill('p');
        document.getElementById('btn-skill-u').onclick = () => this.triggerSkill('u');
        
        // Đã đổi nút mobile sang skill J
        const btnSkillJ = document.getElementById('btn-skill-j') || document.getElementById('btn-skill-i');
        if (btnSkillJ) btnSkillJ.onclick = () => this.triggerSkill('j');
        
        this.initJoystick();
    }

    initJoystick() {
        const base = document.getElementById('joystick-base');
        const stick = document.getElementById('joystick-stick');
        if(!base || !stick) return;
        let active = false;

        const handleMove = (ex, ey) => {
            const rect = base.getBoundingClientRect();
            const cx = rect.left + rect.width / 2; const cy = rect.top + rect.height / 2;
            let dx = ex - cx; let dy = ey - cy;
            const dist = Math.hypot(dx, dy);
            const max = rect.width / 2;
            if(dist > max) { dx = (dx / dist) * max; dy = (dy / dist) * max; }
            stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            this.controls.joyDir = { x: dx / max, y: dy / max };
        };

        base.addEventListener('touchstart', (e) => { active = true; const t = e.touches[0]; handleMove(t.clientX, t.clientY); });
        window.addEventListener('touchmove', (e) => { if (!active) return; const t = e.touches[0]; handleMove(t.clientX, t.clientY); });
        window.addEventListener('touchend', () => { active = false; stick.style.transform = 'translate(-50%, -50%)'; this.controls.joyDir = { x: 0, y: 0 }; });
    }

    atkNormal() {
        if (this.cooldowns.space || this.player.isDead) return;
        this.cooldowns.space = true;
        const r = 68; const ax = this.player.x + this.player.dirX * 35; const ay = this.player.y + this.player.dirY * 35;
        this.effects.push({ type: 'slash', x: ax, y: ay, r: r, max: 140 });

        this.enemies.forEach(e => {
            if (Math.hypot(e.x - ax, e.y - ay) < r + e.radius) {
                e.hp -= this.player.damage; e.applyKnockback(this.player.dirX, this.player.dirY, 7);
            }
        });
        setTimeout(() => this.cooldowns.space = false, 280);
    }

    triggerSkill(type) {
        if (this.player.isDead || this.cooldowns[type] || !this.unlockedSkills[type]) return;
        this.cooldowns[type] = true;

        if (type === 'k') {
            this.effects.push({ type: 'wave', x: this.player.x, y: this.player.y, r: 120, max: 200, color: '#00e5ff' });
            this.enemies.forEach(e => {
                const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
                if (d < 120 + e.radius) { e.hp -= this.player.damage * 2.5; e.applyKnockback((e.x - this.player.x)/d, (e.y - this.player.y)/d, 15); }
            });
            setTimeout(() => this.cooldowns.k = false, 2000);
        } else if (type === 'l') {
            const tx = this.player.x + this.player.dirX * 180; const ty = this.player.y + this.player.dirY * 180;
            this.effects.push({ type: 'line', x1: this.player.x, y1: this.player.y, x2: tx, y2: ty, max: 200 });
            this.player.x = tx; this.player.y = ty;
            this.enemies.forEach(e => {
                if (Math.hypot(e.x - tx, e.y - ty) < 90) { e.hp -= this.player.damage * 3.0; e.applyKnockback(this.player.dirX, this.player.dirY, 12); }
            });
            setTimeout(() => this.cooldowns.l = false, 3500);
        } else if (type === 'o') { // Bão Liên Thanh
            let hits = 0;
            const loop = setInterval(() => {
                if (hits >= 6 || this.player.isDead) { clearInterval(loop); return; }
                this.cooldowns.space = false; this.atkNormal(); hits++;
            }, 80);
            setTimeout(() => this.cooldowns.o = false, 5000);
        } else if (type === 'p') { // Bão Thiên Thạch Sấm Sét
            this.effects.push({ type: 'wave', x: this.player.x, y: this.player.y, r: 280, max: 500, color: '#ff0055' });
            this.enemies.forEach(e => {
                const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
                if (d < 280 + e.radius) { e.hp -= this.player.damage * 6.5; e.applyKnockback((e.x - this.player.x)/d, (e.y - this.player.y)/d, 22); }
            });
            setTimeout(() => this.cooldowns.p = false, 8000);
        } else if (type === 'u') { // Mưa Siêu Bão Tượng
            this.effects.push({ type: 'wave', x: this.player.x + this.player.dirX * 100, y: this.player.y + this.player.dirY * 100, r: 200, max: 400, color: '#ffcc00' });
            this.enemies.forEach(e => {
                const d = Math.hypot(e.x - (this.player.x + this.player.dirX * 100), e.y - (this.player.y + this.player.dirY * 100));
                if (d < 200 + e.radius) { e.hp -= this.player.damage * 9.0; }
            });
            setTimeout(() => this.cooldowns.u = false, 11000);
        } else if (type === 'j') { // Hố Đen Hư Không [J]
            this.effects.push({ type: 'wave', x: this.player.x, y: this.player.y, r: 350, max: 600, color: '#cc00ff' });
            this.enemies.forEach(e => {
                e.hp -= this.player.damage * 15.0; e.applyKnockback((this.player.x - e.x)/10, (this.player.y - e.y)/10, 10);
            });
            setTimeout(() => this.cooldowns.j = false, 15000);
        }
    }

    initShop() {
        const c = document.getElementById('shop-items-container'); if(!c) return;
        const skillsData = [
            { id: 'o', name: 'Liên Thanh Quyền [O]', cost: 1200, desc: 'Tấn công dồn dập 6 phát liên tiếp.' },
            { id: 'p', name: 'Sóng Quang Hạt Nhân [P]', cost: 4000, desc: 'Phát nổ năng lượng diện rộng hủy diệt.' },
            { id: 'u', name: 'Mưa Thiên Thạch [U]', cost: 10000, desc: 'Gọi thiên thạch giội thẳng xuống mục tiêu.' },
            { id: 'j', name: 'Hố Đen Hư Không [J]', cost: 25000, desc: 'Tạo hố đen thiêu rụi toàn bộ kẻ địch.' }
        ];
        const upgradesData = [
            { type: 'weapon', label: 'Cường Hóa Vũ Khí' },
            { type: 'armor', label: 'Cường Hóa Giáp Trụ' }
        ];

        const renderSkills = () => {
            c.innerHTML = '';
            skillsData.forEach(item => {
                const bought = this.unlockedSkills[item.id];
                const d = document.createElement('div'); d.className = 'shop-item';
                d.innerHTML = `<div><h4>${item.name}</h4><p>${item.desc}</p></div>
                               <button class="shop-buy-btn" ${bought ? 'disabled' : ''}>${bought ? 'Đã Sở Hữu' : `Mua $${item.cost}`}</button>`;
                if(!bought) d.querySelector('button').onclick = () => {
                    if(this.player.coin >= item.cost) { this.player.coin -= item.cost; this.unlockedSkills[item.id] = true; renderSkills(); }
                    else alert("Không đủ Coin!");
                };
                c.appendChild(d);
            });
        };

        const renderUpgrades = () => {
            c.innerHTML = '';
            const ranks = ['D','C','B','A','S','SS'];
            const costMap = { 'D':300, 'C':800, 'B':2000, 'A':6000, 'S':15000 };
            
            upgradesData.forEach(up => {
                const cur = up.type === 'weapon' ? this.player.weaponRank : this.player.armorRank;
                const idx = ranks.indexOf(cur);
                const hasNext = idx < ranks.length - 1;
                const cost = hasNext ? costMap[cur] : 0;

                const d = document.createElement('div'); d.className = 'shop-item';
                d.innerHTML = `<div><h4>${up.label} (${cur} → ${hasNext ? ranks[idx+1] : 'MAX'})</h4><p>Tăng mạnh sát thương/giáp.</p></div>
                               <button class="shop-buy-btn" ${!hasNext ? 'disabled' : ''}>${hasNext ? `Nâng $${cost}` : 'Cực Hạn'}</button>`;
                if(hasNext) d.querySelector('button').onclick = () => {
                    if(this.player.coin >= cost) {
                        this.player.coin -= cost;
                        if(up.type === 'weapon') this.player.weaponRank = ranks[idx+1];
                        else this.player.armorRank = ranks[idx+1];
                        this.player.updateStats(); renderUpgrades();
                    } else alert("Không đủ Coin!");
                };
                c.appendChild(d);
            });
        };

        document.getElementById('tab-skills').onclick = (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); renderSkills();
        };
        document.getElementById('tab-upgrades').onclick = (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); renderUpgrades();
        };
        renderSkills();
    }

    initMapSelector() {
        const container = document.getElementById('map-list-container'); if(!container) return;
        container.innerHTML = '';

        Object.keys(this.maps).forEach(key => {
            const m = this.maps[key];
            const unlocked = this.player.level >= m.minLevel;

            const div = document.createElement('div'); div.className = 'map-item';
            div.innerHTML = `<div><h4>${m.name}</h4><p>Yêu cầu Level: ${m.minLevel}</p></div>
                             <button class="map-select-btn" ${!unlocked ? 'disabled' : ''}>${this.currentMapKey === key ? 'Đang Ở Đây' : 'Chuyển Đến'}</button>`;
            
            if(unlocked) {
                div.querySelector('button').onclick = () => {
                    this.currentMapKey = key;
                    this.enemies = []; // Đổi Map dọn dẹp quái cũ
                    this.spawnMobs();
                    this.uiMgr.toggleMapScreen();
                    this.initMapSelector();
                };
            }
            container.appendChild(div);
        });
    }

    spawnMobs() {
        const count = this.currentMapKey === 'pluto' ? 12 : 8;
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2; const d = 350 + Math.random() * 300;
            const type = this.currentMapKey === 'mars' ? 'skeleton' : Math.random() > 0.6 ? 'skeleton' : 'goblin';
            this.enemies.push(new Enemy(this.player.x + Math.cos(a)*d, this.player.y + Math.sin(a)*d, type));
        }
    }

    checkBossLogic(now) {
        if (this.player.level >= 15 && !this.spawned15) {
            this.enemies.push(new Enemy(this.player.x + 300, this.player.y - 300, 'boss_lvl15'));
            this.spawned15 = true;
        }
        if (this.player.level >= 50 && !this.spawned50) {
            this.enemies.push(new Enemy(this.player.x - 400, this.player.y + 400, 'boss_lvl50'));
            this.spawned50 = true;
        }
        const milestone = Math.floor(this.player.level / 100) * 100;
        if (milestone >= 100 && milestone !== this.lastApocalypseMilestone) {
            this.enemies.push(new Enemy(this.player.x + 500, this.player.y, 'apocalypse', this.player.level));
            this.lastApocalypseMilestone = milestone;
        }
        if (now - this.bossTimer > 40000) {
            this.bossTimer = now;
            let chosen = 'dragon';
            if (this.currentMapKey === 'mars') chosen = 'mars_boss';
            else if (this.currentMapKey === 'pluto') chosen = 'pluto_boss';
            else {
                const midBosses = ['dragon', 't-rex', 'guardian', 'mage', 'god'];
                chosen = midBosses[Math.floor(Math.random() * midBosses.length)];
            }
            this.enemies.push(new Enemy(this.player.x + 400, this.player.y + 200, chosen));
        }
    }

    processDropItem(e) {
        let rank = 'D';
        if (e.type === 'boss_lvl15') rank = 'A';
        else if (e.type === 'boss_lvl50') rank = 'S';
        else if (e.type === 'apocalypse' || e.type === 'pluto_boss') rank = 'SS';
        else if (['dragon', 't-rex', 'guardian', 'mage', 'god', 'mars_boss'].includes(e.type)) {
            const arr = ['C', 'B', 'A']; rank = arr[Math.floor(Math.random() * arr.length)];
        } else if (Math.random() > 0.85) {
            rank = 'C';
        } else { return; }

        this.droppedItems.push({
            x: e.x, y: e.y, rank: rank,
            type: Math.random() > 0.5 ? 'weapon' : 'armor',
            color: rank === 'SS' ? '#ff003c' : rank === 'S' ? '#ff00aa' : rank === 'A' ? '#00ffaa' : '#ffff00'
        });
    }

    loop(now) {
        this.frames++;
        if(now - this.fpsClock >= 1000) { this.fps = this.frames; this.frames = 0; this.fpsClock = now; }

        const mapConfig = this.maps[this.currentMapKey] || this.maps['earth'];
        const objects = this.chunkMgr.getVisibleObjects(this.player.x, this.player.y);
        this.player.update(this.controls, objects);
        this.checkBossLogic(now);

        this.enemies.forEach(e => {
            e.update(this.player, objects);
            if (e.hp <= 0 && !e.done) {
                e.done = true; this.player.addExp(e.maxHp * 0.6); this.player.coin += Math.floor(e.maxHp * 0.4);
                this.processDropItem(e);
            }
        });
        this.enemies = this.enemies.filter(e => e.hp > 0);
        if (this.enemies.length < 5) this.spawnMobs();

        // Hút vật phẩm tự động
        this.droppedItems.forEach((item, idx) => {
            const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
            if (dist < 280) {
                item.x += ((this.player.x - item.x) / dist) * 6;
                item.y += ((this.player.y - item.y) / dist) * 6;
            }
            if (dist < this.player.radius + 10) {
                const ranks = ['D','C','B','A','S','SS'];
                if (item.type === 'weapon' && ranks.indexOf(item.rank) > ranks.indexOf(this.player.weaponRank)) {
                    this.player.weaponRank = item.rank;
                } else if (item.type === 'armor' && ranks.indexOf(item.rank) > ranks.indexOf(this.player.armorRank)) {
                    this.player.armorRank = item.rank;
                }
                this.player.updateStats();
                this.droppedItems.splice(idx, 1);
            }
        });

        // Camera bám sát chuẩn xác
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        // Render Background & Grid theo Map
        this.ctx.fillStyle = mapConfig.color; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid(mapConfig.gridColor);

        // Render Objects
        objects.forEach(obj => {
            this.ctx.save();
            this.ctx.shadowBlur = 15; this.ctx.shadowColor = obj.type === 'crystal' ? '#00e5ff' : '#555577';
            this.ctx.fillStyle = obj.type === 'crystal' ? '#00e5ff' : '#2c3e50';
            this.ctx.beginPath(); this.ctx.arc(obj.x - this.camera.x, obj.y - this.camera.y, obj.radius, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.restore();
        });

        // Render Drop Items
        this.droppedItems.forEach(item => {
            this.ctx.save();
            this.ctx.shadowBlur = 12; this.ctx.shadowColor = item.color;
            this.ctx.fillStyle = item.color;
            this.ctx.beginPath(); this.ctx.arc(item.x - this.camera.x, item.y - this.camera.y, 8, 0, Math.PI * 2); this.ctx.fill();
            this.ctx.fillStyle = '#fff'; this.ctx.font = '10px monospace';
            this.ctx.fillText(`[${item.rank}]`, item.x - this.camera.x - 10, item.y - this.camera.y - 12);
            this.ctx.restore();
        });

        this.enemies.forEach(e => e.draw(this.ctx, this.camera));
        this.player.draw(this.ctx, this.camera);

        // Render Skills Vector FX
        this.effects.forEach((ef, idx) => {
            this.ctx.save();
            this.ctx.shadowBlur = 20; this.ctx.shadowColor = ef.color || '#ffcc00';
            this.ctx.strokeStyle = ef.color || '#ffcc00';
            if (ef.type === 'slash' || ef.type === 'wave') {
                this.ctx.lineWidth = 4; this.ctx.beginPath();
                this.ctx.arc(ef.x - this.camera.x, ef.y - this.camera.y, ef.r, 0, Math.PI * 2); this.ctx.stroke();
                ef.r += (ef.max - ef.r) * 0.15;
            } else if (ef.type === 'line') {
                this.ctx.lineWidth = 6; this.ctx.beginPath();
                this.ctx.moveTo(ef.x1 - this.camera.x, ef.y1 - this.camera.y); this.ctx.lineTo(ef.x2 - this.camera.x, ef.y2 - this.camera.y); this.ctx.stroke();
            }
            this.ctx.restore();
            ef.max -= 16.67; if (ef.max <= 0) this.effects.splice(idx, 1);
        });

        this.uiMgr.update(this.player, this.fps, mapConfig.name);
        requestAnimationFrame((t) => this.loop(t));
    }

    drawGrid(gridColor) {
        const size = 64; const sx = Math.floor(this.camera.x / size) * size; const sy = Math.floor(this.camera.y / size) * size;
        this.ctx.strokeStyle = gridColor || 'rgba(0, 255, 204, 0.03)'; this.ctx.lineWidth = 1;
        for (let x = sx; x < sx + this.canvas.width + size; x += size) {
            this.ctx.beginPath(); this.ctx.moveTo(x - this.camera.x, 0); this.ctx.lineTo(x - this.camera.x, this.canvas.height); this.ctx.stroke();
        }
        for (let y = sy; y < sy + this.canvas.height + size; y += size) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y - this.camera.y); this.ctx.lineTo(this.canvas.width, y - this.camera.y); this.ctx.stroke();
        }
    }
}

window.onload = () => { window.engine = new GameEngine(); };