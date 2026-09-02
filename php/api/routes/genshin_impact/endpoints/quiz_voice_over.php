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
//   one character   a line credited to several characters has no single right
//                   answer, so lines with a second character are left out
//   english audio   the quiz plays the English recording and shows the English
//                   text, so a line missing either cannot be asked
//   no traveller    Aether and Lumine are excluded from the quiz everywhere, as
//                   the same character under twelve rows
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
                vo.audio_english,
                c.id   AS character_id,
                c.name AS character_name,
                c.icon_name,
                c.wish_icon_name,
                c.rarity,
                c.element
           FROM characters_voice_overs vo
           JOIN characters c ON c.id = vo.character_id
          WHERE vo.deleted = FALSE
            AND c.deleted = FALSE
            AND c.is_traveler = FALSE
            AND vo.character_id_2 IS NULL
            AND vo.audio_english IS NOT NULL AND vo.audio_english <> ''
            AND vo.text_english  IS NOT NULL AND vo.text_english  <> ''
          ORDER BY random()
          LIMIT 1"
    );

    $row = $statement->fetch(PDO::FETCH_ASSOC);

    return $row
        ? respondJson($response, $row)
        : respondJson($response, ['error' => 'No voice over available'], 404);
})->add(responds(QuizVoiceOverRound::class));
