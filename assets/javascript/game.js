var player = 0;
var turn = 0;

var player1Name = "";
var player1Ready = false;
var player2Name = "";
var player2Ready = false;

var timerId = 0;
var chat = [];

$(document).ready(function () {
    $(window).keydown(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            return false;
        }
    });

    $(".choices").hide();
    $(".chosen").hide();

    database.ref("game/chat").onDisconnect().remove();

    database.ref("game/chat").on("child_added", function (data) {
        var text = data.val().message;
        $("#chatMessage").val($("#chatMessage").val() + String.fromCharCode(13, 10) + text);
        $("#chatMessage").scrollTop($("#chatMessage")[0].scrollHeight);
    });


    database.ref().on("value", function (gameData) {
        initializePlayers(gameData)
        if (gameData.child("game/turn").exists()) {
            setPlayerTurn(gameData);
        }
    });


    $("#startButton").on("click", function (event) {
        event.preventDefault();
        var userName = $("#userName").val().trim();
        console.log("register player: " + userName);
        if (userName === undefined || userName === "") {
            alert("We need your name to play");
        }
        else {
            registerPlayer(userName);
        }
    });

    $(".choices").on("click", function (event) {
        var val = $(this).attr("value");
        console.log("Player select: " + val);
        database.ref("game/players/" + player).update({
            "choice": val
        });
        var boxRow = "";
        if (player === 1) {
            boxRow = "#player1Choice";
        }
        else if (player === 2) {
            boxRow = "#player2Choice";
        }
        $(boxRow).children(".choices").hide();
        var chosen = $(boxRow).children(".chosen");
        chosen.empty();
        var p = $("<p>");
        p.text(val);
        chosen.append(p);
        chosen.show();
        database.ref("game").update({
            "turn": turn + 1
        });
    });

    $("#chat").on("click", function (event) {
        event.preventDefault();
        if (player1Ready && player2Ready) {
            displayChatMessages();
        }
    });


    var compareResults = function (gameData) {
        console.log("check user selection for winner");
        var message;
        var choice1 = gameData.child("game/players/1").val().choice;
        var choice2 = gameData.child("game/players/2").val().choice;
        var wins1 = parseInt(gameData.child("game/players/1").val().wins);
        var wins2 = parseInt(gameData.child("game/players/2").val().wins);
        var losses1 = parseInt(gameData.child("game/players/1").val().losses);
        var losses2 = parseInt(gameData.child("game/players/2").val().losses);

        if ((choice1 === "Rock" && choice2 === "Scissors") ||
            (choice1 === "Paper" && choice2 === "Rock") ||
            (choice1 === "Scissors" && choice2 === "Paper")) {
            $("#result").html("<p>" + player1Name + " Wins!</p>");
            wins1++;
            losses2++;
            message = buildMessage(choice1, choice2);
        }
        else if (choice1 === choice2) {
            $("#result").html("Tie Game");

        }
        else {
            $("#result").html("<p>" + player2Name + " Wins!</p>");
            wins2++;
            losses1++;
            message = buildMessage2(choice1, choice2);
        }

        var boxRow = "";
        var val = "";
        if (player === 1) {
            boxRow = "#player2Choice";
            val = choice2 +" player 1";
        }
        else if (player === 2) {
            boxRow = "#player1Choice";
            val = choice1 +" player 2";
        }
        var chosen = $(boxRow).children(".chosen");

        chosen.empty();
        var par = $("<p>");
        par.text(val);
        chosen.append(par);
        chosen.show();

        database.ref("game/players/1").update({
            "wins": wins1,
            "losses": losses1
        });
        database.ref("game/players/2").update({
            "wins": wins2,
            "losses": losses2
        });
    }


    var displayChatMessages = function () {
        console.log("display chat message");
        var text = $("#text").val();
        $("#text").val("");
        if (player === 1) {
            text = player1Name + ": " + text;
        }
        else {
            text = player2Name + ": " + text;
        }
        var newKey = database.ref().child("game/chat").push().key;
        var updates = {};
        updates["game/chat/" + newKey] = { message: text };
        database.ref().update(updates);
    }


    var registerPlayer = function (userName) {
        console.log("register player");
        $("#userName").val("");
        $("#userName").hide();
        $("#startButton").hide();
        if (player1Ready && player2Ready) {
            alert("Sorry, Game Full! Try Again Later!");
        }
        else if (!player1Ready) {
            player1Ready = true;
            player = 1;
            database.ref("game/players/1").set({
                "losses": 0,
                "name": userName,
                "wins": 0,
                "choice": null
            });
            database.ref("game/players/1").onDisconnect().remove();
            if (player2Ready) {
                database.ref("game").update({
                    "turn": 1
                });
            }
            $("#systemMessage1").html("<h4>Player 1: " + userName + "</h4>");
        }
        else if (!player2Ready) {
            player2Ready = true;
            player = 2;
            database.ref("game/players/2").set({
                "losses": 0,
                "name": userName,
                "wins": 0
            });
            database.ref("game/players/2").onDisconnect().remove();
            database.ref("game").update({
                "turn": 1
            });
            $("#systemMessage1").html("<h4>Player 2: " + userName + "</h4>");

        }
        database.ref("game/turn").onDisconnect().remove();
    }


    var initializePlayers = function (gameData) {
        console.log("waiting for dB changes");
        if (gameData.child("game/players/1").exists()) {
            player1Ready = true;
            var name = gameData.child("game/players/1").val().name;
            var player1Wins = gameData.child("game/players/1").val().wins;
            var player1Losses = gameData.child("game/players/1").val().losses;
            $("#player1Title").text(name);
            player1Name = name;
            $("#player1Score").text("Wins: " + player1Wins + " Losses: " + player1Losses);
        }
        else {
            player1Ready = false;
            $("#player1Title").text("Waiting for Player 1");
        }

        if (gameData.child("game/players/2").exists()) {
            player2Ready = true;
            var name = gameData.child("game/players/2").val().name;
            var player2Wins = gameData.child("game/players/2").val().wins;
            var player2Losses = gameData.child("game/players/2").val().losses;
            $("#player2Title").text(name);
            player2Name = name;
            $("#player2Score").text("Wins: " + player2Wins + " Losses: " + player2Losses);
        }
        else {
            player2Ready = false;
            $("#player2Title").text("Waiting for Player 2");
        }
    }


    var setPlayerTurn = function (gameData) {
        console.log("set next player turn");
        var updatedTurn = parseInt(gameData.child("game/turn").val());
        if (turn !== 3 && updatedTurn === 3) {
            turn = 3;
            compareResults(gameData);
            timerId = setTimeout(resetGame, 5000);
        }
        else if (turn !== 1 && updatedTurn === 1) {
            turn = 1;
            $("#box3border").css({ "border-color": "black" });
            if (player === 1) {
                $("#systemMessage2").html("It's your turn");
                $("#player1Choice").children(".choices").show();
                $("#player1Choice").children(".chosen").hide();
            }
            else {
                $("#systemMessage2").html("Waiting for " + player1Name + " to choose.");
            }
        }
        else if (turn !== 2 && updatedTurn === 2) {
            turn = 2;
            $("#box1border").css({ "border-color": "black" });
            if (player === 2) {
                $("#systemMessage2").html("It's your turn " + player);
                $("#player2Choice").children(".choices").show();
                $("#player2Choice").children(".chosen").hide();
            }
            else {
                $("#systemMessage2").html("Waiting for " + player2Name + " to choose.");
            }
        }
    }


    var buildMessage = function (choice1, choice2) {
        var message;
        if (choice1 === "Rock" && choice2 === "Scissors") {
            message = " crushes Scissors";
        }
        if (choice1 === "Paper" && choice2 === "Rock") {
            message = " covers Rock";
        }
        if (choice1 === "Scissors" && choice2 === "Paper") {
            message = " cuts Paper"
        }
        console.log(message);
        return message;
    }


    var buildMessage2 = function (choice1, choice2) {
        var message;
        if (choice2 === "Rock" && choice1 === "Scissors") {
            message = " crushes Scissors";
        }
        if (choice2 === "Paper" && choice1 === "Rock") {
            message = " covers Rock";
        }
        if (choice2 === "Scissors" && choice1 === "Paper") {
            message = " cuts Paper"
        }
        console.log(message);
        return message;
    }


    var resetGame = function () {
        console.log("reset game");
        $(".chosen").hide();
        $("#result").empty();

        database.ref("game").update({
            "turn": 1
        });
    }
});