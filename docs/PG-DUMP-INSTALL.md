# Installing pg_dump / pg_restore without root (Debian/Ubuntu, no sudo)

Use this when you have SSH access to a Linux box (e.g. a shared-hosting
web console) but **no root/sudo**, and you need `pg_dump` to back up a
PostgreSQL database that lives on a different server.

This installs only the PostgreSQL **client** tools (`pg_dump`,
`pg_restore`, `psql`) — not a database server — by downloading the
official `.deb` packages and unpacking them into your home directory.

---

## 0. Check your environment

```bash
cat /etc/os-release      # confirm Debian/Ubuntu and version codename (e.g. jammy, noble, bookworm)
whoami
sudo -l                  # confirms whether you have any sudo rights at all
```

If you _do_ have sudo, just run:

```bash
sudo apt install postgresql-client-<VERSION>
```

and skip the rest of this guide.

If you get `Permission denied` / `are you root?` errors, continue below.

---

## 1. Find out which PostgreSQL major version you need

Match the **major version of the database server** you're connecting
to (check with your host or `SELECT version();` if you can already
connect). Example used throughout this guide: **PostgreSQL 14**.

Also match the **exact package version** your OS release ships. If a
plain `apt-get download` fails with an error like:

```
E: Can't find a source to download version '14.24-0ubuntu0.22.04.1' of 'libpq5:amd64'
```

...that error message itself tells you the exact version string apt
expects (`14.24-0ubuntu0.22.04.1` in the example) — use that in the
URLs below.

---

## 2. Create a working folder

```bash
mkdir -p ~/pgclient && cd ~/pgclient
```

Everything lives here. On most shared-hosting consoles, files in your
home directory persist across sessions even if the shell/container
itself is ephemeral and rebuilt on every login — only files outside
`$HOME` get wiped.

---

## 3. Download the .deb packages directly (no apt needed)

Find the right package + version + URL via https://packages.ubuntu.com
(search the package name and your release codename), or use the
pattern below (swap in your version numbers, architecture, and Ubuntu
mirror pool path):

```bash
wget http://archive.ubuntu.com/ubuntu/pool/main/p/postgresql-14/postgresql-client-14_14.24-0ubuntu0.22.04.1_amd64.deb
wget http://archive.ubuntu.com/ubuntu/pool/main/p/postgresql-14/libpq5_14.24-0ubuntu0.22.04.1_amd64.deb
```

> If `apt-get download postgresql-client-14 libpq5` works for you
> (some shells allow it), that's simpler and skips having to find URLs
> manually. It commonly fails on locked-down shared hosting because
> apt has no writable place to cache its package index — see the
> optional workaround in Appendix A below.

---

## 4. Extract the packages (without installing them)

Plain `dpkg-deb -x` sometimes fails on shared/NFS-backed home
directories because Debian packages create a symlink inside
`usr/share/doc/<pkg>/` that points at another package's changelog, and
NFS mounts often block creating new symlinks:

```
tar: Cannot create symlink ... Permission denied
```

The fix: skip the `usr/share/doc` folder — you don't need it anyway.

```bash
# Packages that extract cleanly, do this:
dpkg-deb -x libpq5_14.24-0ubuntu0.22.04.1_amd64.deb .

# Packages that error on the doc symlink, do this instead:
dpkg-deb --fsys-tarfile postgresql-client-14_14.24-0ubuntu0.22.04.1_amd64.deb | tar -x --exclude='./usr/share/doc/*' -C .
```

Verify the binary exists:

```bash
find usr -name pg_dump
```

---

## 5. Point your shell at the extracted binaries

```bash
export PATH=$HOME/pgclient/usr/lib/postgresql/14/bin:$PATH
export LD_LIBRARY_PATH=$HOME/pgclient/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
pg_dump --version
```

You should see something like:

```
pg_dump (PostgreSQL) 14.24 (Ubuntu 14.24-0ubuntu0.22.04.1)
```

### If it complains about a missing shared library

```bash
ldd $(which pg_dump)
```

This shows exactly which `.so` is missing. Common dependencies
(`libreadline`, `libssl`, `zlib1g`, `libc6`) are usually already
present on the base system. If one really is missing, download and
extract just that `.deb` the same way (steps 3–4).

---

## 6. Make it permanent

The container/shell may reset every session, but `~/.bashrc` persists:

```bash
echo 'export PATH=$HOME/pgclient/usr/lib/postgresql/14/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=$HOME/pgclient/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH' >> ~/.bashrc
```

---

## 7. Using pg_dump against a remote database

```bash
pg_dump -h <db-host> -p <db-port> -U <db-user> -d <db-name> -F c -f backup.dump
```

- `-F c` = compressed "custom" format — restore with `pg_restore`,
  supports selective table restore. Use `-F p` for plain SQL text if
  you prefer a readable/portable dump.
- It will prompt for the password interactively unless you set it via
  `PGPASSWORD=yourpassword pg_dump ...` or (better, for repeated/cron
  use) a `~/.pgpass` file:

  ```
  hostname:port:database:username:password
  ```

  ```bash
  chmod 600 ~/.pgpass
  ```

---

## 8. Important PHP gotchas before writing any scripts

If you'll be calling `pg_dump` from PHP (not just the SSH shell), know
these two things up front — they'll save you a confusing debugging
session:

1. **PHP doesn't read `.bashrc`.** Always call the binary by its full
   absolute path, and pass `LD_LIBRARY_PATH` explicitly rather than
   relying on shell environment setup.

2. **`exec()` / `shell_exec()` / `system()` may silently fail** even
   when the binary is readable, executable, and correctly pathed —
   with no error, no exit code, no stderr, nothing. This happens on
   hosts that run PHP-FPM inside a hardened container (e.g.
   CloudLinux CageFS, Imunify360) that restricts what the intermediate
   `/bin/sh -c "..."` process (which `exec`/`shell_exec`/`system` all
   spawn) is allowed to do — even though plain system binaries often
   still work fine through it, which makes the symptom confusing.

   **The fix: always use `proc_open()` with an array command and an
   explicit `$env` array**, which executes the binary directly with no
   intermediate shell. Both scripts below use this pattern.

3. **Finding the right absolute home path for PHP**: the SSH shell's
   `$HOME` and PHP's working directory can report different-looking
   paths even when they're the same underlying storage. Confirm by
   creating a marker file over SSH (`touch ~/marker.txt`) and checking
   `file_exists()` against `getcwd()`, `__DIR__`,
   `dirname($_SERVER['DOCUMENT_ROOT'])`, and `getenv('HOME')` from PHP
   to see which one actually finds it. The scripts below assume you've
   already worked out this path.

---

## 9. PHP script: detect the system and check pg_dump availability

Run this once on a new project to sanity-check the environment before
writing any real backup logic. It reports the OS, whether `disable_functions`
or `open_basedir` might get in the way, whether the `pg_dump` binary
exists at the expected path, and — critically — whether it can actually
be **executed** from PHP (not just read), using the `proc_open` array
method that avoids the shell-spawning pitfall above.

```php
<?php

// Adjust this to your project's actual absolute home path (see note 3 above)
$home = '/absolute/path/to/your/home'; // echo $HOME - result from this command (run it via ssh)
$bin  = $home . '/pgclient/usr/lib/postgresql/14/bin/pg_dump';
$lib  = $home . '/pgclient/usr/lib/x86_64-linux-gnu';

echo "OS: " . PHP_OS_FAMILY . "<br/>";
echo "disable_functions: " . htmlspecialchars(ini_get('disable_functions') ?: '(none)') . "<br/>";
echo "open_basedir: " . htmlspecialchars(ini_get('open_basedir') ?: '(none)') . "<br/>";
echo "<br/>";

echo "Expected binary path: " . htmlspecialchars($bin) . "<br/>";
echo "is_file: " . var_export(is_file($bin), true) . "<br/>";
echo "is_executable: " . var_export(is_executable($bin), true) . "<br/><br/>";

if (!is_file($bin)) {
    echo "pg_dump NOT FOUND at expected path — check the install steps or the home path.";
    exit;
}

// Actually try to run it, the safe way (array command, no shell)
$env = ['LD_LIBRARY_PATH' => $lib];
$descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
$process = proc_open([$bin, '--version'], $descriptors, $pipes, null, $env);

if (!is_resource($process)) {
    echo "proc_open FAILED to start the process at all.";
    exit;
}

$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$code = proc_close($process);

if ($code === 0 && $stdout !== '') {
    echo "pg_dump IS USABLE from PHP: " . htmlspecialchars($stdout);
} else {
    echo "pg_dump did not run cleanly.<br/>";
    echo "Exit code: $code<br/>";
    echo "stderr: " . htmlspecialchars($stderr) . "<br/>";
    echo "If this is empty/silent, it's likely a hardened PHP-FPM sandbox blocking binary execution from your home directory (e.g. CageFS/Imunify360) — see step 8.";
}
```

---

## 10. Scripts for running pg_dump

### Bash (cron / SSH)

```bash
pg_dump -h <db-host> -p <db-port> -U <db-user> -d <db-name> -F c -f backup.dump
```

- `-F c` = compressed "custom" format — restore with `pg_restore`,
  supports selective table restore. Use `-F p` for plain SQL text if
  you prefer a readable/portable dump.
- It will prompt for the password interactively unless you set it via
  `PGPASSWORD=yourpassword pg_dump ...` or (better, for repeated/cron
  use) a `~/.pgpass` file:

  ```
  hostname:port:database:username:password
  ```

  ```bash
  chmod 600 ~/.pgpass
  ```

### PHP

```php
<?php

$home = '/absolute/path/to/your/home'; // echo $HOME - result from this command (run it via ssh)
$bin  = $home . '/pgclient/usr/lib/postgresql/14/bin/pg_dump';
$lib  = $home . '/pgclient/usr/lib/x86_64-linux-gnu';
$dumpFile = $home . '/backups/backup_' . date('Ymd_His') . '.dump';

$env = [
    'LD_LIBRARY_PATH' => $lib,
    'PGPASSWORD'      => 'yourpassword',
];

$cmd = [
    $bin,
    '-h', 'your-db-host',
    '-p', '5432',
    '-U', 'your-db-user',
    '-d', 'your-db-name',
    '-F', 'c',
    '-f', $dumpFile,
];

$descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
$process = proc_open($cmd, $descriptors, $pipes, null, $env);

if (is_resource($process)) {
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($process);

    if ($code === 0) {
        echo "Backup successful: " . htmlspecialchars($dumpFile);
    } else {
        echo "Backup failed (code $code): " . htmlspecialchars($stderr);
    }
} else {
    echo "Failed to start pg_dump process.";
}
```
