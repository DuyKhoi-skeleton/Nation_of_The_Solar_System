class UIManager {
    constructor() {
        this.hpBar = document.getElementById('ui-hp-bar'); 
        this.hpText = document.getElementById('ui-hp-text');
        this.expBar = document.getElementById('ui-exp-bar'); 
        this.expText = document.getElementById('ui-exp-text');
        this.levelEl = document.getElementById('ui-level'); 
        this.coinEl = document.getElementById('ui-coin');
        this.atkEl = document.getElementById('ui-atk-val'); 
        this.defEl = document.getElementById('ui-def-val');
        this.fpsEl = document.getElementById('ui-fps');
        this.respawnBtn = document.getElementById('btn-respawn');
        this.shopScreen = document.getElementById('shop-screen'); 
        this.invScreen = document.getElementById('inventory-screen');
        this.mapScreen = document.getElementById('map-screen');
        this.mapNameEl = document.getElementById('ui-map-name');
    }

    update(player, fps, currentMapName) {
        if (!player) return;

        // Cập nhật thanh Máu & Kinh nghiệm
        if (this.hpBar) this.hpBar.style.width = Math.max(0, (player.hp / player.maxHp) * 100) + '%';
        if (this.hpText) this.hpText.textContent = `${Math.floor(player.hp)}/${player.maxHp}`;
        if (this.expBar) this.expBar.style.width = Math.min(100, (player.exp / player.maxExp) * 100) + '%';
        if (this.expText) this.expText.textContent = `${player.exp}/${player.maxExp}`;
        
        // Cập nhật các chỉ số cơ bản
        if (this.levelEl) this.levelEl.textContent = player.level;
        if (this.coinEl) this.coinEl.textContent = player.coin;
        if (this.atkEl) this.atkEl.textContent = player.damage;
        if (this.defEl) this.defEl.textContent = player.defense;
        if (this.fpsEl) this.fpsEl.textContent = fps;
        if (this.mapNameEl) this.mapNameEl.textContent = currentMapName;

        // Trạng thái nút Hồi sinh
        if (this.respawnBtn) {
            if (player.isDead) this.respawnBtn.classList.remove('hidden');
            else this.respawnBtn.classList.add('hidden');
        }

        // Cập nhật Trang bị trong Hành trang
        const wRankEl = document.getElementById('inv-weapon-rank');
        const aRankEl = document.getElementById('inv-armor-rank');
        if (wRankEl) wRankEl.textContent = player.weaponRank;
        if (aRankEl) aRankEl.textContent = player.armorRank;
    }

    toggleShop() { if (this.shopScreen) this.shopScreen.classList.toggle('hidden'); }
    toggleInventory() { if (this.invScreen) this.invScreen.classList.toggle('hidden'); }
    toggleMapScreen() { if (this.mapScreen) this.mapScreen.classList.toggle('hidden'); }

    closeModals() { 
        if (this.shopScreen) this.shopScreen.classList.add('hidden'); 
        if (this.invScreen) this.invScreen.classList.add('hidden'); 
        if (this.mapScreen) this.mapScreen.classList.add('hidden'); 
    }
}