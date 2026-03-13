# Version informations:

| Technology   | Version   |
| ------------ | --------- |
| `php`        | v`8.2.12` |
| `composer`   | v`2.9.5`  |
| `PostgreSQL` | v`18.3`   |

# Flyway

# PHP CRUD API Template

Minimal PHP REST API with Swagger/OpenAPI annotations.
Designed to work with openapi-generator-cli to auto-generate Angular services.

### Install PHP dependencies

Before, download and install it from: getcomposer.org/download

```bash
composer install
```

### Set up your database credentials

```bash
cp config/database.php config/database.local.php
# Edit config/database.local.php with your actual DB credentials
```

### Run init script (it will create database and apply schema.sql and create first migration schema)

```bash
php init.php
```

### Start local PHP server

```bash
php -S localhost:8000
```

Your API is now running at `http://localhost:8000/api/characters.php`

---

### When doing changes to schema.sql call to create a migration (and apply it at the end)

```bash
php migration.php
# it has bugs and not always its correct so I recommend manual check of the migrations scripts
```

## Deploying to Hosting

```bash
# 1. Build Angular app
cd ../your-angular-app
ng build --configuration production

# 2. Upload via SFTP:
#    dist/your-app/*     → public_html/
#    api/*               → public_html/api/
#    config/*            → public_html/config/   (NOT database.local.php!)
#    vendor/             → public_html/vendor/
#    swagger.json        → public_html/swagger.json  (optional)

# 3. Set your production DB credentials directly on the server
#    via hosting control panel or by uploading config/database.local.php manually
```

> ⚠️ Never upload `config/database.local.php` via git or automated scripts.
> Upload it manually once and leave it on the server.

---
