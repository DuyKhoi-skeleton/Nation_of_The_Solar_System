class SaveSystem {
    static saveGame(player, unlockedSkills, currentMapKey) {
        try {
            const saveObj = {
                level: player.level, exp: player.exp, maxExp: player.maxExp,
                hp: player.hp, maxHp: player.maxHp, // SỬA LỖI: Lưu giá trị HP chính xác
                coin: player.coin, weaponRank: player.weaponRank, armorRank: player.armorRank,
                baseDamage: player.baseDamage, baseDefense: player.baseDefense,
                unlockedSkills: unlockedSkills, currentMapKey: currentMapKey || 'earth'
            };
            localStorage.setItem('solar_system_v5_save', JSON.stringify(saveObj));
        } catch (e) { console.error("Lưu game thất bại:", e); }
    }

    static loadGame(player) {
        try {
            const raw = localStorage.getItem('solar_system_v5_save');
            if (!raw) return null;
            const d = JSON.parse(raw);
            
            player.level = d.level || 1; 
            player.exp = d.exp || 0; 
            player.maxExp = d.maxExp || 100;
            
            // SỬA LỖI: Đọc lại Máu chính xác khi load trang
            player.maxHp = d.maxHp || 100;
            player.hp = typeof d.hp === 'number' ? d.hp : player.maxHp;
            
            player.coin = d.coin || 0; 
            player.weaponRank = d.weaponRank || 'D'; 
            player.armorRank = d.armorRank || 'D';
            player.baseDamage = d.baseDamage || 16; 
            player.baseDefense = d.baseDefense || 4;
            player.updateStats();

            return {
                skills: d.unlockedSkills || null,
                mapKey: d.currentMapKey || 'earth'
            };
        } catch (e) { console.error("Tải dữ liệu thất bại:", e); return null; }
    }
}