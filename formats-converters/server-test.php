<?php

/**
 * FFmpeg & Exec Capability Detector
 */

$results = [];

// ── 1. PHP FFmpeg library (PHP-FFMpeg by alchemy) ──────────────────────────
$results['php_ffmpeg_lib'] = [
  'label' => 'PHP-FFMpeg library (composer)',
  'status' => false,
  'note' => '',
];

if (class_exists('FFMpeg\FFMpeg')) {
  $results['php_ffmpeg_lib']['status'] = true;
  $results['php_ffmpeg_lib']['note'] = 'FFMpeg\\FFMpeg class found.';
} elseif (file_exists(__DIR__ . '/vendor/autoload.php')) {
  require_once __DIR__ . '/vendor/autoload.php';
  if (class_exists('FFMpeg\FFMpeg')) {
    $results['php_ffmpeg_lib']['status'] = true;
    $results['php_ffmpeg_lib']['note'] = 'Loaded via vendor/autoload.php.';
  } else {
    $results['php_ffmpeg_lib']['note'] = 'autoload.php found but FFMpeg\\FFMpeg class missing.';
  }
} else {
  $results['php_ffmpeg_lib']['note'] = 'Class not found and no vendor/autoload.php present.';
}

// ── 2. ffmpeg extension (rare, old php-ffmpeg PECL) ────────────────────────
$results['pecl_extension'] = [
  'label' => 'PECL ffmpeg extension',
  'status' => extension_loaded('ffmpeg'),
  'note' => extension_loaded('ffmpeg')
    ? 'extension_loaded("ffmpeg") = true.'
    : 'Extension not loaded.',
];

// ── 3. exec() available ─────────────────────────────────────────────────────
$results['exec'] = [
  'label' => 'exec() function',
  'status' => false,
  'note' => '',
];

if (!function_exists('exec')) {
  $results['exec']['note'] = 'Function does not exist (compiled out or disabled).';
} else {
  $disabled = array_map('trim', explode(',', ini_get('disable_functions')));
  if (in_array('exec', $disabled, true)) {
    $results['exec']['note'] = 'Disabled via disable_functions in php.ini.';
  } else {
    $results['exec']['status'] = true;
    $results['exec']['note'] = 'Available and not disabled.';
  }
}

// ── 4. shell_exec() available ───────────────────────────────────────────────
$results['shell_exec'] = [
  'label' => 'shell_exec() function',
  'status' => false,
  'note' => '',
];

if (!function_exists('shell_exec')) {
  $results['shell_exec']['note'] = 'Function does not exist.';
} else {
  $disabled = array_map('trim', explode(',', ini_get('disable_functions')));
  if (in_array('shell_exec', $disabled, true)) {
    $results['shell_exec']['note'] = 'Disabled via disable_functions in php.ini.';
  } else {
    $results['shell_exec']['status'] = true;
    $results['shell_exec']['note'] = 'Available and not disabled.';
  }
}

// ── 5. Safe-mode (PHP < 5.4 legacy check) ──────────────────────────────────
$results['safe_mode'] = [
  'label' => 'safe_mode (legacy)',
  'status' => false, // false = safe_mode is OFF = good
  'note' => '',
];

if (version_compare(PHP_VERSION, '5.4.0', '<')) {
  $sm = (bool) ini_get('safe_mode');
  $results['safe_mode']['status'] = $sm;
  $results['safe_mode']['note'] = $sm
    ? 'safe_mode is ON — exec/shell_exec will be restricted.'
    : 'safe_mode is OFF.';
} else {
  $results['safe_mode']['note'] = 'Not applicable (PHP >= 5.4).';
}

// ── 6. Detect ffmpeg binary via exec/shell_exec ─────────────────────────────
$results['ffmpeg_binary'] = [
  'label' => 'ffmpeg binary on PATH',
  'status' => false,
  'note' => '',
];

$canRun = $results['exec']['status'] || $results['shell_exec']['status'];

if (!$canRun) {
  $results['ffmpeg_binary']['note'] = 'Cannot check — exec and shell_exec are both unavailable.';
} else {
  // Try common explicit paths first, then rely on PATH
  $candidates = [
    'ffmpeg',
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg',
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
  ];

  $found = false;
  $foundCmd = '';

  foreach ($candidates as $cmd) {
    $escaped = escapeshellarg($cmd);
    $output = '';

    if ($results['exec']['status']) {
      $returnCode = -1;
      exec("$escaped -version 2>&1", $lines, $returnCode);
      $output = implode(' ', $lines);
      if ($returnCode === 0) {
        $found = true;
        $foundCmd = $cmd;
        break;
      }
    } elseif ($results['shell_exec']['status']) {
      $output = (string) shell_exec("$escaped -version 2>&1");
      if (stripos($output, 'ffmpeg version') !== false) {
        $found = true;
        $foundCmd = $cmd;
        break;
      }
    }
  }

  if ($found) {
    $results['ffmpeg_binary']['status'] = true;
    $results['ffmpeg_binary']['note'] = "Found at: $foundCmd";

    // Extract version string
    if ($results['exec']['status']) {
      exec(escapeshellarg($foundCmd) . ' -version 2>&1', $vLines);
      if (!empty($vLines[0])) {
        $results['ffmpeg_binary']['note'] .= ' — ' . $vLines[0];
      }
    }
  } else {
    $results['ffmpeg_binary']['note'] = 'Binary not found in common locations or PATH.';
  }
}

// ── 7. Try instantiating PHP-FFMpeg (if lib + binary both present) ──────────
$results['php_ffmpeg_instance'] = [
  'label' => 'PHP-FFMpeg instantiation test',
  'status' => false,
  'note' => '',
];

if ($results['php_ffmpeg_lib']['status'] && $results['ffmpeg_binary']['status']) {
  try {
    $ffmpeg = \FFMpeg\FFMpeg::create();
    $results['php_ffmpeg_instance']['status'] = true;
    $results['php_ffmpeg_instance']['note'] = 'FFMpeg::create() succeeded.';
  } catch (\Throwable $e) {
    $results['php_ffmpeg_instance']['note'] = 'FFMpeg::create() failed: ' . $e->getMessage();
  }
} else {
  $results['php_ffmpeg_instance']['note'] = 'Skipped (library or binary missing).';
}

// ── Output ──────────────────────────────────────────────────────────────────
$isCli = PHP_SAPI === 'cli';

if ($isCli) {
  echo "\n=== FFmpeg Environment Check ===\n\n";
  foreach ($results as $key => $r) {
    $icon = $r['status'] ? '[OK]  ' : '[FAIL]';
    printf("%s %-35s %s\n", $icon, $r['label'], $r['note']);
  }
  echo "\nPHP version: " . PHP_VERSION . "\n\n";
} else {
  header('Content-Type: text/html; charset=utf-8');
  echo '<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>FFmpeg Check</title>
    <style>
        body { font-family: monospace; padding: 2em; background:#111; color:#eee; }
        h1   { color:#f90; }
        table{ border-collapse:collapse; width:100%; }
        th,td{ padding:.5em 1em; border:1px solid #444; text-align:left; }
        th   { background:#222; }
        .ok  { color:#4f4; font-weight:bold; }
        .fail{ color:#f44; font-weight:bold; }
    </style></head><body>
    <h1>FFmpeg Environment Check</h1>
    <p>PHP ' . PHP_VERSION . '</p>
    <table>
    <tr><th>Check</th><th>Status</th><th>Note</th></tr>';

  foreach ($results as $r) {
    $status = $r['status']
      ? '<span class="ok">&#10003; OK</span>'
      : '<span class="fail">&#10007; FAIL</span>';
    echo "<tr><td>{$r['label']}</td><td>$status</td><td>" . htmlspecialchars($r['note']) . "</td></tr>\n";
  }

  echo '</table></body></html>';
}