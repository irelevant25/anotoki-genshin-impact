// AUTO-GENERATED — do not edit manually.
// Source: php/schema.sql
// Regenerate: node angular/generate-interfaces.js
export interface User {
  id?: number | null;
  role: 'ADMIN' | 'EDITOR' | 'USER';
  username: string;
  email: string;
  emailConfirmed: boolean;
  password: string;
  background?: string | null;
  deleted: boolean;
  theme: 'light' | 'dark' | 'auto';
  version?: string | null;
  token?: string | null;
  tokenExpiresAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Quiz {
  id?: number | null;
  name: string;
  deleted: boolean;
  createdAt?: string | null;
}

export interface QuizState {
  userId: number;
  quizId: number;
  state?: any | null;
  isDaily: boolean;
  createdAt?: string | null;
}

export interface Character {
  id?: number | null;
  name: string;
  element: 'Anemo' | 'Geo' | 'Electro' | 'Dendro' | 'Hydro' | 'Pyro' | 'Cryo';
  weaponType: 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst';
  rarity: number;
  title?: string | null;
  secondaryTitle?: string | null;
  region?: string | null;
  model: string;
  birthday?: string | null;
  specialDish?: string | null;
  howToObtain: string;
  namecardDescription: string;
  namecardSources?: any | null;
  releaseDate?: string | null;
  version: string;
  introduced?: string | null;
  demoMusic?: string | null;
  voiceActorEnglish: string;
  voiceActorJapanese: string;
  voiceActorKorean: string;
  voiceActorChinese: string;
  deleted: boolean;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface Role {
  id?: number | null;
  name: string;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterRole {
  id?: number | null;
  characterId: number;
  roleId: number;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface Affiliation {
  id?: number | null;
  name: string;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterAffiliation {
  id?: number | null;
  characterId: number;
  affiliationId: number;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterVoiceOver {
  id?: number | null;
  characterId: number;
  type: 'story' | 'combat';
  language: 'English' | 'Chinese' | 'Japanese' | 'Korean';
  title: string;
  text: string;
  reading: string;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterRelationship {
  id?: number | null;
  characterId: number;
  type: 'Mother' | 'Grandmother' | 'Father' | 'Grandfather' | 'Sister' | 'Brother' | 'Friend' | 'Enemy' | 'Ancestor' | 'Relative' | 'Master' | 'Uncle' | 'Daughter' | 'Son' | 'Other';
  name: string;
  state: 'Alive' | 'Deceased' | 'Unknown';
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterConstellation {
  id?: number | null;
  characterId: number;
  name: string;
  level: number;
  description?: string | null;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterTalent {
  id?: number | null;
  characterId: number;
  name: string;
  type: 'Normal Attack' | 'Elemental Skill' | 'Elemental Burst' | 'Utility Passive' | '1st Ascension Passive' | '2nd Ascension Passive' | '3rd Ascension Passive' | '4th Ascension Passive' | '5th Ascension Passive' | '6th Ascension Passive';
  description?: string | null;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterTalentCost {
  id?: number | null;
  characterTalentId: number;
  level: number;
  materialId: number;
  quantity: number;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterAscension {
  id?: number | null;
  characterId: number;
  phase: number;
  primaryStat: number;
  primaryStatValue: number;
  startLevelHp: number;
  startLevelAtk: number;
  startLevelDef: number;
  endLevelHp: number;
  endLevelAtk: number;
  endLevelDef: number;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterAscensionCost {
  id?: number | null;
  characterAscensionId: number;
  materialId: number;
  quantity: number;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterBuild {
  id?: number | null;
  characterId: number;
  version: string;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterBuildWeapon {
  id?: number | null;
  characterBuildId: number;
  weaponId: number;
  order: number;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterBuildArtifact {
  id?: number | null;
  characterBuildId: number;
  artifactId: number;
  order: number;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterBuildArtifact {
  id?: number | null;
  characterBuildId: number;
  talentId: number;
  order: number;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterBuildMainStat {
  id?: number | null;
  characterBuildId: number;
  statId: number;
  type: 'sands' | 'goblet' | 'circlet';
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterBuildSubStat {
  id?: number | null;
  characterBuildId: number;
  statId: number;
  order: number;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface CharacterBuildTeam {
  id?: number | null;
  characterBuildId: number;
  characterId: number;
  order: number;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface Stat {
  id?: number | null;
  name: string;
  isPercent: boolean;
  createdAt?: string | null;
}

export interface Weapon {
  id?: number | null;
  name: string;
  type: 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst';
  rarity: number;
  howToObtain?: any | null;
  releaseDate?: string | null;
  secondaryStat: number;
  version?: string | null;
  description?: string | null;
  deleted: boolean;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface WeaponStat {
  weaponId: number;
  statId: number;
  statValue: number;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface Material {
  id?: number | null;
  name: string;
  category: 'Ascension' | 'Talent' | 'Weapon' | 'Cooking' | 'Local Specialty' | 'Monster Drop' | 'Other' | 'Materials';
  region?: 'Mondstadt' | 'Liyue' | 'Inazuma' | 'Sumeru' | 'Fontaine' | 'Natlan' | 'Nod-Krai' | null;
  howToObtain?: any | null;
  version?: string | null;
  deleted: boolean;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface Background {
  id?: number | null;
  name: string;
  deleted: boolean;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface Food {
  id?: number | null;
  name: string;
  description?: string | null;
  effect?: string | null;
  type?: string | null;
  rarity: number;
  proficiency: number;
  baseDishId?: number | null;
  variant?: string | null;
  characterId?: number | null;
  event?: string | null;
  region?: 'Mondstadt' | 'Liyue' | 'Inazuma' | 'Sumeru' | 'Fontaine' | 'Natlan' | 'Nod-Krai' | null;
  howToObtain?: any | null;
  effects?: any | null;
  version?: string | null;
  deleted: boolean;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface FoodRecipe {
  id?: number | null;
  foodId: number;
  materialId: number;
  quantity: number;
  deleted: boolean;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface Artifact {
  id?: number | null;
  name: string;
  howToObtain?: any | null;
  version?: string | null;
  effects?: any | null;
  twoPiece?: string | null;
  fourPiece?: string | null;
  rarity: number;
  deleted: boolean;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface ArtifactPiece {
  id?: number | null;
  artifactId: number;
  type: 'Flower of Life' | 'Plume of Death' | 'Sands of Eon' | 'Goblet of Eonothem' | 'Circlet of Logos';
  name: string;
  deleted: boolean;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface QuizHistory {
  id?: number | null;
  userId: number;
  characterId: number;
  quizId: number;
  win: boolean;
  attempts: number;
  difficulty?: number | null;
  createdAt?: string | null;
}

export interface QuizStatsHistory {
  userId: number;
  characterId: number;
  quizId: number;
  wins: number;
  losses: number;
  attempts: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Enemy {
  id?: number | null;
  name: string;
  damageType: 'Physical' | 'Pyro' | 'Hydro' | 'Electro' | 'Cryo' | 'Anemo' | 'Geo';
  otherElements?: 'Physical' | 'Pyro' | 'Hydro' | 'Electro' | 'Cryo' | 'Anemo' | 'Geo' | null;
  hasWeakpoint?: boolean | null;
  livingBeingType: 'Common Enemies' | 'Elite Enemies' | 'Normal Bosses' | 'Weekly Bosses';
  livingBeingFamily: 'Automatons' | 'Elemental Lifeforms' | 'Hilichurls' | 'Mystical Beasts' | 'The Abyss' | 'Fatui' | 'Enemies of Note' | 'Other Human Factions';
  livingBeingGroup?: string | null;
  interactiveMapLink?: string | null;
  abilities?: any | null;
  description?: string | null;
  deleted: boolean;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface EnemyDrop {
  id?: number | null;
  levelFrom: number;
  levelTo?: number | null;
  enemyId: number;
  materialId: number;
  quantity?: number | null;
  deleted: boolean;
  createdAt?: string | null;
  createdBy: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
}
