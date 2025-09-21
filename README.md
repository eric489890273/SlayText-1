# 簡易版《殺戮尖塔》(Slay the Spire) 文字遊戲 Demo

這是一個使用 **Vite + TypeScript + Tailwind CSS** 建立的前端專案，模擬《殺戮尖塔》的核心卡牌戰鬥機制。遊戲採 **文字介面**，不需要圖形或動畫，但保留了回合制戰鬥、卡牌抽取與敵人行為等核心元素。

## 專案特色

- **玩家屬性**：
  - 血量 (HP)
  - 能量 (Energy)
  - 卡牌堆 (Deck)

- **回合制戰鬥**：
  - 每回合抽取 5 張卡牌
  - 使用卡牌攻擊、獲得護甲或施放技能

- **卡牌類型**：
  - 攻擊卡 (Attack)
  - 防禦卡 (Defense)
  - 技能卡 (Skill)

- **敵人行為模式**：
  - 攻擊
  - 防禦
  - 蓄力

- **牌組管理**：
  - 戰鬥結束後，可選擇一張新卡加入牌組

- **簡單卡牌效果範例**：
  - 攻擊造成 6 點傷害
  - 防禦獲得 5 點護甲

## 專案技術棧

- [Vite](https://vitejs.dev/) — 前端開發工具
- [TypeScript](https://www.typescriptlang.org/) — 靜態型別語言
- [Tailwind CSS](https://tailwindcss.com/) — 實用型 CSS 框架
- Node.js 環境 (透過 package.json 管理依賴)

## 安裝與啟動

1. **克隆專案**  

   ```bash
   git clone <專案網址>
   cd <專案資料夾>

2. **安裝依賴**  

   ```bash
   npm install

3. **啟動開發伺服器**  

   ```bash
   npx tsx server/index.ts

4.瀏覽器預覽

運行後，Vite 會提供本地開發網址（通常是 http://localhost:5173），在瀏覽器中開啟即可遊玩。

## 遊戲操作

1. 遊戲畫面為文字介面，會顯示玩家與敵人資訊
2. 每回合抽牌後，依提示選擇手牌來使用
3. 戰鬥結束後可選擇新增卡牌到牌組
