/**
 * The banners grouped the way they ran: by version, and inside it by phase -
 * the banners that share their first and last day. The date and the state are
 * then said once a phase, on its rail, instead of beside every banner (the
 * owner's choice of 2026-10-21 among the mockups, "Timeline").
 *
 * Pure functions over the rows the page already has; the banner table keeps
 * neither a phase nor a kind, so both are read off the rows.
 */

export type BannerState = 'upcoming' | 'running' | 'ended';
export type BannerKind = 'character' | 'weapon';

/** What a banner row needs to carry to be grouped. */
export interface BannerLike {
  id: number;
  version: string;
  duration_from: string;
  duration_to: string | null;
  weapons?: readonly unknown[];
}

export interface BannerPhase<T extends BannerLike> {
  key: string;
  from: string;
  to: string | null;
  /** Its number within the version, the earliest phase first - from the whole list, so a filter never renumbers it. */
  number: number;
  state: BannerState;
  /** Days to its first day while upcoming, to its last while running; null once ended, or running with no last day. */
  days: number | null;
  banners: T[];
}

export interface BannerVersion<T extends BannerLike> {
  version: string;
  count: number;
  phases: BannerPhase<T>[];
}

const DAY = 86_400_000;

/** The day of a stored stamp ("2026-09-23 00:00:00" -> "2026-09-23"). */
export function dayOf(stamp: string): string {
  return stamp.slice(0, 10);
}

/** Whole days from one day to another, the stamps' time of day ignored. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${dayOf(to)}T00:00:00Z`) - Date.parse(`${dayOf(from)}T00:00:00Z`)) / DAY);
}

export function bannerState(from: string, to: string | null, today: string): BannerState {
  if (dayOf(from) > today) {
    return 'upcoming';
  }
  if (!to || dayOf(to) >= today) {
    return 'running';
  }
  return 'ended';
}

/** The banners of one phase share their first and last day. */
export function phaseKey(banner: BannerLike): string {
  return `${banner.duration_from}|${banner.duration_to ?? ''}`;
}

/**
 * Every phase's number within its version, from the whole list: the earliest
 * phase is 1, so the second phase stays "Phase 2" when a filter hides the first.
 */
export function phaseNumbers(all: readonly BannerLike[]): Map<string, number> {
  const byVersion = new Map<string, Set<string>>();
  for (const banner of all) {
    const phases = byVersion.get(banner.version) ?? new Set<string>();
    phases.add(phaseKey(banner));
    byVersion.set(banner.version, phases);
  }
  const numbers = new Map<string, number>();
  for (const [version, phases] of byVersion) {
    [...phases].sort().forEach((key, index) => numbers.set(`${version}|${key}`, index + 1));
  }
  return numbers;
}

/**
 * The rows, already in the page's order (version newest first, then by first
 * day, a weapon banner after the character banners of its phase), folded
 * into versions and phases. The phases of a version come newest first, as the
 * versions do; the banners inside a phase keep the order they came in.
 */
export function groupBanners<T extends BannerLike>(rows: readonly T[], numbers: Map<string, number>, today: string): BannerVersion<T>[] {
  const versions: BannerVersion<T>[] = [];
  for (const banner of rows) {
    let version = versions.find((entry) => entry.version === banner.version);
    if (!version) {
      version = { version: banner.version, count: 0, phases: [] };
      versions.push(version);
    }
    version.count++;
    const key = phaseKey(banner);
    let phase = version.phases.find((entry) => entry.key === key);
    if (!phase) {
      const state = bannerState(banner.duration_from, banner.duration_to, today);
      phase = {
        key,
        from: banner.duration_from,
        to: banner.duration_to,
        number: numbers.get(`${banner.version}|${key}`) ?? version.phases.length + 1,
        state,
        days: state === 'upcoming' ? daysBetween(today, banner.duration_from) : state === 'running' && banner.duration_to ? daysBetween(today, banner.duration_to) : null,
        banners: [],
      };
      version.phases.push(phase);
    }
    phase.banners.push(banner);
  }
  for (const version of versions) {
    version.phases.sort((a, b) => b.from.localeCompare(a.from));
  }
  return versions;
}

/** A banner's kind, read off what it features: the table keeps none. */
export function bannerKind(banner: BannerLike): BannerKind {
  return banner.weapons?.length ? 'weapon' : 'character';
}

/** The banner's name as the page shows it: the data names a rerun by its first day ("Epitome Invocation 2026-09-23"). */
export function bannerLabel(name: string | null | undefined): string {
  return String(name ?? '').replace(/\s\d{4}-\d{2}-\d{2}$/, '');
}
