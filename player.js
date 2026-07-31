class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.radius = 18;
        this.spawnX = x; this.spawnY = y;

        this.maxHp = 100;
        this.hp = 100;
        this.level = 1; this.exp = 0; this.maxExp = 100;
        this.coin = 0;
        
        this.baseDamage = 16; this.baseDefense = 4;
        this.damage = 16; this.defense = 4;
        this.speed = 4.2;

        this.weaponRank = 'D'; this.armorRank = 'D';
        this.isDashing = false; this.dashTimer = 0; this.dashCooldown = false;
        this.invincible = false; this.invincibleTimer = 0;
        this.isDead = false;
        this.dirX = 0; this.dirY = 1;

        // Vệt lướt (Dash Trails)
        this.dashTrails = [];

        // Hệ thống tích tụ đấm (Combo Charge)
        this.comboCount = 0;
        this.maxCombo = 5;
        this.isUltimating = false;

        // Hành trang Slots
        this.inventorySlots = new Array(8).fill(null);
        this.bonusDamage = 0;
        this.bonusDefense = 0;
    }

    updateStats() {
        const multipliers = { 'D': 1.0, 'C': 1.6, 'B': 2.5, 'A': 4.5, 'S': 8.0, 'SS': 15.0 };
        this.damage = Math.floor(this.baseDamage * (multipliers[this.weaponRank] || 1.0));
        this.defense = Math.floor(this.baseDefense * (multipliers[this.armorRank] || 1.0));
    }

    update(controls, objects) {
        if (this.isDead) return;

        if (this.invincible) {
            this.invincibleTimer -= 16.67;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        let mx = 0; let my = 0;
        if (controls.keys['w'] || controls.keys['arrowup']) my -= 1;
        if (controls.keys['s'] || controls.keys['arrowdown']) my += 1;
        if (controls.keys['a'] || controls.keys['arrowleft']) mx -= 1;
        if (controls.keys['d'] || controls.keys['arrowright']) mx += 1;

        if (controls.joyDir.x !== 0 || controls.joyDir.y !== 0) {
            mx = controls.joyDir.x; my = controls.joyDir.y;
        }

        const len = Math.hypot(mx, my);
        if (len > 0) {
            mx /= len; my /= len;
            this.dirX = mx; this.dirY = my;
        }

        let currentSpeed = this.speed;
        if (this.isDashing) {
            currentSpeed *= 2.8;
            this.dashTimer -= 16.67;
            this.dashTrails.push({ x: this.x, y: this.y, alpha: 0.6 });
            if (this.dashTimer <= 0) this.isDashing = false;
        }

        for (let i = this.dashTrails.length - 1; i >= 0; i--) {
            this.dashTrails[i].alpha -= 0.05;
            if (this.dashTrails[i].alpha <= 0) {
                this.dashTrails.splice(i, 1);
            }
        }

        let nx = this.x + mx * currentSpeed;
        let ny = this.y + my * currentSpeed;

        objects.forEach(obj => {
            const dist = Math.hypot(nx - obj.x, ny - obj.y);
            if (dist < this.radius + obj.radius) {
                const overlap = (this.radius + obj.radius) - dist;
                nx += ((nx - obj.x) / (dist || 1)) * overlap;
                ny += ((ny - obj.y) / (dist || 1)) * overlap;
            }
        });

        this.x = nx; this.y = ny;
    }

    dash() {
        if (this.dashCooldown || this.isDead) return;
        this.isDashing = true; this.dashCooldown = true;
        this.dashTimer = 180; this.invincible = true; this.invincibleTimer = 250;
        setTimeout(() => this.dashCooldown = false, 800);
    }

    takeDamage(amount) {
        if (this.invincible || this.isDead) return;
        const totalDef = this.defense + this.bonusDefense;
        const dmg = Math.max(1, amount - Math.floor(totalDef * 0.4));
        this.hp -= dmg;
        this.invincible = true; this.invincibleTimer = 400;
        if (this.hp <= 0) { this.hp = 0; this.isDead = true; }
    }

    addExp(amount) {
        this.exp += amount;
        while (this.exp >= this.maxExp) {
            this.exp -= this.maxExp;
            this.level++;
            this.maxExp = Math.floor(this.maxExp * 1.35);
            this.maxHp += 25; this.hp = this.maxHp;
            this.baseDamage += 5; this.baseDefense += 2;
            this.updateStats();
        }
    }

    respawn() {
        this.x = this.spawnX; this.y = this.spawnY;
        this.hp = this.maxHp; this.isDead = false;
        this.invincible = true; this.invincibleTimer = 1200;
    }

    draw(ctx, camera, time = performance.now()) {
        ctx.save();

        // 1. Vẽ vệt lướt
        this.dashTrails.forEach(t => {
            ctx.save();
            ctx.translate(t.x - camera.x, t.y - camera.y);
            ctx.fillStyle = `rgba(0, 255, 204, ${t.alpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.translate(this.x - camera.x, this.y - camera.y);

        if (this.isDead) {
            ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-12,-12); ctx.lineTo(12,12); ctx.moveTo(12,-12); ctx.lineTo(-12,12); ctx.stroke();
        } else {
            // Dynamic Aura
            const pulse = Math.sin(time * 0.008) * 4;
            const dynamicBlur = 18 + pulse * 2;
            const dynamicRadius = this.radius + Math.sin(time * 0.005) * 1.5;

            ctx.shadowBlur = dynamicBlur;
            ctx.shadowColor = this.isUltimating ? '#ffcc00' : (this.invincible ? '#ff0055' : '#00ffcc');
            ctx.fillStyle = this.isUltimating ? '#ffcc00' : (this.invincible ? 'rgba(255, 0, 85, 0.8)' : '#00ffcc');
            ctx.beginPath(); ctx.arc(0, 0, dynamicRadius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            // Direction Pointer
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(this.dirX * (dynamicRadius + 8), this.dirY * (dynamicRadius + 8)); ctx.stroke();

            // --- THANH TÍCH TỤ ĐẤM TRÊN ĐẦU ---
            const barW = 36;
            const barH = 5;
            const barX = -barW / 2;
            const barY = -dynamicRadius - 16;

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(barX, barY, barW, barH);

            const pct = Math.min(1, this.comboCount / this.maxCombo);
            ctx.fillStyle = pct >= 1 ? '#ffcc00' : '#00ffcc';
            ctx.fillRect(barX, barY, barW * pct, barH);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);
        }
        ctx.restore();
    }
}