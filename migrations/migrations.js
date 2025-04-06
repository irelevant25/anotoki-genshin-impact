function migrate(input) {
    if (!input.version || input.version === '0.1') return migrate(migration_01_to_02(input));
    if (input.version === '0.2') return migrate(migration_02_to_03(input));
    // if (input.version === '0.3') return migrate(migration_03_to_04(input));
    // if (input.version === '0.4') return migrate(migration_04_to_05(input));
    return input;
}