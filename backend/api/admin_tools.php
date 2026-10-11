<?php

/**
 * The anotoki library's modules, set up for this site (anotoki-lib 0.4.1) -
 * what the shared library does here, given this site's answers once:
 *
 *   - who a request is (Auth): the IAM's access token checked against the
 *     IAM's published keys, the IAM's switch "Sign-in required" - the
 *     library's AccessTokens, SignInRule and Identify, in place of the IAM's
 *     PHP SDK this site kept a copy of (api/anotoki_iam.php, gone);
 *   - its record of people (People): the rows of `users`, kept from the token
 *     (api/site_user.php), the admin panel's People page, and the scrub of the
 *     accounts the IAM deleted;
 *   - the admin tools - the error log, feedback, backups and the file explorer
 *     (the audit log is api/audit_log.php, which the command line loads too) -
 *     each the admin page of its own, for this site's ADMIN alone (the owner's
 *     decision: EDITORs see none of them).
 *
 * Each is made once per process, on first use. Nothing here needs the site to
 * be set up to be made: the SiteGate answers every request of a site that is
 * not before any of them is asked anything, and the API-spec generator loads
 * the routes without settings at all.
 *
 * Every refusal they answer is this API's {error, code, ...} (refusalResponse()),
 * so the pages read one shape, whoever refused.
 */

use Anotoki\Lib\Admin\AdminContext;
use Anotoki\Lib\Admin\Schema as AdminSchema;
use Anotoki\Lib\Auth\AccessTokens;
use Anotoki\Lib\Auth\Bearer;
use Anotoki\Lib\Auth\Http\Identify;
use Anotoki\Lib\Auth\IamClient;
use Anotoki\Lib\Auth\SignInRule;
use Anotoki\Lib\Backups\Backups;
use Anotoki\Lib\Backups\Copy;
use Anotoki\Lib\ErrorLog\ErrorLog;
use Anotoki\Lib\Feedback\Feedback;
use Anotoki\Lib\Files\FileExplorer;
use Anotoki\Lib\Files\FileRoot;
use Anotoki\Lib\Files\PathGuard;
use Anotoki\Lib\Migrations\Migrator;
use Anotoki\Lib\People\Http\PeopleUpkeep;
use Anotoki\Lib\People\People;
use Anotoki\Lib\People\PeopleColumn;
use Anotoki\Lib\People\PeopleTable;
use Anotoki\Lib\Support\JsonResponse;
use Anotoki\Lib\Support\Keys;
use Anotoki\Lib\Support\Refusal;
use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\App;
use Slim\Routing\RouteContext;

/** backend/storage - in the upload, storage/ beside api/ in the web root, denied to the web. */
function siteStorageDir(): string
{
    return dirname(__DIR__) . '/storage';
}

/**
 * A key of this site's own for one purpose (an HMAC of the error log's address
 * buckets, the feedback limits', the file explorer's preview links), derived
 * from the site secret - or null while there is none (not set up), when the
 * library would fall back on a key file of its own, which it never gets to.
 */
function siteKey(string $purpose): ?string
{
    $secret = localSecret();

    return $secret === null ? null : Keys::derive($secret, $purpose);
}

/** A refusal in this API's words, {error: sentence, code, ...what it is about}, never cached. */
function refusalResponse(ResponseInterface $response, Refusal $refusal): ResponseInterface
{
    return JsonResponse::write($response, $refusal->status, ['error' => $refusal->message, 'code' => $refusal->code] + $refusal->extra);
}

// ─── Who a request is ────────────────────────────────────────────────────────

/**
 * The IAM and this site there, from config/iam.local.php (config/iam.php): the
 * keys tokens are checked with and the answer about signing in are kept in its
 * cache_dir (storage/cache, the files the IAM's SDK kept, so nothing is asked
 * again for the move). A site not set up - or set up with an address the
 * library refuses (http to another computer) - gets an IAM of nobody: every
 * token refused, signing in required, failing closed.
 */
function siteIam(): IamClient
{
    static $iam = null;

    if ($iam !== null) {
        return $iam;
    }
    try {
        return $iam = IamClient::fromArray(iamClientConfig());
    } catch (NotSetUpException) {
        // Not set up: the SiteGate answers every request before this is asked.
    } catch (InvalidArgumentException $e) {
        error_log('[iam] ' . $e->getMessage());
    }

    return $iam = IamClient::fromArray(['cache_dir' => siteStorageDir() . '/cache']);
}

function siteAccessTokens(): AccessTokens
{
    static $tokens = null;

    return $tokens ??= new AccessTokens(siteIam());
}

/** The IAM's switch "Sign-in required" for this site: off by default, failing closed (api/site_settings.php). */
function siteSignInRule(): SignInRule
{
    static $rule = null;

    return $rule ??= new SignInRule(siteIam());
}

/**
 * Who a request is, once for every route (api/index.php puts it in front of the
 * gates, meddleware/auth.php's identifyRequests() around it): a Bearer token
 * that verifies is that person, one that does not is 401 invalid_token, and
 * anything else is nobody - never a cookie, never a body. No visitor closure:
 * this site's visitors are its own (api/visitors.php), and their key is read by
 * requireOwner() and requireVisitorKey() alone, as before.
 */
function siteIdentify(ResponseFactoryInterface $responses): Identify
{
    return new Identify(siteAccessTokens(), siteSignInRule(), $responses, responder: refusalResponse(...));
}

/**
 * What the admin tools are told of this site, once: who acts (the token's
 * person), whether they are this site's ADMIN (the token's roles - never the
 * database, so the error log and the backups work while an update waits), the
 * proof a backup asks for (a sign-in of the last ten minutes, the token's
 * auth_time - "Sign in again" on the page otherwise), the address bucket the
 * limits count (the trusted proxy's, config/visitors.php) and this API's error
 * body.
 */
function siteAdminContext(): AdminContext
{
    static $context = null;

    return $context ??= new AdminContext(
        actorId: static fn (ServerRequestInterface $request): ?int => Identify::person($request)?->sub,
        proof: AdminContext::recentSignIn(static fn (ServerRequestInterface $request): ?int => Identify::person($request)?->authTime),
        clientKey: static fn (ServerRequestInterface $request): string => clientAddressCounted($request),
        error: refusalResponse(...),
        isAdmin: static fn (ServerRequestInterface $request): bool => Identify::person($request)?->isAdmin() ?? false,
    );
}

// ─── The error log ───────────────────────────────────────────────────────────

/**
 * What went wrong, written down where the admin panel's Error log reads it:
 * files, so it works while the database cannot be reached or an update waits.
 * In storage/error-log - not storage/logs, where this site's own log kept its
 * days until this release: those files stay where they are, untouched (the
 * library deletes days past 30 in its own folder, and would in that one too),
 * until the owner removes them.
 *
 * Which answers are written is the anotoki family's rule, the library's
 * default - every 5xx, and 404, 405, 413, 415 and 429 (the owner's decision of
 * 2026-10-11, in place of this site's old "every answer of 400 and up"): a
 * refused token or role, a 409 or a 422 is the API doing its job, not
 * something to look into. An ApiRefusal is a decided answer, written (when the
 * rule writes its status) as that answer rather than as a failure with a
 * trace. The first caller (api/index.php) hands over the app, so each line
 * names its route. The pages' own errors (ErrorLogRoutes::client) are not
 * taken yet: the library's browser half that sends them comes with 0.4.2.
 */
function siteErrorLog(?App $app = null): ErrorLog
{
    static $log = null;

    return $log ??= new ErrorLog(siteStorageDir() . '/error-log', array_filter([
        'root' => dirname(__DIR__),
        'context' => siteAdminContext(),
        'actorId' => errorLogActor(...),
        'key' => siteKey('error-log'),
        'storage' => siteStorageDir(),
        'ignoreExceptions' => [ApiRefusal::class],
        'app' => $app,
    ], static fn (mixed $value): bool => $value !== null));
}

/**
 * Who a failing request was from, for its line: the person Identify found -
 * or, for what is written outside it (the error middleware and the answer's
 * own line run around the gates), the person a token that verifies names. A
 * token that does not verify names nobody.
 */
function errorLogActor(ServerRequestInterface $request): ?int
{
    $person = Identify::person($request);
    if ($person !== null) {
        return $person->sub;
    }
    $token = Bearer::token(Bearer::header($request));

    return $token === null ? null : siteAccessTokens()->verify($token)?->sub;
}

// ─── Feedback ────────────────────────────────────────────────────────────────

/**
 * The places a message can be about - the footer form's thirteen, as it has
 * always offered them (a message keeps the English value; the form shows each
 * in the reader's language).
 */
const FEEDBACK_SECTIONS = [
    'Daily', 'Quiz - Banners', 'Quiz - Pixelate', 'Quiz - Mismatch', 'Quiz - Music', 'Quiz - Dish', 'Quiz - Voice',
    'Difficulties', 'Database', "What's New", 'Backgrounds', 'Versions', 'Other',
];

/**
 * The form's fields beside its message, by the names the old form's columns
 * had - genshin_impact/029 moved the old messages' texts under the same names,
 * so the admin page shows old and new alike - and the most characters each
 * takes. The server keeps only these: a field the form sends under any other
 * name is passed over.
 */
const FEEDBACK_FIELDS = [
    'steps_to_reproduce' => 5000,
    'expected_behavior' => 2000,
    'actual_behavior' => 2000,
    'browser_device_info' => 500,
    'why_important' => 2000,
    'additional_info' => 5000,
];

/**
 * Feedback, the library's (the table anotoki_feedback): the footer's form and
 * the admin panel's Feedback page. Kinds bug, idea and other (the old Bug,
 * Suggestion and Other); a subject wanted for a bug or an idea, as the old
 * form wanted a title; five an hour and twenty a day from one address bucket,
 * three hundred a day from everybody, counted apart in storage/cache - nothing
 * of where a message came from is kept with it (the owner's decision). No mail.
 */
function siteFeedback(): Feedback
{
    static $feedback = null;

    return $feedback ??= new Feedback(static fn (): PDO => getDb(), array_filter([
        'storage' => siteStorageDir(),
        'sections' => FEEDBACK_SECTIONS,
        'fields' => FEEDBACK_FIELDS,
        'subjectRequiredFor' => ['bug', 'idea'],
        'key' => siteKey('feedback'),
        'defer' => afterResponse(...),
    ], static fn (mixed $value): bool => $value !== null));
}

/**
 * Who sends a message: the signed-in person, from their token - never from
 * what the form says. Their id alone: the reply address is what they leave in
 * the form's field, which the page fills with their account's - so a sender
 * who clears it is kept with none (the owner: "it's their choice"). Handed the
 * account's address too, the library would keep it whenever the field came
 * empty (the security review of 2026-10-11).
 */
function feedbackSender(ServerRequestInterface $request): ?array
{
    $person = Identify::person($request);

    return $person === null ? null : ['id' => $person->sub];
}

// ─── Backups ─────────────────────────────────────────────────────────────────

/**
 * Backups of the database without pg_dump - which no host of this site has -
 * by PostgreSQL's COPY through PDO, every table in one snapshot, into
 * storage/backups/<id>.anotoki-backup with the migrations it had applied: one
 * a day after the first answer of a UTC day (14 kept), one before every Apply
 * (5), one before a restore (5), and those made on the Backups page (kept until
 * deleted). Each made, downloaded (by a single-use link), deleted or restored
 * only with a sign-in of the last ten minutes, and audited.
 *
 * The pg_dump backups this site made before - storage/backups/<stamp>-<hex>/
 * and storage/backups/manual/ - are no backups of the library's: it never
 * lists or touches them. They stay where they are until the owner removes
 * them; a copy is downloaded by FTP.
 */
function siteBackups(): Backups
{
    static $backups = null;

    return $backups ??= new Backups(siteBackupConnection(...), siteStorageDir() . '/backups', [
        'site' => 'genshin',
        'migrator' => static fn (PDO $pdo): Migrator => siteMigrator($pdo),
        'lock' => MIGRATION_LOCK,
        'audit' => siteAudit(),
        'defer' => afterResponse(...),
        'onError' => static fn (Throwable $e) => siteErrorLog()->record($e),
        'afterRestore' => backupRestored(...),
    ]);
}

/**
 * A connection of the backups' own, to this site's database: a Pdo\Pgsql where
 * PHP has one (8.4 and up), so COPY raises no deprecation.
 */
function siteBackupConnection(): PDO
{
    $config = databaseConfig();
    $pdo = Copy::connect(
        "pgsql:host={$config['host']};port={$config['port']};dbname={$config['database']}",
        $config['username'],
        $config['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
    );
    $pdo->exec("SET NAMES '{$config['charset']}'");

    return $pdo;
}

/**
 * After a restore committed: the database is as it was then - and with it the
 * scrub's place in the IAM's list of deleted accounts, so whoever the IAM
 * deleted since the backup was made would be named here again. So the scrub
 * runs at once, on the restore's own connection (the survey's way). One that
 * does not finish - the IAM out of reach, its time up with more to read, a run
 * already going - is the restore's failure to say (the library's
 * after_restore_error: the Backups page's note, the error log), never a
 * restore that looks complete with a deleted person named again; and the
 * upkeep's hourly stamp goes after the answer (this request's own upkeep would
 * claim the hour again at once), so the next request runs the scrub again.
 * The figures the Files page keeps of the catalogue are of the database before,
 * so they go too.
 *
 * What a restore brings back that it should not, and nothing here undoes: a
 * person's games deleted on the People page, or a message deleted on the
 * Feedback page, after the backup was made. Replaying those deletes after a
 * restore is the library's work for 0.4.2.
 */
function backupRestored(array $manifest, PDO $pdo): void
{
    catalogueCountsForget();

    $run = sitePeople()->scrubber($pdo)->run();
    if ($run['state'] === 'done') {
        return;
    }

    $cache = siteIam()->cacheDirectory();
    if ($cache !== null) {
        afterResponse(static function () use ($cache): void {
            @unlink($cache . '/' . PeopleUpkeep::STAMP);
        });
    }
    $why = match ($run['state']) {
        'unreachable', 'stopped' => lcfirst(rtrim((string) $run['error'], '.')),
        'more' => 'its time ran out with more of the IAM\'s list to read',
        'busy' => 'another check was running',
        'not_ready' => 'what it needs is not there: ' . implode('; ', $run['problems']),
        default => 'it ended ' . $run['state'],
    };

    throw new RuntimeException(
        "the accounts the IAM deleted were not checked again ($why). Whoever it deleted since this backup was made may be named here "
        . 'until they are: the check runs again with the next request, and at once with Check now on the People page.'
    );
}

// ─── The file explorer ───────────────────────────────────────────────────────

/**
 * The admin panel's file explorer, over the two folders this site uploads
 * into: the asset tree (assets/, ~88,000 files - listed from a snapshot that
 * Rescan takes) and public/uploads/. The library's rules decide what goes in
 * (UploadPolicy - this site's own rules, made the family's: one extension per
 * name, from the root's list; no part of a name a server could run; the bytes
 * what the extension says; a guard .htaccess before the first write).
 *
 * A file already there that those rules would refuse now - a second extension
 * in its name, a type the root does not take - stays: it is listed, can be
 * previewed as a download (never shown inline unless it is a picture, sound,
 * video or short text) and moved to the trash; it is never deleted or renamed
 * by the explorer on its own. Only a name the explorer cannot address at all -
 * one that starts with a dot (.htaccess), or a Windows device name - is not
 * listed; it stays on disk as it is.
 *
 * Its trash, snapshots and incoming uploads are kept in storage/explorer: the
 * Files page lists everything under storage/trash as its own trash, and would
 * offer to restore the explorer's into the wrong folder.
 */
function siteFileExplorer(): FileExplorer
{
    static $explorer = null;

    return $explorer ??= new FileExplorer([
        new FileRoot('assets', _assetsRoot(), label: 'Assets', write: true, extensions: UPLOAD_ALLOWED_EXTENSIONS, maxBytes: 50 * 1024 * 1024, snapshot: true),
        new FileRoot('uploads', dirname(__DIR__) . '/public/uploads', label: 'Uploads', write: true, extensions: UPLOADS_FOLDER_EXTENSIONS, maxBytes: 50 * 1024 * 1024),
    ], array_filter([
        'storage' => siteStorageDir() . '/explorer',
        'key' => siteKey('file-previews'),
        'afterWrite' => explorerAfterWrite(...),
    ], static fn (mixed $value): bool => $value !== null));
}

/** What public/uploads/ takes: what POST /api/upload took, before the explorer replaced it. */
const UPLOADS_FOLDER_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'mp3', 'ogg', 'wav', 'webm'];

/**
 * Keeps the asset tree's catalogue (the `files` table the Files page lists, and
 * every asset column points into) in step with what the explorer did there:
 *
 *   upload, restore   the file is catalogued (a row of its own, or the row it
 *                     had when that row stayed)
 *   rename, move      the SAME rows follow - a file's, or every file's under a
 *                     folder - their ids kept (catalogueMove()), so whatever
 *                     the site's content points at keeps pointing at it; a
 *                     file the catalogue did not have is catalogued
 *   delete            the file's row goes, unless something points at it
 *                     (explorerGuard() refuses that delete first)
 *
 * Every `*_file_id` is ON DELETE SET NULL: a row taken away and made again
 * would leave each picture and sound pointing at nothing, and putting the file
 * back would not bring the link back - the security review of 2026-10-11 found
 * this did exactly that. Nothing for public/uploads/, which has no catalogue,
 * nor for a new folder. An upload is catalogued as it arrived: the Files page's
 * conversion turns it into AVIF or Opus, as it does whatever FTP brings.
 */
function explorerAfterWrite(string $root, string $op, string $path, ?string $from): void
{
    if ($root !== 'assets' || $op === 'folder') {
        return;
    }
    $pdo = genshinDb();
    $actor = siteAudit()->current()?->actorId;
    $by = is_int($actor) ? $actor : null;
    $isFolder = is_dir(_assetsRoot() . '/' . $path);
    $catalogue = static function (string $relative) use ($pdo, $by): void {
        $slash = strrpos($relative, '/');
        $folder = $slash === false ? '' : substr($relative, 0, $slash);
        catalogueUploadedStem($pdo, $folder, (string) pathinfo($relative, PATHINFO_FILENAME), $by);
    };

    if ($op === 'rename' || $op === 'move') {
        $moved = catalogueMove($pdo, (string) $from, $path, $by);
        if ($moved['moved'] === 0 && $moved['left'] === 0 && !$isFolder) {
            $catalogue($path);
        }
    } elseif ($op === 'delete' && !$isFolder) {
        catalogueForgetUnreferenced($pdo, $path, $by);
    } elseif (($op === 'upload' || $op === 'restore') && !$isFolder) {
        $catalogue($path);
    }

    catalogueCountsForget();
    if (function_exists('_assetFolderCacheClear')) {
        _assetFolderCacheClear();
    }
}

/**
 * Middleware on the file explorer's routes (api/index.php), after the ADMIN
 * check: what the library's explorer is about to do to the asset tree that
 * would take a picture or a sound away from the site's content is refused
 * before it runs, in this site's words -
 *
 *   409 file_in_use       a file something points at (catalogueReferences())
 *                         put in the trash: point those rows at another file
 *                         first, or rename or move it instead - that keeps them
 *   409 not_catalogued    a catalogued file (or a folder holding one) moved
 *                         where no category of the catalogue claims it, so its
 *                         row could not follow
 *
 * A folder goes only when it is empty (the library's rule), so only a file is
 * looked at for a delete. Paths are read as the library reads them
 * (PathGuard::relative()), so no other spelling of one reaches the same file
 * past this. And before any write, the root has this site's guard .htaccess
 * (ensureUploadGuard(): no script, nosniff, anything but a picture as a
 * download) rather than the library's shorter one, when it had none.
 */
function explorerGuard(ResponseFactoryInterface $responses): callable
{
    return static function (ServerRequestInterface $request, RequestHandlerInterface $handler) use ($responses): ResponseInterface {
        $route = RouteContext::fromRequest($request)->getRoute();
        $root = $route?->getArgument('root');
        $method = strtoupper($request->getMethod());
        if ($route === null || $method === 'GET' || $method === 'HEAD' || ($root !== 'assets' && $root !== 'uploads')) {
            return $handler->handle($request);
        }
        ensureUploadGuard($root === 'assets' ? _assetsRoot() : dirname(__DIR__) . '/public/uploads');
        if ($root !== 'assets') {
            return $handler->handle($request);
        }

        $pattern = $route->getPattern();
        $refusal = null;
        if ($method === 'DELETE' && !str_ends_with($pattern, '/trash')) {
            $refusal = explorerDeleteRefusal((string) ($request->getQueryParams()['path'] ?? ''));
        } elseif ($method === 'POST' && str_ends_with($pattern, '/move')) {
            $body = $request->getParsedBody();
            $body = is_array($body) ? $body : [];
            $refusal = explorerMoveRefusal(
                is_string($body['from'] ?? null) ? $body['from'] : '',
                is_string($body['to'] ?? null) ? $body['to'] : '',
            );
        }

        return $refusal === null ? $handler->handle($request) : refusalResponse($responses->createResponse(), $refusal);
    };
}

/** Why a file of the asset tree may not go in the trash: something in the site's content points at it. */
function explorerDeleteRefusal(string $path): ?Refusal
{
    $relative = PathGuard::relative($path);
    if ($relative === null || $relative === '') {
        return null;
    }
    $pdo = genshinDb();
    $uses = catalogueReferences($pdo, array_column(catalogueRowsAt($pdo, $relative, under: false), 'id'));
    if ($uses === []) {
        return null;
    }
    $count = array_sum($uses);

    return new Refusal(409, 'file_in_use', sprintf(
        'This file is in use: %d %s of the site\'s content %s it (%s). Point %s at another file first - or rename or move it instead, which keeps every link.',
        $count,
        $count === 1 ? 'row' : 'rows',
        $count === 1 ? 'shows' : 'show',
        implode(', ', array_map(static fn (string $column, int $n): string => "$column: $n", array_keys($uses), array_values($uses))),
        $count === 1 ? 'it' : 'them',
    ), ['used_by' => $uses]);
}

/** Why a move in the asset tree may not happen: a catalogued file would land where no category claims it. */
function explorerMoveRefusal(string $from, string $to): ?Refusal
{
    $source = PathGuard::relative($from);
    $target = PathGuard::relative($to);
    if ($source === null || $source === '' || $target === null || $target === '') {
        return null;
    }
    $stranded = count(array_filter(
        catalogueMovePlan(genshinDb(), $source, $target),
        static fn (array $row): bool => $row['category_id'] === null,
    ));
    if ($stranded === 0) {
        return null;
    }

    return new Refusal(409, 'not_catalogued', sprintf(
        'No category of the catalogue claims that folder, so %s would leave the catalogue - and the site\'s content would lose %s. Move %s into a folder a category claims (the Files page lists them).',
        $stranded === 1 ? 'the file' : "$stranded files",
        $stranded === 1 ? 'it' : 'them',
        $stranded === 1 ? 'it' : 'them',
    ), ['files' => $stranded]);
}

// ─── People ──────────────────────────────────────────────────────────────────

/**
 * This site's record of the people who use it, through the library: `users`,
 * its name column `username` (a token without one names a new row "user{id}",
 * as before), first seen `created_at`, no last-seen (that column is the
 * visitors'). The scrub of the IAM's deleted accounts blanks the name
 * (deleted-{id}) and, through the hook below, the copies kept elsewhere.
 */
function sitePeople(): People
{
    static $people = null;

    return $people ??= new People(
        new PeopleTable(name: 'username', firstSeen: 'created_at', lastSeen: null, nameFallback: static fn (int $sub): string => "user$sub"),
        static fn (): PDO => usersDb(),
        siteIam(),
        hooks: [peopleScrubCopies(...)],
    );
}

/**
 * The scrub's hook, for an account the IAM deleted - inside its transaction,
 * idempotent, UPDATEs only: the address and the browser the person's messages
 * kept (the words they wrote stay, nobody's now), the names the audit log's
 * details held about them (none here: this site keeps no address and logs no
 * person) - and, while it is kept, the old feedback table's copies of their
 * name and address (genshin_impact/029).
 */
function peopleScrubCopies(PDO $pdo, int $sub, ?array $former): void
{
    if (AdminSchema::has($pdo, AdminSchema::FEEDBACK_TABLE)) {
        siteFeedback()->forgetPeople([$sub]);
    }
    if (AdminSchema::has($pdo, AdminSchema::AUDIT_TABLE)) {
        siteAudit()->scrubPeople([$sub]);
    }
    if (AdminSchema::has($pdo, 'feedback_before_library')) {
        $pdo->prepare(
            'UPDATE feedback_before_library SET username = ?, email = NULL, user_agent = NULL
              WHERE user_id = ? AND (username IS DISTINCT FROM ? OR email IS NOT NULL OR user_agent IS NOT NULL)'
        )->execute(["deleted-$sub", $sub, "deleted-$sub"]);
    }
}

/**
 * What the People page shows of each person beside the library's columns:
 * their saved games, quiz results and the messages they sent.
 *
 * @return list<PeopleColumn>
 */
function peopleColumns(): array
{
    return [
        new PeopleColumn('games', 'Saved games', 'count', static fn (PDO $pdo, array $subs): array => peopleCounts($pdo, 'quizzes_states', $subs)),
        new PeopleColumn('results', 'Quiz results', 'count', static fn (PDO $pdo, array $subs): array => peopleCounts($pdo, 'user_quiz_history', $subs)),
        new PeopleColumn('feedback', 'Feedback sent', 'count', static fn (PDO $pdo, array $subs): array => peopleCounts($pdo, AdminSchema::FEEDBACK_TABLE, $subs)),
    ];
}

/**
 * Rows of a table by the people among $subs who have any. $table is one of
 * this file's literals, never a request's.
 *
 * @param list<int> $subs
 * @return array<int, int>
 */
function peopleCounts(PDO $pdo, string $table, array $subs): array
{
    if ($subs === [] || !AdminSchema::has($pdo, $table)) {
        return [];
    }
    $statement = $pdo->prepare("SELECT user_id, count(*) FROM $table WHERE user_id = ANY (CAST(? AS bigint[])) GROUP BY user_id");
    $statement->execute(['{' . implode(',', array_map('intval', $subs)) . '}']);

    return array_map('intval', $statement->fetchAll(PDO::FETCH_KEY_PAIR));
}

/** The visitors line under the list: how many play without signing in (api/visitors.php); none while users/045 waits. */
function peopleVisitors(PDO $pdo): ?array
{
    return visitorsReady() ? ['count' => (int) $pdo->query('SELECT count(*) FROM users WHERE id < 0')->fetchColumn()] : null;
}

/** The People page's labels for what a delete takes, by table (VISITOR_PERSON_TABLES: every table keyed by a person). */
const PEOPLE_DELETE_LABELS = [
    'quizzes_states' => 'Saved games',
    'user_quiz_history' => 'Quiz results',
    'quiz_stats_history' => 'Statistics',
];

/**
 * The People page's Delete: everything this site keeps of a person's play -
 * their saved games, quiz results and statistics, the tables a visitor's
 * sweep and the move at sign-in know (VISITOR_PERSON_TABLES) - in one
 * transaction, their row held first as the move holds it. Their row stays (it
 * is what their name in the audit log and on the words is read from), and so
 * do the messages they sent. Null for nobody with that id here (404); the
 * library audits what went (person.data_deleted).
 *
 * @return ?array<string, int>
 */
function peopleDeleteGames(PDO $pdo, int $sub, ServerRequestInterface $request): ?array
{
    $pdo->beginTransaction();
    try {
        $held = $pdo->prepare('SELECT 1 FROM users WHERE id = ? AND id > 0 FOR UPDATE');
        $held->execute([$sub]);
        if ($held->fetchColumn() === false) {
            $pdo->rollBack();

            return null;
        }
        $deleted = [];
        foreach (VISITOR_PERSON_TABLES as $table) {
            $statement = $pdo->prepare("DELETE FROM $table WHERE user_id = ?");
            $statement->execute([$sub]);
            $deleted[PEOPLE_DELETE_LABELS[$table] ?? $table] = $statement->rowCount();
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    return $deleted;
}
