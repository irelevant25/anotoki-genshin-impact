import { Component, computed, inject, signal } from '@angular/core';
import { ButtonComponent as KitButtonComponent } from '@anotoki/lib/ui/button';
import { ANOTOKI_DIALOG_DATA, DialogFooterDirective } from '@anotoki/lib/ui/dialog';
import { AbstractModalComponent } from '../../../../../../shared/local-lib/abstract-modal.class';
import { ButtonComponent } from '@anotoki/lib/ui/button';
import { TooltipDirective } from '@anotoki/lib/ui/tooltip';
import { CheckboxComponent, SelectComponent, TextareaComponent } from '@anotoki/lib/ui/forms';
import { ChoiceFieldDirective } from '../../../../../../shared/local-lib/fields/choice-field.directive';
import { FileComponent, FileItemType } from '../../../../../../shared/local-lib/components/file/file.component';
import { FilePickerComponent } from '@anotoki/lib/ui/file-picker';
import { DisclosureComponent } from '@anotoki/lib/ui/disclosure';
import { DropdownOption } from '../../../../../../shared/local-lib/services/options-helper.service';
import { VOICE_OVER_LANGUAGES, VOICE_OVER_TYPES, VoiceOverLanguage, VoiceOverWrapper } from '../../character-form.model';
import { applyMatch, AudioMatch, isAudioFile, matchAudioToVoiceOvers, MatchResult, parseVoiceOverJson, readAudioFiles, VOICE_OVER_ASSET_ROOT } from './voice-over-import.model';

export interface VoiceOverImportResult {
  wrappers: VoiceOverWrapper[];
  replaceExisting: boolean;
}

/** What the voice-over tab hands over when it opens the import. */
export interface VoiceOverImportData {
  characterName: string;
  existingCount: number;
}

@Component({
  selector: 'app-voice-overs-import',
  templateUrl: './voice-overs-import.component.html',
  styleUrls: ['./voice-overs-import.component.scss'],
  imports: [
    TooltipDirective,
    KitButtonComponent,
    DialogFooterDirective,
    ButtonComponent,
    TextareaComponent,
    CheckboxComponent,
    SelectComponent,
    ChoiceFieldDirective,
    FileComponent,
    FilePickerComponent,
    DisclosureComponent,
  ],
})
export class VoiceOversImportComponent extends AbstractModalComponent {
  private readonly _data = inject<VoiceOverImportData | null>(ANOTOKI_DIALOG_DATA, { optional: true });

  /** Whose lines these are, and how many they have now: what the opener hands over. */
  characterName = signal<string>(this._data?.characterName ?? '');
  readonly voiceOverTypes = VOICE_OVER_TYPES;
  existingCount = signal<number>(this._data?.existingCount ?? 0);

  json = signal<string>('');
  jsonError = signal<string | undefined>(undefined);
  audioError = signal<string | undefined>(undefined);
  replaceExisting = signal<boolean>(true);

  parsed = signal<VoiceOverWrapper[] | undefined>(undefined);
  unknownTypes = signal<string[]>([]);
  audioFileCount = signal(0);
  result = signal<MatchResult | undefined>(undefined);

  /** Voice over counts per type, for the parsed-JSON summary. */
  typeSummary = computed(() => {
    const counts = new Map<string, number>();
    for (const wrapper of this.parsed() ?? []) {
      counts.set(wrapper.data.type, (counts.get(wrapper.data.type) ?? 0) + 1);
    }
    return [...counts.entries()].map(([type, count]) => `${type} ${count}`).join(' · ');
  });

  assetRoot = computed(() => `${VOICE_OVER_ASSET_ROOT}/${this.characterName() || '{character}'}/{type}/{lang}/`);

  /** Every parsed voice over, as options for manually placing a stray file. */
  voiceOverOptions = computed<DropdownOption[]>(() =>
    (this.parsed() ?? [])
      .slice()
      .sort((a, b) => a.data.type.localeCompare(b.data.type) || a.data.order - b.data.order)
      .map((wrapper) => ({
        key: wrapper.uid,
        value: `${wrapper.data.type} · ${wrapper.data.order}. ${wrapper.data.title_english || 'Untitled'}`,
      })),
  );

  languageOptions: DropdownOption[] = VOICE_OVER_LANGUAGES.map((language) => ({ key: language, value: language }));

  /** Kept out of the template - literal braces there read as an ICU message. */
  readonly folderLayout = '{type}/{lang}/{Title}.ogg';

  /** Shown above the paste box so the expected shape is obvious. */
  readonly jsonExample = [
    '[',
    '  {',
    '    "type": "story",',
    '    "order": 1,',
    '    "name": "Hello",',
    '    "title_english": "Hello",',
    '    "title_japanese": "初めまして…",',
    '    "title_chinese": "初次见面…",',
    '    "title_korean": "첫 만남…",',
    '    "text_english": "Amber, Outrider of the Knights of Favonius, at your service!",',
    '    "text_japanese": "西風騎士団偵察騎士、アンバー、ただいま参上！",',
    '    "text_chinese": "西风骑士团侦察骑士，安柏，前来报到！",',
    '    "text_korean": "페보니우스 기사단 정찰기사 엠버, 방금 도착했어!"',
    '  }',
    ']',
  ].join('\n');

  missingSummary = computed(() => {
    const missing = this.result()?.missing ?? [];
    const byLanguage = new Map<string, number>();
    for (const entry of missing) {
      byLanguage.set(entry.language, (byLanguage.get(entry.language) ?? 0) + 1);
    }
    return [...byLanguage.entries()].map(([language, count]) => `${language} ${count}`).join(' · ');
  });

  canImport = computed(() => (this.parsed()?.length ?? 0) > 0);

  /** Why step 2 is not available yet, or undefined when it is. */
  folderBlockedReason = computed(() => {
    if (!this.characterName()) {
      return 'Set the character name on the Base Info tab first — it forms the asset path.';
    }
    if (!this.parsed()) {
      return 'Add the voice over data above first — files are matched against its titles.';
    }
    return undefined;
  });
  unresolvedCount = computed(() => (this.result()?.unmatched ?? []).filter((match) => !match.target).length);

  // ── Step 1: voice over data ─────────────────────────────────────────────────

  /** The JSON file chosen in the kit's picker - one at a time - read here, its words into the box below. */
  readonly jsonFiles = signal<readonly File[]>([]);

  onJsonFilesChosen(files: readonly File[]): void {
    this.jsonFiles.set(files);
    const file = files[0];
    if (!file) {
      return;
    }
    file
      .text()
      .then((text) => {
        this.json.set(text);
        this.parseJson(text);
      })
      .catch(() => this.jsonError.set('Could not read the file.'));
  }

  onJsonChange(value: string | number | undefined | null): void {
    this.json.set(String(value ?? ''));
    this.parseJson(this.json());
  }

  parseJson(raw: string): void {
    const text = raw.trim();
    if (!text) {
      this.parsed.set(undefined);
      this.unknownTypes.set([]);
      this.result.set(undefined);
      this.jsonError.set(undefined);
      return;
    }

    try {
      const { wrappers, unknownTypes } = parseVoiceOverJson(text, this.voiceOverTypes);
      this.parsed.set(wrappers);
      this.unknownTypes.set(unknownTypes);
      this.jsonError.set(undefined);
      this._rematch();
    } catch (error) {
      this.parsed.set(undefined);
      this.unknownTypes.set([]);
      this.result.set(undefined);
      this.jsonError.set(error instanceof Error ? error.message : 'Invalid JSON.');
    }
  }

  // ── Step 2: audio folder ────────────────────────────────────────────────────

  private _audioFiles: File[] = [];

  onAudioFolderSelect(files: FileItemType[] | undefined | null): void {
    const picked = (files ?? []).map((item) => item.file).filter((file): file is File => !!file && isAudioFile(file.name));

    this._audioFiles = picked;
    this.audioFileCount.set(picked.length);
    this.audioError.set(picked.length === 0 ? 'No audio files in the selected folder.' : undefined);
    this._rematch();
  }

  private _rematch(): void {
    const wrappers = this.parsed();
    if (!wrappers || this._audioFiles.length === 0) {
      this.result.set(undefined);
      return;
    }
    const entries = readAudioFiles(this._audioFiles, this.characterName());
    this.result.set(matchAudioToVoiceOvers(entries, wrappers));
  }

  // ── Step 3: manual assignment ───────────────────────────────────────────────

  assignTarget(match: AudioMatch, uid: string | number | boolean | undefined | null): void {
    match.target = (this.parsed() ?? []).find((wrapper) => wrapper.uid === Number(uid));
    this.result.update((result) => (result ? { ...result } : result));
  }

  assignLanguage(match: AudioMatch, language: string | number | boolean | undefined | null): void {
    match.audio.language = (language as VoiceOverLanguage) || undefined;
    this.result.update((result) => (result ? { ...result } : result));
  }

  /** Drops a stray file from the list - for audio that has no line to belong to. */
  removeUnmatched(match: AudioMatch): void {
    this.result.update((result) =>
      result
        ? {
            ...result,
            matches: result.matches.filter((entry) => entry !== match),
            unmatched: result.unmatched.filter((entry) => entry !== match),
          }
        : result,
    );
  }

  // ── Commit ──────────────────────────────────────────────────────────────────

  confirmImport(): void {
    const wrappers = this.parsed();
    if (!wrappers) {
      return;
    }

    for (const match of this.result()?.matches ?? []) {
      if (match.status !== 'duplicate') {
        applyMatch(match);
      }
    }

    this.dialogRef?.close({ wrappers, replaceExisting: this.replaceExisting() } as VoiceOverImportResult);
  }

  cancel(): void {
    this.dialogRef?.close(undefined);
  }
}
