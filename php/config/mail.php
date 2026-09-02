<?php

// ---------------------------------------------------------------------------
// config/mail.php — how the API sends mail, and as whom
// ---------------------------------------------------------------------------
// These are the development defaults, which send nothing: the `file` driver
// writes each message into storage/mail/ so registration, confirmation and
// password resets can be walked through end to end on a machine with no mail
// server on it. Open the newest .eml in that folder and the link is there.
//
// To send for real, create config/mail.local.php returning the same array with
// the driver switched over. It is gitignored, like the other .local.php files:
//
//   <?php return [
//       'driver'    => 'mail',
//       'from'      => 'noreply@anotoki.sk',
//       'from_name' => 'Anotoki',
//       'base_url'  => 'https://anotoki.sk',
//   ];
//
// The `mail` driver is PHP's own mail(), which is what the Websupport hosting
// this deploys to supports. Their one hard requirement is that `from` is a
// real mailbox on the hosted domain, and that its domain matches the domain
// the mail is sent from - a From of gmail.com sent from anotoki.sk is refused.
// Create the mailbox in the hosting panel first; the address does not have to
// be one anybody reads.
//
// `base_url` is where the links in those messages point, so it is the address
// of the Angular app rather than of the API - the dev server on 4200 while
// developing, the site itself once deployed. A link is built by appending a
// path to it, so no trailing slash.
// ---------------------------------------------------------------------------

return [
    'driver'    => 'file',
    'from'      => 'noreply@localhost',
    'from_name' => 'Anotoki',
    'base_url'  => 'http://localhost:4200',
];
