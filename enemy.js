class Enemy {
    constructor(x, y, type, playerLevel = 1) {
        this.x = x; this.y = y;
        this.type = type || 'goblin';
        this.kx = 0; this.ky = 0;
        this.pulseAngle = Math.random() * Math.PI;

        // Phân cấp Boss & Quái theo Map
        if (this.type === 'dragon') {
            this.hp = 1400; this.damage = 35; this.speed = 1.3; this.radius = 42; this.color = '#ff3333'; this.name = "Rồng Lửa";
        } else if (this.type === 't-rex') {
            this.hp = 1800; this.damage = 45; this.speed = 1.1; this.radius = 46; this.color = '#ff6600'; this.name = "Bạo Chúa T-Rex";
        } else if (this.type === 'guardian') {
            this.hp = 2500; this.damage = 30; this.speed = 0.8; this.radius = 48; this.color = '#0088ff'; this.name = "Cơ Giáp Hộ Vệ";
        } else if (this.type === 'mage') {
            this.hp = 1100; this.damage = 55; this.speed = 1.5; this.radius = 34; this.color = '#cc00ff'; this.name = "Pháp Sư Tối Cao";
        } else if (this.type === 'god') {
            this.hp = 4000; this.damage = 75; this.speed = 1.4; this.radius = 52; this.color = '#ffff00'; this.name = "Thần Không Gian";
        } else if (this.type === 'mars_boss') {
            this.hp = 6000; this.damage = 110; this.speed = 1.6; this.radius = 55; this.color = '#e67e22'; this.name = "Khổng Lồ Bụi Đỏ";
        } else if (this.type === 'pluto_boss') {
            this.hp = 18000; this.damage = 280; this.speed = 1.9; this.radius = 70; this.color = '#8e44ad'; this.name = "Chúa Tể Hư Không Pluto";
        } else if (this.type === 'boss_lvl15') {
            this.hp = 2200; this.damage = 50; this.speed = 1.8; this.radius = 40; this.color = '#00ffaa'; this.name = "Sát Thủ Bóng Đêm [Lv15]";
        } else if (this.type === 'boss_lvl50') {
            this.hp = 7500; this.damage = 110; this.speed = 2.0; this.radius = 56; this.color = '#ff00aa'; this.name = "Chúa Tể Hư Không [Lv50]";
        } else if (this.type === 'apocalypse') {
            const tier = Math.max(1, Math.floor(playerLevel / 100));
            this.hp = 15000 * tier; this.damage = 160 * tier; this.speed = 1.6; this.radius = 65; this.color = '#ff003c'; this.name = `H họa Tận Thế [Cấp ${tier * 100}]`;
        } else if (this.type === 'skeleton') {
            this.hp = 70; this.damage = 14; this.speed = 1.7; this.radius = 18; this.color = '#e0e0e0'; this.name = "Xương";
        } else {
            this.hp = 45; this.damage = 8; this.speed = 1.9; this.radius = 16; this.color = '#33cc33'; this.name = "Goblin";
        }
        this.maxHp = this.hp;
    }

    update(player, objects) {
        if (this.hp <= 0 || player.isDead) return;
        this.pulseAngle += 0.05;

        this.x += this.kx; this.y += this.ky;
        this.kx *= 0.85; this.ky *= 0.85;

        const dx = player.x - this.x; const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 2) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        if (dist < this.radius + player.radius) {
            player.takeDamage(this.damage);
            this.kx = -(dx / dist) * 4; this.ky = -(dy / dist) * 4;
        }

        objects.forEach(obj => {
            const od = Math.hypot(this.x - obj.x, this.y - obj.y);
            if (od < this.radius + obj.radius) {
                const overlap = (this.radius + obj.radius) - od;
                this.x += ((this.x - obj.x) / (od || 1)) * overlap;
                this.y += ((this.y - obj.y) / (od || 1)) * overlap;
            }
        });
    }

    applyKnockback(kx, ky, power) {
        this.kx = kx * power; this.ky = ky * power;
    }

    draw(ctx, camera) {
        if (this.hp <= 0) return;
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);

        const sizePulse = this.radius + Math.sin(this.pulseAngle) * 2;
        ctx.shadowBlur = this.radius > 30 ? 25 : 12;
        ctx.shadowColor = this.color;
        
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(0, 0, sizePulse, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#050508';
        ctx.beginPath(); ctx.arc(0, 0, sizePulse * 0.5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-sizePulse * 0.3, -sizePulse * 0.1, sizePulse * 0.15, 0, Math.PI * 2);
        ctx.arc(sizePulse * 0.3, -sizePulse * 0.1, sizePulse * 0.15, 0, Math.PI * 2);
        ctx.fill();

        const bw = this.radius * 2; const bh = 5;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(-bw / 2, -this.radius - 12, bw, bh);
        ctx.fillStyle = '#ff0055'; ctx.fillRect(-bw / 2, -this.radius - 12, (this.hp / this.maxHp) * bw, bh);

        ctx.restore();
    }
}