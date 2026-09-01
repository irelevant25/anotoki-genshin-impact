import { VoiceOverFormData } from '../../../../../../sites/admin/shared/admin-form.model';
import { createUid, VoiceOverLanguage, VoiceOverWrapper } from '../../character-form.model';

/**
 * Audio lives in the repo assets, laid out as
 * `assets/character/voice_overs/{Character}/{type}/{en|ja|ko|zh}/{Title}.ogg`,
 * where the file name is the voice over's title *in that language*.
 */
export const VOICE_OVER_ASSET_ROOT = 'assets/character/voice_overs';

/** Folder name -> language. Full names are accepted too, in case a dump uses them. */
const LANGUAGE_BY_FOLDER: Record<string, VoiceOverLanguage> = {
  en: 'english',
  eng: 'english',
  english: 'english',
  ja: 'japanese',
  jp: 'japanese',
  japanese: 'japanese',
  ko: 'korean',
  kr: 'korean',
  korean: 'korean',
  zh: 'chinese',
  cn: 'chinese',
  chinese: 'chinese',
};

/**
 * Titles a file name may carry, per language. Chinese folders hold both the
 * simplified and the traditional spelling of the same clip.
 */
const TITLE_FIELDS: Record<VoiceOverLanguage, (keyof VoiceOverFormData)[]> = {
  english: ['title_english'],
  japanese: ['title_japanese'],
  korean: ['title_korean'],
  chinese: ['title_chinese', 'title_chinese_traditional'],
};

/** Repeated lines are saved as `{Title} 01.ogg`, `{Title} 02.ogg`, … */
const VARIANT_SUFFIX = /^(.*?)[ _](\d{2})$/;

/** Characters Windows forbids in file names; `:` is saved as ` - `, the rest are dropped. */
const ILLEGAL_FILENAME_CHARS = /["*/:<>?\\|]/g;

export type MatchStatus = 'matched' | 'duplicate' | 'unmatched';

export interface AudioFileEntry {
  /** `{type}/{code}/{file}` as picked, used for display. */
  relativePath: string;
  fileName: string;
  type: string;
  languageFolder: string;
  language?: VoiceOverLanguage;
  /** File name without extension and without the ` NN` variant suffix. */
  title: string;
  variant?: number;
  /** Path written into the voice over row. */
  assetPath: string;
}

export interface AudioMatch {
  audio: AudioFileEntry;
  status: MatchStatus;
  target?: VoiceOverWrapper;
  /** Why it could not be placed, shown next to the manual assignment control. */
  reason?: string;
}

export interface MatchResult {
  matches: AudioMatch[];
  matched: number;
  duplicates: number;
  unmatched: AudioMatch[];
  /** Voice over / language pairs left without audio after matching. */
  missing: { wrapper: VoiceOverWrapper; language: VoiceOverLanguage }[];
}

// ── Normalisation ─────────────────────────────────────────────────────────────

/**
 * Compares a title to a file name. `:` becomes ` - ` on disk and the other
 * forbidden characters are dropped, so both sides are folded the same way.
 */
export function normalizeTitle(value: string | undefined | null): string {
  if (!value) {
    return '';
  }
  return value
    .normalize('NFC')
    .replace(/:/g, ' - ')
    .replace(ILLEGAL_FILENAME_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function stripExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.substring(0, dot) : fileName;
}

// ── Reading the picked folder ─────────────────────────────────────────────────

/**
 * Turns picked files into entries. A directory pick exposes `webkitRelativePath`,
 * whose last three segments are always `{type}/{language}/{file}`.
 */
export function readAudioFiles(files: File[], characterName: string): AudioFileEntry[] {
  const entries: AudioFileEntry[] = [];

  for (const file of files) {
    const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    const segments = path.split('/').filter((segment) => segment.length > 0);
    if (segments.length < 3) {
      continue;
    }

    const [type, languageFolder, fileName] = segments.slice(-3);
    const stem = stripExtension(fileName);
    const variantMatch = VARIANT_SUFFIX.exec(stem);

    entries.push({
      relativePath: `${type}/${languageFolder}/${fileName}`,
      fileName,
      type,
      languageFolder,
      language: LANGUAGE_BY_FOLDER[languageFolder.toLowerCase()],
      title: variantMatch ? variantMatch[1] : stem,
      variant: variantMatch ? Number(variantMatch[2]) : undefined,
      assetPath: `${VOICE_OVER_ASSET_ROOT}/${characterName}/${type}/${languageFolder}/${fileName}`,
    });
  }

  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/** Audio only - the picker also hands over cover art, transcripts and the like. */
export function isAudioFile(fileName: string): boolean {
  return /\.(ogg|mp3|wav|opus|m4a|aac|flac)$/i.test(fileName);
}

// ── Matching ──────────────────────────────────────────────────────────────────

/**
 * Places every audio file on the voice over whose title it carries.
 *
 * Titles repeat within a type (three "Elemental Skill" lines), so the ` NN`
 * suffix selects the n-th of them in `order`. A file whose slot is already
 * filled is a duplicate rather than a conflict: the Chinese folder holds the
 * same clip twice, once per spelling.
 */
export function matchAudioToVoiceOvers(audioFiles: AudioFileEntry[], voiceOvers: VoiceOverWrapper[]): MatchResult {
  const assigned = new Map<VoiceOverWrapper, Set<VoiceOverLanguage>>();
  const matches: AudioMatch[] = [];

  for (const audio of audioFiles) {
    const language = audio.language;
    if (!language) {
      matches.push({ audio, status: 'unmatched', reason: `Unknown language folder "${audio.languageFolder}"` });
      continue;
    }

    const candidates = findCandidates(audio, voiceOvers, language);
    if (candidates.length === 0) {
      matches.push({ audio, status: 'unmatched', reason: `No "${audio.type}" voice over titled "${audio.title}"` });
      continue;
    }

    let target: VoiceOverWrapper | undefined;
    if (audio.variant !== undefined) {
      target = candidates[audio.variant - 1];
      if (!target) {
        matches.push({ audio, status: 'unmatched', reason: `Only ${candidates.length} line(s) titled "${audio.title}"` });
        continue;
      }
    } else if (candidates.length === 1) {
      target = candidates[0];
    } else {
      matches.push({ audio, status: 'unmatched', reason: `${candidates.length} lines share the title "${audio.title}"` });
      continue;
    }

    const languages = assigned.get(target) ?? new Set<VoiceOverLanguage>();
    if (languages.has(language)) {
      matches.push({ audio, status: 'duplicate', target });
      continue;
    }
    languages.add(language);
    assigned.set(target, languages);
    matches.push({ audio, status: 'matched', target });
  }

  const missing: MatchResult['missing'] = [];
  for (const wrapper of voiceOvers) {
    for (const language of Object.keys(TITLE_FIELDS) as VoiceOverLanguage[]) {
      if (!assigned.get(wrapper)?.has(language)) {
        missing.push({ wrapper, language });
      }
    }
  }

  return {
    matches,
    matched: matches.filter((match) => match.status === 'matched').length,
    duplicates: matches.filter((match) => match.status === 'duplicate').length,
    unmatched: matches.filter((match) => match.status === 'unmatched'),
    missing,
  };
}

/** Voice overs of the file's type whose title in that language is the file name, in `order`. */
function findCandidates(audio: AudioFileEntry, voiceOvers: VoiceOverWrapper[], language: VoiceOverLanguage): VoiceOverWrapper[] {
  const wanted = normalizeTitle(audio.title);
  const wantedWithVariant = audio.variant !== undefined ? normalizeTitle(`${audio.title} ${String(audio.variant).padStart(2, '0')}`) : undefined;

  const candidates = voiceOvers.filter((wrapper) => {
    if (wrapper.data.type !== audio.type) {
      return false;
    }
    return TITLE_FIELDS[language].some((field) => {
      const title = normalizeTitle(wrapper.data[field] as string | undefined);
      return title.length > 0 && (title === wanted || title === wantedWithVariant);
    });
  });

  return candidates.sort((a, b) => a.data.order - b.data.order);
}

/** Writes a match onto its voice over. Used for both automatic and manual assignment. */
export function applyMatch(match: AudioMatch): void {
  if (!match.target || !match.audio.language) {
    return;
  }
  match.target.data[`audio_${match.audio.language}`] = match.audio.assetPath;
}

// ── Parsing the pasted JSON ───────────────────────────────────────────────────

/** Fields copied straight across when they appear in the source object. */
const TEXT_FIELDS: (keyof VoiceOverFormData)[] = [
  'title_english',
  'title_japanese',
  'title_chinese',
  'title_chinese_traditional',
  'title_korean',
  'text_english',
  'text_japanese',
  'text_chinese',
  'text_chinese_traditional',
  'text_korean',
  'text_japanese_reading',
  'text_chinese_reading',
  'text_korean_reading',
];

export interface ParsedVoiceOvers {
  wrappers: VoiceOverWrapper[];
  /** Types present in the JSON that the API does not know about. */
  unknownTypes: string[];
}

/**
 * Accepts a flat array, `{ voice_overs: [...] }`, or a map of
 * `{ story: [...], combat: [...] }`. `order` is optional and filled per type.
 */
export function parseVoiceOverJson(raw: string, knownTypes: string[]): ParsedVoiceOvers {
  const source = JSON.parse(raw);
  const items: Record<string, unknown>[] = [];

  const push = (entry: unknown, fallbackType?: string) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }
    const record = { ...(entry as Record<string, unknown>) };
    if (fallbackType && !record['type']) {
      record['type'] = fallbackType;
    }
    items.push(record);
  };

  if (Array.isArray(source)) {
    source.forEach((entry) => push(entry));
  } else if (source && typeof source === 'object') {
    const container = source as Record<string, unknown>;
    const nested = container['voice_overs'] ?? container['voiceOvers'];
    if (Array.isArray(nested)) {
      nested.forEach((entry) => push(entry));
    } else {
      for (const [key, value] of Object.entries(container)) {
        if (Array.isArray(value)) {
          value.forEach((entry) => push(entry, key));
        }
      }
    }
  }

  if (items.length === 0) {
    throw new Error('No voice overs found. Expected an array, { voice_overs: [...] }, or { story: [...], combat: [...] }.');
  }

  const missingType = items.filter((item) => !item['type']).length;
  if (missingType > 0) {
    throw new Error(`${missingType} entr${missingType === 1 ? 'y is' : 'ies are'} missing a "type".`);
  }

  const ordersByType = new Map<string, number>();
  const wrappers = items.map((item) => {
    const type = String(item['type']);
    const nextOrder = (ordersByType.get(type) ?? 0) + 1;
    ordersByType.set(type, nextOrder);

    const data: Record<string, unknown> = {
      type,
      order: Number(item['order']) > 0 ? Number(item['order']) : nextOrder,
      title_english: String(item['title_english'] ?? ''),
    };
    for (const field of TEXT_FIELDS) {
      const value = item[field];
      if (value !== undefined && value !== null && value !== '') {
        data[field] = String(value);
      }
    }
    return { uid: createUid(), data: data as unknown as VoiceOverFormData, audio: {} } as VoiceOverWrapper;
  });

  const unknownTypes = [...new Set(wrappers.map((wrapper) => wrapper.data.type))].filter((type) => !knownTypes.includes(type));

  return { wrappers, unknownTypes };
}
