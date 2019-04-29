var player1Connected = false;
var player2Connected = false;
var player = 0;
var turn = 0;
var player1Name = "";
var player2Name = "";
var rWins = "Scissors";
var pWins = "Rock";
var sWins = "Paper";

var timerId = 0;
var chat = [];
var statusRef1;
var statusRef2;

$(document).ready(function () {
    $(".choices").hide();
    $(".chosen").hide();

    var database = firebase.database();

    database.ref("game/chat").onDisconnect().remove();

    database.ref("game/chat").on("child_added", function (data) {
        var text = data.val().message;
        $("#chatMessage").val($("#chatMessage").val() + String.fromCharCode(13, 10) + text);
        $("#chatMessage").scrollTop($("#chatMessage")[0].scrollHeight);
    });


    database.ref().on("value", function (snapshot) {
        if (snapshot.child("game/players/1").exists()) {
            player1Connected = true;
            var name = snapshot.child("game/players/1").val().name;
            var player1Wins = snapshot.child("game/players/1").val().wins;
            var player1Losses = snapshot.child("game/players/1").val().losses;
            $("#box1row1").text(name);
            player1Name = name;
            $("#box1row3").text(`Wins: ${player1Wins} Losses: ${player1Losses}`);
        }
        else {
            player1Connected = false;
            $("#box1row1").text("Waiting for Player 1");
        }

        if (snapshot.child("game/players/2").exists()) {
            player2Connected = true;
            var name = snapshot.child("game/players/2").val().name;
            var player2Wins = snapshot.child("game/players/2").val().wins;
            var player2Losses = snapshot.child("game/players/2").val().losses;
            $("#box3row1").text(name);
            player2Name = name;
            $("#box3row3").text(`Wins: ${player2Wins} Losses: ${player2Losses}`);
        }
        else {
            player2Connected = false;
            $("#box3row1").text("Waiting for Player 2");
        }

        if (snapshot.child("game/turn").exists()) {
            var updatedTurn = parseInt(snapshot.child("game/turn").val());
            if (turn !== 3 && updatedTurn === 3) {
                turn = 3;
                compareResults(snapshot);
                timerId = setTimeout(resetGame, 5000);
            }
            else if (turn !== 1 && updatedTurn === 1) {
                turn = 1;
                $("#box3border").css({ "border-color": "black" });
                // $("#box1border").css({ "border-color": "lightgreen" });
                if (player === 1) {
                    $("#systemMessage2").html(`<h5>It's your turn!</h5>`);
                    $("#box1row2").children(".choices").show();
                    $("#box1row2").children(".chosen").hide();
                }
                else {
                    $("#systemMessage2").html(`<h5>Waiting for ${player1Name} to choose.</h5>`);
                }
            }
            else if (turn !== 2 && updatedTurn === 2) {
                turn = 2;
                $("#box1border").css({ "border-color": "black" });
                // $("#box3border").css({ "border-color": "lightgreen" });
                if (player === 2) {
                    $("#systemMessage2").html("<h5>It's your turn!</h5>");
                    $("#box3row2").children(".choices").show();
                    $("#box3row2").children(".chosen").hide();
                }
                else {
                    $("#systemMessage2").html(`<h5>Waiting for ${player2Name} to choose.</h5>`);
                }
            }
        }
    });


    $("#startButton").on("click", function (event) {
        event.preventDefault();
        var userName = $("#userName").val().trim();
        if (userName === undefined || userName === "") {
            alert("We need your name to play");
        }
        else {
            $("#userName").val("");
            $("#userName").hide();
            $("#startButton").hide();
            if (player1Connected && player2Connected) {
                alert("Sorry, Game Full! Try Again Later!");
            }
            else if (!player1Connected) {
                player1Connected = true;
                player = 1;
                statusRef1 = database.ref("game/players/1");
                statusRef1.set({
                    'losses': 0,
                    'name': userName,
                    'wins': 0,
                    'choice': null
                });
                statusRef1.onDisconnect().remove();
                if (player2Connected) {
                    database.ref("game").update({
                        'turn': 1
                    });
                }
                $("#systemMessage1").html("<h4>Player 1: "+userName+"</h4>");
            }
            else if (!player2Connected) {
                player2Connected = true;
                player = 2;
                statusRef2 = database.ref("game/players/2");
                statusRef2.set({
                    'losses': 0,
                    'name': userName,
                    'wins': 0
                });
                statusRef2.onDisconnect().remove();
                database.ref("game").update({
                    'turn': 1
                });
                $("#systemMessage1").html("<h4>Player 2: " + userName + "</h4>");

            }
            database.ref("game/turn").onDisconnect().remove();
        }
    });

    $(".choices").on("click", function (event) {
        var val = $(this).attr("value");
        database.ref("game/players/" + player).update({
            'choice': val
        });
        var boxRow = "";
        if (player === 1) {
            boxRow = "#box1row2";
        }
        else if (player === 2) {
            boxRow = "#box3row2";
        }
        $(boxRow).children(".choices").hide();
        var chosen = $(boxRow).children(".chosen");
        chosen.empty();
        var par = $("<p>");
        par.text(val);
        chosen.append(par);
        chosen.show();
        database.ref("game").update({
            'turn': turn + 1
        });
    });

    $("#chat").on("click", function (event) {
        event.preventDefault();
        if (player1Connected && player2Connected) {
            displayChatMessages();
        }
    });

    var compareResults = function (snapshot) {
        var choice1 = snapshot.child("game/players/1").val().choice;
        var choice2 = snapshot.child("game/players/2").val().choice;
        var wins1 = parseInt(snapshot.child("game/players/1").val().wins);
        var wins2 = parseInt(snapshot.child("game/players/2").val().wins);
        var losses1 = parseInt(snapshot.child("game/players/1").val().losses);
        var losses2 = parseInt(snapshot.child("game/players/2").val().losses);

        if ((choice1 === "Rock" && choice2 === rWins) ||
            (choice1 === "Paper" && choice2 === pWins) ||
            (choice1 === "Scissors" && choice2 === sWins)) {
            $("#result").html("<p>" + player1Name + " Wins!</p>");
            wins1++;
            losses2++;
        }
        else if (choice1 === choice2) {
            $("#result").html("<pTie Game!</p>");

        }
        else {
            $("#result").html("<p>" + player2Name + " Wins!</p>");
            wins2++;
            losses1++;
        }

        var boxRow = "";
        var val = "";
        if (player === 1) {
            boxRow = "#box3row2";
            val = choice2;
        }
        else if (player === 2) {
            boxRow = "#box1row2";
            val = choice1;
        }

        var chosen = $(boxRow).children(".chosen");

        chosen.empty();
        var par = $("<p>");
        par.text(val);
        chosen.append(par);
        chosen.show();

        database.ref("game/players/1").update({
            'wins': wins1,
            'losses': losses1
        });
        database.ref("game/players/2").update({
            'wins': wins2,
            'losses': losses2
        });
    }


    var displayChatMessages = function () {
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


    var resetGame = function () {
        $(".chosen").hide();
        $("#result").empty();

        database.ref("game").update({
            'turn': 1
        });
    }
});



