class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.radius = 18;
        this.spawnX = x; this.spawnY = y;

        this.maxHp = 100;
        this.hp = 100; // Máu khởi tạo
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
            currentSpeed *= 2.4;
            this.dashTimer -= 16.67;
            if (this.dashTimer <= 0) this.isDashing = false;
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
        setTimeout(() => this.dashCooldown = false, 1000);
    }

    takeDamage(amount) {
        if (this.invincible || this.isDead) return;
        const dmg = Math.max(1, amount - Math.floor(this.defense * 0.4));
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

    draw(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);

        if (this.isDead) {
            ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(-12,-12); ctx.lineTo(12,12); ctx.moveTo(12,-12); ctx.lineTo(-12,12); ctx.stroke();
        } else {
            ctx.shadowBlur = 18;
            ctx.shadowColor = this.invincible ? '#ff0055' : '#00ffcc';
            ctx.fillStyle = this.invincible ? 'rgba(255, 0, 85, 0.8)' : '#00ffcc';
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(this.dirX * (this.radius + 8), this.dirY * (this.radius + 8)); ctx.stroke();
        }
        ctx.restore();
    }
}