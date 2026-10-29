<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// ── /api/quiz/voice-over/random ───────────────────────────────────────────────
//
// One voice line, drawn at random, for the voice quiz to play.
//
// The other quizzes pick their question in the browser out of the character list
// they already hold. This one cannot: there are around eight thousand voice
// lines, and shipping them all so the page can throw away all but one would cost
// far more than the answer is worth.
//
// What counts as usable is decided here rather than by the caller, because every
// condition is about the data being answerable:
//
//   one character   a line lives in a voice-over set; a set shared by several
//                   characters has no single right answer, but the only shared
//                   sets are the Traveler's, already excluded on the next line
//   english audio   the quiz shows the English text and plays the English
//                   recording unless the player chose another language, so a
//                   line missing either cannot be asked
//   no traveller    Aether and Lumine are excluded from the quiz everywhere, as
//                   the same character under twelve rows
//
// The other three recordings come along, each null where the line has none:
// the player picks the language on the page, and a line without the one chosen
// plays in English (nearly every line has all four).
//
// Public, like the rest of the game content.

$app->get('/api/quiz/voice-over/random', function (Request $request, Response $response) {
    $pdo = genshinDb();

    // ORDER BY random() over the join is fine at this size and keeps the choice
    // in one round trip. Picking a character first and a line second would bias
    // the draw towards characters with few lines.
    $statement = $pdo->query(
        "SELECT vo.id,
                vo.type,
                vo.title_english,
                vo.text_english,
                vo.audio_english_file_id,
                vo.audio_japanese_file_id,
                vo.audio_chinese_file_id,
                vo.audio_korean_file_id,
                c.id   AS character_id,
                c.name AS character_name,
                c.icon_file_id,
                c.wish_icon_file_id,
                c.rarity,
                c.element
           FROM characters_voice_overs vo
           JOIN characters c ON c.voice_over_set_id = vo.voice_over_set_id
          WHERE vo.deleted = FALSE
            AND c.deleted = FALSE
            AND c.is_traveler = FALSE
            AND vo.audio_english_file_id IS NOT NULL
            AND vo.text_english  IS NOT NULL AND vo.text_english  <> ''
          ORDER BY random()
          LIMIT 1",
    );

    $row = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        return respondJson($response, ['error' => 'No voice over available'], 404);
    }

    // Two tables' worth of columns share this one flat row - resolved in turn,
    // since each call only ever touches the keys it was configured for.
    $rows = [$row];
    resolveAssetRows($pdo, 'characters_voice_overs', $rows);
    resolveAssetRows($pdo, 'characters', $rows);

    return respondJson($response, $rows[0]);
})->add(responds(QuizVoiceOverRound::class));
