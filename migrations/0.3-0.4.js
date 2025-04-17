function migration_03_to_04(input) {
    input.version = '0.4';
    delete input.topMenu.tournament.dailyState;
    input.topMenu.minesweeper = {
        state: null,
    };
    return input;
}
