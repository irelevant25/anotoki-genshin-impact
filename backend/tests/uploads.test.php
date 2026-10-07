<?php

declare(strict_types=1);

/**
 * What an upload may be called, where it may be written, and the guard in
 * front of the folders it is written to (api/upload_guard.php,
 * api/asset_naming.php).
 *
 * The attack these stop: an editor uploads `shell.php.png` - a picture by its
 * bytes and by its last extension - and an Apache that maps PHP with
 * AddHandler runs it, because mod_mime reads every part of a name after the
 * first dot as an extension. The same through an audio upload, whose bytes
 * nobody checks (`shell.php.mp3`), a rename, or a file restored from the trash.
 */

require __DIR__ . '/lib.php';
require TEST_BACKEND . '/api/helpers.php';
require TEST_BACKEND . '/api/asset_naming.php';

// ── A name a server could run ───────────────────────────────────────────────

echo "A name a server could run\n";

$runs = [
    'shell.php.png', 'SHELL.PHP.PNG', 'shell.pHp.jpg', 'x.phtml.jpg', 'x.phar.avif', 'x.pht.gif',
    'x.php3.png', 'x.php4.png', 'x.php5.webp', 'x.php6.png', 'x.php7.png', 'x.php8.png', 'x.phps.png',
    'x.cgi.png', 'x.pl.mp3', 'x.py.ogg', 'x.sh.wav', 'x.asp.png', 'x.aspx.png', 'x.jsp.png', 'x.shtml.png',
    'x.htaccess.png', 'x.htpasswd.png', 'x.ini.png', 'a.b.php.png', 'shell.php', 'shell.php.mp3',
    '.htaccess', '.user.ini', '.htpasswd', '..php.png',
];
foreach ($runs as $name) {
    check("'$name' could run", uploadNameRunsOnServer($name));
}

$fine = [
    'HU_TAO.avif', '1.0 - Ballad in Goblets 2020-09-28.avif', "...Now That's Rock 'N' Roll!.avif",
    'php.png', 'ini.png', 'Chat - Hobbies.opus', 'エミリエを知る・1.opus', 'shellphp.png', 'x.phpx.png',
    'x.php-.png', 'shell-php.png', 'shell-php.mp3', 'x.html.png', 'AQUILA_FAVONIA - ascension.avif',
];
foreach ($fine as $name) {
    check("'$name' is a plain file", !uploadNameRunsOnServer($name));
}

// ── The name an upload is stored under ──────────────────────────────────────

echo "The name an upload is stored under: one extension, its own\n";

$stems = [
    'shell.php' => 'shell-php',
    'SHELL.PHP' => 'SHELL-PHP',
    'shell.php.png' => 'shell-php-png',
    'x.phtml' => 'x-phtml',
    'x..php' => 'x--php',
    'a/b.php' => 'ab-php',
    'x.php ' => 'x-php',
    "x.php\t" => 'x-php',
    '5.0 - Epitome Invocation' => '5-0 - Epitome Invocation',
    'HU_TAO' => 'HU_TAO',
    'AQUILA_FAVONIA - ascension' => 'AQUILA_FAVONIA - ascension',
    'Chat: Hobbies' => 'Chat - Hobbies',
    'Hu Tao' => 'Hu Tao',
    'エミリエを知る・1' => 'エミリエを知る・1',
    'Hello.' => 'Hello-',
    '.htaccess' => null,
    '.user.ini' => null,
    '...Now' => null,
    '..' => null,
    '.' => null,
    '' => null,
    '   ' => null,
];
foreach ($stems as $asked => $stored) {
    same(var_export($asked, true) . ' is stored as ' . var_export($stored, true), $stored, _assetUploadStem($asked));
}

// Whatever was asked for, the name on disk - stem and an allowed extension -
// is never one a server would run.
foreach (['shell.php', 'x.phtml', 'x.php5', 'evil.cgi', 'a.b.c.php', 'x.htaccess', 'x.ini'] as $asked) {
    foreach (['png', 'avif', 'mp3', 'opus'] as $extension) {
        $name = _assetUploadStem($asked) . '.' . $extension;
        check("'$asked' + .$extension lands as '$name', which cannot run", !uploadNameRunsOnServer($name));
    }
}

echo "Replacing a file keeps its name - never a script's\n";

$tree = testTempDir('stems');
foreach (['1.0 - Ballad in Goblets 2020-09-28.avif', 'shell.php.png', '[1.0] Odd.avif', 'Two.Dots.extra.avif', 'Hello. 01.opus'] as $file) {
    file_put_contents("$tree/$file", 'x');
}
same('an existing banner keeps its dotted name', '1.0 - Ballad in Goblets 2020-09-28', _assetUploadStem('1.0 - Ballad in Goblets 2020-09-28', $tree));
same('a new one is dashed', '1-0 - Something New', _assetUploadStem('1.0 - Something New', $tree));
same('shell.php is dashed though shell.php.png is there', 'shell-php', _assetUploadStem('shell.php', $tree));
same('a bracket is escaped for glob() once, not twice', '[[]1.0[]] Odd', _globEscape('[1.0] Odd'));
same('a name with glob characters is found', '[1.0] Odd', _assetUploadStem('[1.0] Odd', $tree));
same('"Two.Dots" is not taken by "Two.Dots.extra.avif"', 'Two-Dots', _assetUploadStem('Two.Dots', $tree));
same('"Two.Dots.extra" is', 'Two.Dots.extra', _assetUploadStem('Two.Dots.extra', $tree));
same('a voice over re-upload keeps its clip\'s name', 'Hello. 01', _assetUploadStem('Hello. 01', $tree));
same('without a folder, nothing is kept', '1-0 - Ballad in Goblets 2020-09-28', _assetUploadStem('1.0 - Ballad in Goblets 2020-09-28'));

same('the stored stem of a path', '1-0 - X', _assetStoredStem('../assets/banners/1-0 - X.avif'));
same('the stored stem keeps a kept name whole', '1.0 - X', _assetStoredStem('../assets/banners/1.0 - X.avif'));
same('the stored stem of a voice over', 'Hello- 01', _assetStoredStem('assets/character/voice_overs/A/b/en/Hello- 01.opus'));

// ── Inside the tree ──────────────────────────────────────────────────────────

echo "Inside the tree: the separator, and links\n";

$base = testTempDir('contain');
mkdir("$base/assets/a", 0777, true);
mkdir("$base/assets-old", 0777, true);
file_put_contents("$base/assets/a/b.png", 'x');
file_put_contents("$base/assets-old/x.png", 'x');
$root = realpath("$base/assets");

check('a file in the tree is inside', _assetPathInside(realpath("$base/assets/a/b.png"), $root));
check('a folder in the tree is inside', _assetPathInside(realpath("$base/assets/a"), $root));
check('a sibling that starts with the same letters is not (assets-old/)', !_assetPathInside(realpath("$base/assets-old/x.png"), $root));
check('the sibling folder itself is not', !_assetPathInside(realpath("$base/assets-old"), $root));
check('the tree itself is not inside itself', !_assetPathInside($root, $root));
check('...unless asked (orRoot)', _assetPathInside($root, $root, orRoot: true));
check('a path that does not resolve (false) is not', !_assetPathInside(false, $root));
check('no tree (false) holds nothing', !_assetPathInside(realpath("$base/assets/a/b.png"), false));
check('Windows separators: inside', _assetPathInside('C:\\site\\assets\\a\\b.png', 'C:\\site\\assets'));
check('Windows separators: the sibling is not', !_assetPathInside('C:\\site\\assets-old\\b.png', 'C:\\site\\assets'));
check('a trailing separator on the root changes nothing', !_assetPathInside('/site/assets-old/b.png', '/site/assets/'));

mkdir("$base/elsewhere", 0777, true);
file_put_contents("$base/elsewhere/f.png", 'x');
if (testLinkDir("$base/elsewhere", "$base/assets/out")) {
    check('a link in the tree pointing out of it is not inside', !_assetPathInside(realpath("$base/assets/out/f.png"), $root));
} else {
    echo "  (skipped: this computer cannot make a link to try a link out of the tree)\n";
}

// ── The folder an upload goes into ───────────────────────────────────────────

echo "The folder an upload goes into: inside the tree, behind its guard\n";

$site = testTempDir('upload-dir');
$tree = "$site/assets";
$made = _assetUploadDir('character/icon', $tree);
check('a checkout without the tree gets one, and the folder', $made !== null && is_dir("$tree/character/icon"));
check('the folder it answers is the real one, inside', $made !== null && _assetPathInside($made, realpath($tree)));
same('the guard is written before anything else', uploadGuardHtaccess(), (string) @file_get_contents("$tree/.htaccess"));
file_put_contents("$tree/.htaccess", "# the host's own\n" . uploadGuardRules());
_assetUploadDir('weapons', $tree);
same('an .htaccess already there is left as it is', "# the host's own\n" . uploadGuardRules(), file_get_contents("$tree/.htaccess"));

mkdir("$site/elsewhere", 0777, true);
if (testLinkDir("$site/elsewhere", "$tree/out")) {
    same('a folder that is a link out of the tree is refused', null, _assetUploadDir('out', $tree));
    same('...and so is anything below it', null, _assetUploadDir('out/new/deeper', $tree));
    check('...and nothing was made where it points', !file_exists("$site/elsewhere/new"));
} else {
    echo "  (skipped: this computer cannot make a link to try a link out of the tree)\n";
}

// A tree whose guard cannot be written takes nothing: here a folder sits where
// the .htaccess would go.
$locked = testTempDir('no-guard');
mkdir("$locked/assets/.htaccess", 0777, true);
$refusal = null;
try {
    _assetUploadDir('banners', "$locked/assets");
} catch (ApiRefusal $caught) {
    $refusal = $caught;
}
check('no guard and none can be written: refused, 500 upload_guard', $refusal !== null && $refusal->status === 500 && $refusal->refusal === 'upload_guard');
check('...and the folder was not made', !is_dir("$locked/assets/banners"));

// ── The guard itself ─────────────────────────────────────────────────────────

echo "The guard: only rules that cannot take the folder down\n";

/** The directives of an .htaccess: those outside every <IfModule>, and all of them. */
function directivesOf(string $htaccess): array
{
    $outside = [];
    $all = [];
    $depth = 0;
    foreach (preg_split('/\R/', $htaccess) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (preg_match('/^<IfModule\s+\S+>$/i', $line)) {
            $depth++;
            continue;
        }
        if (preg_match('/^<\/IfModule>$/i', $line)) {
            $depth--;
            continue;
        }
        $directive = strtolower((string) strtok($line, " \t>"));
        $all[] = $directive;
        if ($depth === 0) {
            $outside[] = $directive;
        }
    }

    return ['outside' => $outside, 'all' => $all];
}

/**
 * Directives that answer 500 for every file in the folder on a host whose
 * AllowOverride does not allow them - php_flag needs Options even under mod_php,
 * and is unknown without it - inside <IfModule> or not.
 */
const FOLDER_BREAKERS = ['php_flag', 'php_value', 'php_admin_flag', 'php_admin_value', 'options', 'require', 'order', 'deny', 'allow'];

$uploads = str_replace("\r\n", "\n", (string) file_get_contents(TEST_BACKEND . '/public/uploads/.htaccess'));
foreach (['the generated guard' => uploadGuardHtaccess(), 'public/uploads/.htaccess' => $uploads] as $label => $htaccess) {
    $directives = directivesOf($htaccess);
    same("$label: nothing but RemoveHandler and RemoveType outside <IfModule>", ['removehandler', 'removetype'], $directives['outside']);
    same("$label: no php_flag, Options or Require anywhere, <IfModule> or not", [], array_values(array_intersect($directives['all'], FOLDER_BREAKERS)));
    check("$label: no line starts with php_flag", !preg_match('/^\s*php_flag\b/mi', $htaccess));
}
same('the guard is RemoveHandler and RemoveType, nothing more', ['removehandler', 'removetype'], directivesOf(uploadGuardRules())['all']);
foreach (['.php', '.phtml', '.phar', '.pht', '.php3', '.php5', '.php7', '.php8', '.phps', '.cgi', '.pl', '.py', '.sh', '.shtml'] as $extension) {
    check("RemoveHandler and RemoveType take $extension", (bool) preg_match('/^RemoveHandler .*' . preg_quote($extension, '/') . '( |$)/m', uploadGuardRules())
        && (bool) preg_match('/^RemoveType .*' . preg_quote($extension, '/') . '( |$)/m', uploadGuardRules()));
}
check('public/uploads/.htaccess carries the same rules, word for word', str_contains($uploads, uploadGuardRules()));

$guarded = testTempDir('ensure');
check('ensureUploadGuard() writes one where there is none', ensureUploadGuard($guarded) && file_get_contents("$guarded/.htaccess") === uploadGuardHtaccess());
check('...and leaves no temporary file behind', glob("$guarded/.htaccess.*") === []);
check('a folder that is not there has none', !ensureUploadGuard("$guarded/missing"));
