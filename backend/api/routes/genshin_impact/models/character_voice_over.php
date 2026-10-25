<?php

class CharacterVoiceOver extends DbModel
{
    /** The texts kept as HTML (a dialogue's speakers in <b>), each through the family's allow-list as it is kept. */
    private const RICH_TEXTS = ['text_english', 'text_japanese', 'text_chinese', 'text_korean'];

    public function __construct(
        /** The set this line belongs to; characters reach their lines through it. */
        public readonly int $voice_over_set_id,
        public readonly int $order,
        public readonly string $type,
        public readonly string $title_english,
        /** The line's language-independent label, e.g. "Elemental Skill: I". */
        public readonly ?string $name = null,
        public readonly ?string $text_english = null,
        public readonly ?string $title_japanese = null,
        public readonly ?string $title_chinese = null,
        public readonly ?string $title_korean = null,
        public readonly ?string $text_japanese = null,
        public readonly ?string $text_chinese = null,
        public readonly ?string $text_korean = null,
        public readonly ?int $audio_english_file_id = null,
        public readonly ?int $audio_japanese_file_id = null,
        public readonly ?int $audio_chinese_file_id = null,
        public readonly ?int $audio_korean_file_id = null,
    ) {}

    public function toDbArray(): array
    {
        return self::cleanTexts(parent::toDbArray());
    }

    public static function partialToDbArray(array $body): array
    {
        return self::cleanTexts(parent::partialToDbArray($body));
    }

    /**
     * Every write of a line - one line (POST, PUT /api/characters-voice-overs), a character's whole set
     * (characters_full.php) - keeps its texts through the allow-list (cleanRichText(), api/rich_text.php), whoever
     * sent them: what the site shows, and nothing that can run. A text with no words left is none (null).
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    private static function cleanTexts(array $data): array
    {
        foreach (self::RICH_TEXTS as $field) {
            if (array_key_exists($field, $data) && is_string($data[$field])) {
                $data[$field] = cleanRichText($data[$field]);
            }
        }

        return $data;
    }
}
