function migrate(input) {
    if (input.version === '0.1') migrate(migration_01_to_02(input));
    // if (input.version === '0.2') migrate(migration_02_to_03(input));
    // if (input.version === '0.3') migrate(migration_03_to_04(input));
    // if (input.version === '0.4') migrate(migration_04_to_05(input));
    return input;
}