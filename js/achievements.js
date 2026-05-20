import { gameState } from "./state.js";
import { addMessage } from "./story.js";
import { QUEST_DATA } from "./quests.js";
import { enemyData } from "./enemies.js";
import { showAchievementToast } from "./toast.js";
import { t, formatText } from "./i18n.js";

export const ACHIEVEMENTS = [
  { id:"first_kill",    icon:"⚔️",  rarity:"common",    title:"Primer Golpe",         desc:"Derrota tu primer enemigo.",              check:()=>(gameState.stats?.kills??0)>=1 },
  { id:"hunter_50",     icon:"🗡️",  rarity:"uncommon",  title:"Cazador",              desc:"Derrota 50 enemigos.",                    check:()=>(gameState.stats?.kills??0)>=50 },
  { id:"veteran_200",   icon:"🏆",  rarity:"rare",      title:"Veterano de Guerra",   desc:"Derrota 200 enemigos.",                   check:()=>(gameState.stats?.kills??0)>=200 },
  { id:"first_boss",    icon:"💀",  rarity:"uncommon",  title:"Cazador de Jefes",     desc:"Derrota tu primer jefe.",                 check:()=>(gameState.stats?.bossKills??0)>=1 },
  { id:"boss_slayer",   icon:"👑",  rarity:"epic",      title:"Derrocador",           desc:"Derrota 3 jefes.",                        check:()=>(gameState.stats?.bossKills??0)>=3 },
  { id:"explorer_10",   icon:"🗺️",  rarity:"common",    title:"Explorador",           desc:"Visita 10 zonas diferentes.",             check:()=>Object.keys(gameState.visitedLocations??{}).length>=10 },
  { id:"explorer_30",   icon:"🧭",  rarity:"uncommon",  title:"Gran Explorador",      desc:"Visita 30 zonas diferentes.",             check:()=>Object.keys(gameState.visitedLocations??{}).length>=30 },
  { id:"cartographer",  icon:"🌍",  rarity:"epic",      title:"Cartógrafo",           desc:"Visita todas las zonas del mundo.",       check:()=>Object.keys(gameState.visitedLocations??{}).length>=Object.keys(window.worldMap??{}).length },
  { id:"level_5",       icon:"⭐",  rarity:"common",    title:"Aprendiz",             desc:"Alcanza el nivel 5.",                     check:()=>(gameState.player?.level??0)>=5 },
  { id:"level_15",      icon:"🌟",  rarity:"rare",      title:"Héroe",                desc:"Alcanza el nivel 15.",                    check:()=>(gameState.player?.level??0)>=15 },
  { id:"level_25",      icon:"✨",  rarity:"legendary", title:"Leyenda",              desc:"Alcanza el nivel 25.",                    check:()=>(gameState.player?.level??0)>=25 },
  { id:"rich",          icon:"🪙",  rarity:"uncommon",  title:"Tesoro",               desc:"Acumula 500 de oro.",                     check:()=>(gameState.player?.gold??0)>=500 },
  { id:"first_quest",   icon:"📋",  rarity:"common",    title:"Primer Encargo",       desc:"Completa tu primera misión.",             check:()=>Object.values(gameState.quests??{}).some(s=>s==="completed") },
  { id:"all_quests",    icon:"🏅",  rarity:"legendary", title:"Héroe de Aethoria",    desc:"Completa todas las misiones.",            check:()=>Object.values(QUEST_DATA).every(q=>gameState.quests?.[q.id]==="completed") },
  { id:"bestiary_5",    icon:"📖",  rarity:"uncommon",  title:"Estudioso",            desc:"Descubre 5 criaturas en el bestiario.",   check:()=>Object.keys(gameState.stats?.enemiesDefeated??{}).length>=5 },
  { id:"bestiary_all",  icon:"📚",  rarity:"epic",      title:"Maestro del Bestiario",desc:"Descubre todas las criaturas.",           check:()=>Object.keys(enemyData).every(id=>(gameState.stats?.enemiesDefeated?.[id]??0)>0) },
];

export function checkAchievements() {
  if (!gameState.achievements) gameState.achievements = {};
  for (const ach of ACHIEVEMENTS) {
    if (gameState.achievements[ach.id]) continue;
    try {
      if (ach.check()) {
        gameState.achievements[ach.id] = true;
        addMessage(formatText(t('achievementUnlocked'), { title: ach.title }), "stat");
        showAchievementToast(ach);
      }
    } catch(e) {}
  }
}

const RARITY_LABEL = { common:"Común", uncommon:"Poco común", rare:"Raro", epic:"Épico", legendary:"Legendario" };

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
        <div class="ach-title">${is ? a.title : t('achievementHiddenTitle')}</div>
        <div class="ach-desc">${is ? a.desc : t('achievementHiddenCondition')}</div>
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
