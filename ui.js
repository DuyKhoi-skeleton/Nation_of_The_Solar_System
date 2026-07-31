class UIManager {
    constructor() {
        this.shopModal = document.getElementById('shop-modal');
        this.inventoryModal = document.getElementById('inventory-modal');
        this.mapModal = document.getElementById('map-modal');
        this.noticeBox = document.getElementById('notice-box');

        this.initUIEvents();
    }

    initUIEvents() {
        document.getElementById('btn-open-shop')?.addEventListener('click', () => this.toggleShop());
        document.getElementById('btn-open-inv')?.addEventListener('click', () => this.toggleInventory());
        document.getElementById('btn-open-map')?.addEventListener('click', () => this.toggleMapScreen());

        document.getElementById('btn-close-shop')?.addEventListener('click', () => this.closeModals());
        document.getElementById('btn-close-inv')?.addEventListener('click', () => this.closeModals());
        document.getElementById('btn-close-map')?.addEventListener('click', () => this.closeModals());
    }

    closeModals() {
        if (this.shopModal) this.shopModal.style.display = 'none';
        if (this.inventoryModal) this.inventoryModal.style.display = 'none';
        if (this.mapModal) this.mapModal.style.display = 'none';
    }

    toggleShop() {
        const isVis = this.shopModal.style.display === 'flex';
        this.closeModals();
        if (!isVis) {
            this.shopModal.style.display = 'flex';
            this.renderShopContent();
        }
    }

    toggleInventory() {
        const isVis = this.inventoryModal.style.display === 'flex';
        this.closeModals();
        if (!isVis) {
            this.inventoryModal.style.display = 'flex';
            this.renderInventoryContent();
        }
    }

    toggleMapScreen() {
        const isVis = this.mapModal.style.display === 'flex';
        this.closeModals();
        if (!isVis) {
            this.mapModal.style.display = 'flex';
            this.renderMapList();
        }
    }

    showNotice(text) {
        if (!this.noticeBox) return;
        this.noticeBox.innerText = text;
        this.noticeBox.style.display = 'block';
        this.noticeBox.style.opacity = '1';
        setTimeout(() => {
            this.noticeBox.style.opacity = '0';
            setTimeout(() => this.noticeBox.style.display = 'none', 300);
        }, 2500);
    }

    renderMapList() {
        const listContainer = document.getElementById('map-list-container');
        if (!listContainer || !window.engine) return;

        const maps = [
            { key: 'earth', name: 'Trái Đất (Sảnh Chờ)', reqLv: 1, color: '#00ffcc', mult: 1.0 },
            { key: 'moon', name: 'Mặt Trăng (Vùng Tối)', reqLv: 10, color: '#aaaaff', mult: 2.2 },
            { key: 'mars', name: 'Sao Hỏa (Bão Cát)', reqLv: 25, color: '#ff5500', mult: 4.5 },
            { key: 'venus', name: 'Sao Kim (Núi Lửa)', reqLv: 40, color: '#ffcc00', mult: 8.0 },
            { key: 'jupiter', name: 'Sao Mộc (Tâm Bão)', reqLv: 60, color: '#ff0055', mult: 15.0 }
        ];

        const pLevel = window.engine.player.level;

        listContainer.innerHTML = maps.map(m => {
            const isUnlocked = pLevel >= m.reqLv;
            const isCurrent = window.engine.currentMapKey === m.key;

            return `
                <div class="map-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'active' : ''}">
                    <div style="color: ${m.color}; font-weight: bold; font-size: 16px;">${m.name}</div>
                    <div style="font-size: 11px; color: #aaa; margin: 4px 0;">Yêu cầu: Level ${m.reqLv} | Quái x${m.mult} Sức Mạnh | Tỷ lệ rớt đồ +${(m.mult * 20).toFixed(0)}%</div>
                    ${isCurrent ? '<button class="btn-map locked" disabled>Đang ở đây</button>' : 
                      isUnlocked ? `<button class="btn-map" onclick="window.engine.switchMap('${m.key}')">Chuyển Đến</button>` : 
                      '<button class="btn-map locked" disabled>Khóa (Cần Lv ' + m.reqLv + ')</button>'}
                </div>
            `;
        }).join('');
    }

    renderInventoryContent() {
        const invContainer = document.getElementById('inv-slots-container');
        if (!invContainer || !window.engine) return;

        const p = window.engine.player;

        let slotsHTML = '<div class="quick-slots-grid">';
        for (let i = 0; i < 8; i++) {
            const item = p.inventorySlots[i];
            const isSelected = i < 6;
            slotsHTML += `
                <div class="inv-slot ${isSelected ? 'active-slot' : 'reserve-slot'}">
                    <span class="slot-idx">${i + 1}</span>
                    ${item ? `<div style="font-size:10px; text-align:center;">${item.name}<br><small>+${item.val}</small></div>` : '<span style="font-size:10px; color:#555;">Trống</span>'}
                </div>
            `;
        }
        slotsHTML += '</div>';

        invContainer.innerHTML = `
            <div style="font-size:12px; text-align:left; margin-bottom:10px; color:#00ffcc;">
                <p>🗡️ Tăng Sát Thương từ Đồ Build: <b>+${p.bonusDamage || 0}</b></p>
                <p>🛡️ Tăng Giáp Tank từ Đồ Build: <b>+${p.bonusDefense || 0}</b></p>
            </div>
            <h4 style="font-size:12px; text-align:left; color:#aaa;">Thanh Lập Build (6 Ô Active / 2 Ô Dự Phòng):</h4>
            ${slotsHTML}
        `;
    }

    renderShopContent() {
        const shopContainer = document.getElementById('shop-items-container');
        if (!shopContainer || !window.engine) return;

        const skills = [
            { id: 'k', name: 'Sóng Xung Kích', rank: 'Common', price: 500, desc: 'Đánh văng quái ra xa' },
            { id: 'l', name: 'Tia Laser Siêu Tốc', rank: 'Rare', price: 1500, desc: 'Xuyên phá theo đường thẳng' },
            { id: 'o', name: 'Bão Đấm Lốc Xoáy', rank: 'Epic', price: 3500, desc: 'Sát thương diện rộng liên tục' },
            { id: 'p', name: 'Thiên Thạch Rơi', rank: 'Legendary', price: 8000, desc: 'Hủy diệt diện rộng' }
        ];

        shopContainer.innerHTML = skills.map(s => {
            const isBought = window.engine.unlockedSkills[s.id];
            return `
                <div class="shop-item-card">
                    <div>
                        <span class="badge ${s.rank.toLowerCase()}">${s.rank}</span> 
                        <b style="font-size:14px;">${s.name}</b>
                        <p style="font-size:11px; color:#bbb; margin-top:2px;">${s.desc}</p>
                    </div>
                    ${isBought ? '<button class="btn-buy disabled">Đã Có</button>' : 
                      `<button class="btn-buy" onclick="window.engine.buySkill('${s.id}', ${s.price})">Mua ($${s.price})</button>`}
                </div>
            `;
        }).join('');
    }

    update(player, fps, mapName) {
        document.getElementById('ui-map-name').innerText = mapName;
        document.getElementById('ui-level').innerText = player.level;
        document.getElementById('ui-hp').innerText = `${Math.floor(player.hp)}/${player.maxHp}`;
        document.getElementById('ui-hp-bar').style.width = `${(player.hp / player.maxHp) * 100}%`;
        document.getElementById('ui-exp').innerText = `${player.exp}/${player.maxExp}`;
        document.getElementById('ui-exp-bar').style.width = `${(player.exp / player.maxExp) * 100}%`;
        document.getElementById('ui-coin').innerText = player.coin;
        document.getElementById('ui-atk').innerText = player.damage + (player.bonusDamage || 0);
        document.getElementById('ui-def').innerText = player.defense + (player.bonusDefense || 0);
        document.getElementById('ui-fps').innerText = fps;
    }
}