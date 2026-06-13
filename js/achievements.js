import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { QUEST_DATA } from "./quests.js";
import { enemyData } from "./enemies.js";
import { showAchievementToast } from "./toast.js";
import { t, formatText, localizeText } from "./i18n.js";

export const ACHIEVEMENTS = [
  { id:"first_kill",    icon:"⚔️",  rarity:"common",    title:{ en: "First Blood", es: "Primer Golpe" },         desc:{ en: "Defeat your first enemy.", es: "Derrota tu primer enemigo." },              check:()=>(gameState.stats?.kills??0)>=1 },
  { id:"hunter_50",     icon:"🗡️",  rarity:"uncommon",  title:{ en: "Hunter", es: "Cazador" },                  desc:{ en: "Defeat 50 enemies.", es: "Derrota 50 enemigos." },                    check:()=>(gameState.stats?.kills??0)>=50 },
  { id:"veteran_200",   icon:"🏆",  rarity:"rare",      title:{ en: "Veteran", es: "Veterano de Guerra" },    desc:{ en: "Defeat 200 enemies.", es: "Derrota 200 enemigos." },                   check:()=>(gameState.stats?.kills??0)>=200 },
  { id:"first_boss",    icon:"💀",  rarity:"uncommon",  title:{ en: "First Boss", es: "Cazador de Jefes" },     desc:{ en: "Defeat your first boss.", es: "Derrota tu primer jefe." },                 check:()=>(gameState.stats?.bossKills??0)>=1 },
  { id:"boss_slayer",   icon:"👑",  rarity:"epic",      title:{ en: "Boss Slayer", es: "Derrocador" },          desc:{ en: "Defeat 3 bosses.", es: "Derrota 3 jefes." },                        check:()=>(gameState.stats?.bossKills??0)>=3 },
  { id:"explorer_10",   icon:"🗺️",  rarity:"common",    title:{ en: "Explorer", es: "Explorador" },           desc:{ en: "Visit 10 different zones.", es: "Visita 10 zonas diferentes." },             check:()=>Object.keys(gameState.visitedLocations??{}).length>=10 },
  { id:"explorer_30",   icon:"🧭",  rarity:"uncommon",  title:{ en: "Seasoned Explorer", es: "Gran Explorador" }, desc:{ en: "Visit 30 different zones.", es: "Visita 30 zonas diferentes." },             check:()=>Object.keys(gameState.visitedLocations??{}).length>=30 },
  { id:"cartographer",  icon:"🌍",  rarity:"epic",      title:{ en: "Cartographer", es: "Cartógrafo" },       desc:{ en: "Visit every zone in the world.", es: "Visita todas las zonas del mundo." },       check:()=>Object.keys(gameState.visitedLocations??{}).length>=Object.keys(window.worldMap??{}).length },
  { id:"level_5",       icon:"⭐",  rarity:"common",    title:{ en: "Acolyte", es: "Aprendiz" },             desc:{ en: "Reach level 5.", es: "Alcanza el nivel 5." },                     check:()=>(gameState.player?.level??0)>=5 },
  { id:"level_15",      icon:"🌟",  rarity:"rare",      title:{ en: "Hero", es: "Héroe" },                   desc:{ en: "Reach level 15.", es: "Alcanza el nivel 15." },                    check:()=>(gameState.player?.level??0)>=15 },
  { id:"level_25",      icon:"✨",  rarity:"legendary", title:{ en: "Legend", es: "Leyenda" },               desc:{ en: "Reach level 25.", es: "Alcanza el nivel 25." },                    check:()=>(gameState.player?.level??0)>=25 },
  { id:"rich",          icon:"🪙",  rarity:"uncommon",  title:{ en: "Treasure Hoarder", es: "Tesoro" },      desc:{ en: "Accumulate 500 gold.", es: "Acumula 500 de oro." },                     check:()=>(gameState.player?.gold??0)>=500 },
  { id:"first_quest",   icon:"📋",  rarity:"common",    title:{ en: "First Quest", es: "Primer Encargo" },   desc:{ en: "Complete your first quest.", es: "Completa tu primera misión." },             check:()=>Object.values(gameState.quests??{}).some(s=>s==="completed") },
  { id:"all_quests",    icon:"🏅",  rarity:"legendary", title:{ en: "Savior of Aethoria", es: "Héroe de Aethoria" }, desc:{ en: "Complete all quests.", es: "Completa todas las misiones." },            check:()=>Object.values(QUEST_DATA).every(q=>gameState.quests?.[q.id]==="completed") },
  { id:"bestiary_5",    icon:"📖",  rarity:"uncommon",  title:{ en: "Student of Beasts", es: "Estudioso" },  desc:{ en: "Discover 5 creatures in the bestiary.", es: "Descubre 5 criaturas en el bestiario." },   check:()=>Object.keys(gameState.stats?.enemiesDefeated??{}).length>=5 },
  { id:"bestiary_all",  icon:"📚",  rarity:"epic",      title:{ en: "Grandmaster of the Bestiary", es: "Maestro del Bestiario" }, desc:{ en: "Discover every creature.", es: "Descubre todas las criaturas." },           check:()=>Object.keys(enemyData).every(id=>(gameState.stats?.enemiesDefeated?.[id]??0)>0) },
];

export function checkAchievements() {
  if (!gameState.achievements) gameState.achievements = {};
  for (const ach of ACHIEVEMENTS) {
    if (gameState.achievements[ach.id]) continue;
    try {
      if (ach.check()) {
        gameState.achievements[ach.id] = true;
        addMessage(formatText(t('achievementUnlocked'), { title: localizeText(ach.title) }), "stat");
        showAchievementToast(ach);
      }
    } catch(e) {}
  }
}

const RARITY_LABEL = {
  common: t('rarityCommon'),
  uncommon: t('rarityUncommon'),
  rare: t('rarityRare'),
  epic: t('rarityEpic'),
  legendary: t('rarityLegendary')
};

export function renderAchievements() {
  const unlocked = gameState.achievements ?? {};
  const done  = Object.keys(unlocked).length;
  const total = ACHIEVEMENTS.length;
  const pct   = Math.round(done / total * 100);

  const cards = ACHIEVEMENTS.map(a => {
    const is = !!unlocked[a.id];
    return `<div class="ach-card ${is?"unlocked":"locked"} ach-rarity-${a.rarity}">
      <div class="ach-icon">${is ? a.icon : "🔒"}</div>
      <div class="ach-body">
        <div class="ach-title">${is ? localizeText(a.title) : t('achievementHiddenTitle')}</div>
        <div class="ach-desc">${is ? localizeText(a.desc) : t('achievementHiddenCondition')}</div>
      </div>
      ${is ? `<span class="ach-badge ach-rarity-${a.rarity}">${RARITY_LABEL[a.rarity]}</span>` : ""}
    </div>`;
  }).join("");

  return `<div class="ach-container">
    <div class="ach-header">
      <span>${done}/${total} ${t('achievementsUnlocked')}</span>
      <div class="ach-progress-bar"><div class="ach-progress-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="ach-grid">${cards}</div>
  </div>`;
}
