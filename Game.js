/*
    Copyright (C) 2021 Vis LLC. - All Rights Reserved

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/*
    Vis Mines - Source code can be found on SourceForge.net
*/

var Game = {
    StatIncrementCalls: [],
    Boards: {

    },
    State: null,
    CurrentBoard: null,
    BoardObject: {
        Mines: null,
        SelectedDifficulty: null,
        MapSize: null,
        FullBoard: null,
        CurrentBoard: null,
        HintBoard: null,
        PuzzleBoard: null,
        BoardChoices: null,
        Duration: null,
        StartTime: null,
        EndTime: null,
    },
    ControlsDiv: null,
    StartTime: null,
    StartDuration: null,
    SavedGamesDiv: null,
    SavedGamesTable: null,
    TimerDiv: null,
    GameDiv: null,
    FailedDiv: null,
    SuccessDiv: null,
    OptionsDiv: null,
    BoardDiv: null,
    BoardField: null,
    BoardView: null,
    Selected: null,
    LastInput: null,
    Difficulty: {
        Easy: 0.10,
        Medium: 0.20,
        Hard: 0.30,
        "Very Hard": 0.40,
    },
    MapSize: {
        Small: 9,
        Medium: 18,
        Large: 36,
        "Very Large": 72,
    },
    Save: function () {
        var data = btoa(JSON.stringify(Game.Boards));
        Game.State.save("boards", data, "");
    },
    Load: function () {
        Game.State.load("boards", "Game.LoadI");
    },
    LoadI: function (result) {
        if (!!(result.Data)) {
            try {
                Game.Boards = JSON.parse(atob(result.Data));
            } catch (ex) {
                ex.toString(); // TODO - Remove
            }
            Game.DisplaySavedGames();
        }
    },
    ReturnToOptions: function (deleteGame) {
        if (deleteGame === null || deleteGame === undefined) {
            deleteGame = false;
        }
        if (deleteGame) {
            // TODO - Delete Saved Game
        }
        Game.CurrentBoard = null;
        Game.Duration = null;
        Game.StartTime = null;
        Game.GameDiv.style.opacity = 0;
        Game.SuccessDiv.style.opacity = 0;
        Game.FailedDiv.style.zIndex = -1;
        Game.FailedDiv.style.opacity = 0;
        Game.SuccessDiv.style.zIndex = -1;
        Game.DisplaySavedGames();
        var selector = Game.ControlsDiv.getBoundingClientRect();
        Game.ControlsDiv.style.opacity = 0;
        Game.ControlsDiv.style.transform = "translate3d(-" + selector.width + "px,-" + selector.height + "px,0px)"
        Game.OptionsDiv.style.opacity = 1;
        Game.OptionsDiv.style.transform = "translate3d(0px,0px,0px)"
    },
    DisplaySavedGames: function () {
        Game.SavedGamesTable.innerHTML = "";
        for (var i in Game.Boards) {
            var board = Game.Boards[i];
            var tr = document.createElement("tr");
            Game.SavedGamesTable.appendChild(tr);
            var td = document.createElement("td");
            tr.appendChild(td);
            var button = document.createElement("input");
            td.appendChild(button);
            button.type = "button";
            button.value = i;
            (function (i) {
                button.onclick = function () {
                    Game.Start(null,Game.Boards[i]);
                };
            })(i);
        }
    },
    Failed: function () {
        Game.StatIncrement("Failed", 1);
        Game.FailedDiv.style.opacity = 1;
        Game.FailedDiv.style.zIndex = 2;
        Game.DeleteCurrentSave();
    },
    Success: function () {
        Game.StatIncrement("Success", 1);
        Game.StatIncrement("Success - " + Game.CurrentBoard.SelectedDifficulty, 1);
        Game.StatIncrement("Success Time", Game.CurrentBoard.Duration);
        Game.StatIncrement("Success Time - " + Game.CurrentBoard.SelectedDifficulty, Game.CurrentBoard.Duration);
        Game.SuccessDiv.style.opacity = 1;
        Game.SuccessDiv.style.zIndex = 2;
        Game.DeleteCurrentSave();
    },
    DeleteCurrentSave: function () {
        for (var key in Game.Boards) {
            var value = Game.Boards[key];
            if (value === Game.CurrentBoard) {
                delete Game.Boards[key];
                break;
            }
        }
    },
    Update: function (uncovered, needed) {

    },
    CheckFinished: function () {
        var board = Game.CurrentBoard.CurrentBoard;
        var uncovered = 0;
        var needed = 0;
        var failed = 0;

        for (var j in board) {
            j = parseInt(j);
            var row = board[j];
            for (i in row) {
                i = parseInt(i);
                switch (row[i]) {
                    case "X":
                        failed++;
                        break;
                    case "":
                        break;
                    default:
                        uncovered++;
                        break;
                }
                switch (Game.CurrentBoard.PuzzleBoard[j][i]) {
                    case "X":
                        break;
                    default:
                        needed++;
                        break;
                }
            }
        }

        if (failed > 0) {
            Game.Failed();
        } else if (uncovered >= needed) {
            Game.Success();
        } else {
            Game.Update(uncovered, needed);
        }
    },
    SelectBox: function (l) {
        if (!l) {
            return;
        } else {
            var current = Date.now();
            var position = {x: l.getX(), y: l.getY()};
            if ((current - Game.LastInput) > 300) {
                var CurrentBoard = Game.CurrentBoard;
                if (!CurrentBoard.BoardChoices[position.y][position.x]) {
                    Game.StatIncrement("Select Value", 1);
                    CurrentBoard.BoardChoices[position.y][position.x] = " ";
                    var o = CurrentBoard.PuzzleBoard[position.y][position.x];
                    CurrentBoard.CurrentBoard[position.y][position.x] = o;
                    Game.BoardField.refresh(function () {
                        var l = Game.BoardField.get(position.x, position.y);
                        l.attribute("player", "selected");
                        l.doneWith();
                        Game.BoardView.update();
                        Game.CheckFinished();
                    });
                }
            }
        }
    },
    UpdateTimer: function () {
        if (Game.StartTime != null) {
            var CurrentTime = new Date();
            var duration = CurrentTime - Game.StartTime + (Game.StartDuration != null ? Game.StartDuration : 0);
            Game.CurrentBoard.Duration = duration;
            var durationShow = Math.floor(duration / 1000);
            var minutes = Math.floor(durationShow / 60);
            var seconds = durationShow % 60;
            Game.TimerDiv.innerText = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
            Game.Save();
        }
    },
    StatIncrementI: function (result) {
        var limit = 1000000000000;
        var name = Game.StatIncrementCalls.shift();
        var amount = Game.StatIncrementCalls.shift();
        value = result.Data;
        if (value >= limit) {
            value = limit;
        } else {
            value += amount;
            if (value >= limit) {
                value = limit;
            }
        }
        Game.State.save(name, value, "");

        switch (name) {
            case "Select Value":
                break;
            case "Started":
                Game.State.incrementAchievement("Started a Puzzle", 1, "");
                break;
            case "Success":
                Game.State.incrementAchievement("Completed a Puzzle", 1, "");
                Game.State.incrementAchievement("Completed 10 Puzzles", 1, "");
                Game.State.incrementAchievement("Completed 25 Puzzles", 1, "");
                break;
            case "Success - Easy":
                Game.State.incrementAchievement("Completed an Easy Puzzle", 1, "");
                break;
            case "Success - Medium":
                Game.State.incrementAchievement("Completed a Medium Puzzle", 1, "");
                break;
            case "Success - Hard":
                Game.State.incrementAchievement("Completed a Hard Puzzle", 1, "");
                break;
            case "Success - Very Hard":
                Game.State.incrementAchievement("Completed a Very Hard Puzzle", 1, "");
                break;                                                                                    
        }
    },
    StatIncrement: function (name, amount) {
        Game.StatIncrementCalls.push(name);
        Game.StatIncrementCalls.push(amount);
        Game.State.load(name, "Game.StatIncrementI");
    },
    Init: function () {
        // TODO
        //Field.UseWillChange = false;
        //Field.UseAllTransform = false;
        Game.State = com.field.util.StateAbstract.getState();
        Game.State.signin();
        Game.ControlsDiv = document.getElementById("Controls");
        Game.SavedGamesDiv = document.getElementById("SavedGames");
        Game.SavedGamesTable = document.getElementById("SavedGamesTable");
        Game.TimerDiv = document.getElementById("Timer");
        Game.OptionsDiv = document.getElementById("Options");
        Game.BoardDiv = document.getElementById("Board");
        Game.SelectorDiv = document.getElementById("Selector");
        Game.GameDiv = document.getElementById("Game");
        Game.FailedDiv = document.getElementById("Failed");
        Game.SuccessDiv = document.getElementById("Success");
        setInterval(Game.UpdateTimer, 100);
        Game.Load();
        Game.State.load("theme", "Game.InitI");
    },
    InitI: function (result) {
        var theme;
        try {
            theme = result.Data;
        }
        catch (ex) {}
        
        if (!theme) {
            theme = "dark_theme";
        }
        try {
            document.body.classList.add(theme);
        } catch (ex) {
            document.body.classList.add("dark_theme");
        }
        
        Game.StatIncrement("Init", 1);
    },
    Start: function (sDifficulty, sMapSize, CurrentBoard) {
        Game.StatIncrement("Started", 1);
        if (sDifficulty)
        {
            Game.StatIncrement("New Game", 1);
            Game.StatIncrement("New Game - " + sDifficulty, 1);            
            CurrentBoard = { };
            for (var i in Game.BoardObject) {
                CurrentBoard[i] = Game.BoardObject[i];
            }
            Game.CurrentBoard = CurrentBoard;
            var iMapSize = Game.MapSize[sMapSize];
            var iMapSizeSq = iMapSize * iMapSize;
            var dDifficulty = Game.Difficulty[sDifficulty];
            
            CurrentBoard.FullBoard = com.roller.MineField.generateBoardForAsArray({"X": Math.floor(iMapSizeSq * dDifficulty), " ":  Math.ceil(iMapSizeSq * (1 - dDifficulty))}, iMapSize, iMapSize);
            CurrentBoard.HintBoard = new Array(CurrentBoard.FullBoard.length);
            CurrentBoard.CurrentBoard = new Array(CurrentBoard.FullBoard.length);
            CurrentBoard.BoardChoices = new Array(CurrentBoard.FullBoard.length);
            CurrentBoard.PuzzleBoard = new Array(CurrentBoard.FullBoard.length);
            CurrentBoard.SelectedDifficulty = sDifficulty;
            CurrentBoard.MapSize = sMapSize;

            for (var i in CurrentBoard.FullBoard) {
                i = parseInt(i);
                var row = CurrentBoard.FullBoard[i];
                var newRow = new Array(row.length);
                var hintRow = new Array(row.length);
                var choiceRow = new Array(row.length);
                var puzzleRow = new Array(row.length);

                CurrentBoard.CurrentBoard[i] = newRow;
                CurrentBoard.BoardChoices[i] = choiceRow;
                CurrentBoard.PuzzleBoard[i] = puzzleRow;
                CurrentBoard.HintBoard[i] = hintRow;

                for (var j in row) {
                    j = parseInt(j);
                    var o = row[j];
                    var iNear = 0;
                    for (var k = 0; k < 9; k++) {
                        var x = k % 3 - 1;
                        var y = Math.floor(k / 3) - 1;
                        if (x != 0 || y != 0) {
                            x += j;
                            y += i;
                            if (y >= 0 && y < CurrentBoard.FullBoard.length && x >= 0 && x < CurrentBoard.FullBoard[y].length) {
                                switch (CurrentBoard.FullBoard[y][x]) {
                                    case " ": case "": case null: case undefined:
                                        break;
                                    default:
                                        iNear++;
                                        break;
                                }
                            }
                        }
                    }
                    hintRow[j] = iNear;
                    choiceRow[j] = "";
                    newRow[j] = "";
                    switch (o) {
                        case " ": case "": case null: case undefined:
                            puzzleRow[j] = iNear;
                            break;
                        default:
                            puzzleRow[j] = o;
                            break;
                    }
                }
            }

            Game.StartTime = new Date();
            CurrentBoard.StartTime = Game.StartTime;
            function pad(s) {
                switch (s.length) {
                    case 0:
                        return "00";
                    case 1:
                        return "0" + s;
                    default:
                        return s;
                }
            }                        
            Game.Boards[
                CurrentBoard.SelectedDifficulty + "-" + 
                CurrentBoard.StartTime.getFullYear() + "-" + 
                pad(CurrentBoard.StartTime.getMonth() + 1) + "-"  +
                pad(CurrentBoard.StartTime.getDate()) + "-" +
                pad(CurrentBoard.StartTime.getHours()) + "-" +
                pad(CurrentBoard.StartTime.getMinutes()) + "-" + 
                pad(CurrentBoard.StartTime.getSeconds())
            ] = CurrentBoard;
        } else if (!!CurrentBoard) {
            Game.StatIncrement("Load Game", 1);
            Game.StartTime = new Date();
            Game.CurrentBoard = CurrentBoard;
            Game.StartDuration = CurrentBoard.Duration;
        }

        Game.BoardField = com.field.Convert.array2DToFieldNoIndexes(
            com.field.Convert.array2DToFieldNoIndexesOptions()
            .value(CurrentBoard.CurrentBoard)
        );

        {
            var field = Game.BoardField;
            var j = 0;
            while (j < field.height()) {
                var i = 0;
                while (i < field.width()) {
                    var l = field.get(i, j);
                    /*
                    var x = j % 3;
                    var y = i % 3;

                    switch (x) {
                        case 0:
                            l.attribute("left", "border");
                            break;
                        case 1:
                            break;
                        case 2:
                            l.attribute("right", "border");
                            break;
                    }

                    switch (y) {
                        case 0:
                            l.attribute("top", "border");
                            break;
                        case 1:
                            break;
                        case 2:
                            l.attribute("bottom", "border");
                            break;
                    }

                    console.log("" + i + "," + j + "=" + l.value() + "-");
                    */

                    if (l.value() === "") {
                        l.attribute("player", "selectable");
                        // TODO
                        //l.Select = Game.SelectBox;
                    }
                    i++;
                }
                j++;
            }
        }

        Game.BoardView = com.field.views.FieldView.create(
            com.field.views.FieldView.options()
            .field(Game.BoardField)
            .tileWidth(Game.CurrentBoard.CurrentBoard[0].length)
            .tileHeight(Game.CurrentBoard.CurrentBoard.length)
            .tileBuffer(0)
            .parent(Game.BoardDiv)
            .show(true)
            //.locationTileElement(true)
            //.locationEffectElement(false)
            //.locationSelectElement(false)
            //.locationNoHideShow(true)
            .noAreaXY(true)
        );
        com.field.Events.locationSelect().addEventListener(function (e) {
            var field = e.field();
            if (field.equals(Game.BoardField)) {
                Game.SelectBox(e.location());
            }
        });

        document.documentElement.style.setProperty("--column-count", CurrentBoard.CurrentBoard[0].length);
        document.documentElement.style.setProperty("--row-count", CurrentBoard.CurrentBoard.length);
        Game.BoardView.field(Game.BoardField);
        var options = Game.OptionsDiv.getBoundingClientRect();
        Game.OptionsDiv.style.opacity = 0;
        Game.OptionsDiv.style.transform = "translate3d(-" + options.width + "px,-" + options.height + "px,0px)"
        var selector = Game.ControlsDiv.getBoundingClientRect();
        Game.ControlsDiv.style.opacity = 0;
        Game.ControlsDiv.style.transform = "translate3d(-" + selector.width + "px,-" + selector.height + "px,0px)"
        Game.GameDiv.style.opacity = 1;
    },
    SwitchTheme: function (e) {
        Game.StatIncrement("Switch Theme", 1);
        var themes = [ "light_theme", "dark_theme" ];
        var currentTheme = -1;
        var nextTheme;
        var i = 0;
        while (i < themes.length) {
            if (e.className.indexOf(themes[i]) >= 0) {
                currentTheme = i;
                break;
            } else {
                i++;
            }
        }
        if (currentTheme == -1) {
            currentTheme = 0;
        }
        nextTheme = (currentTheme + 1) % themes.length;
        e.classList.add(themes[nextTheme]);
        e.classList.remove(themes[currentTheme]);
        Game.State.setValue("theme", themes[nextTheme]);
    },    
};