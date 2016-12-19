function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

var username = getURLParameter('name');
var gameroom = getURLParameter('room');
var userfaction = getURLParameter('faction');
var clienttype = getURLParameter('type');

// Enable pusher logging - don't include this in production
Pusher.logToConsole = true;

class GameClient {
  constructor(name, room, faction, whoami) {
    this.status = 'init';
    this.name = name;
    this.faction = faction;
    this.whoami = whoami;
    this.pusher = new Pusher('85bd7d5035de9cd7ceb0', {
      cluster: 'eu',
      encrypted: true,
      authEndpoint: 'pusher/auth.php',
    });
    this.channel = this.pusher.subscribe('private-' + room);

    this.console = new MyConsole();
    this.game = new ChessGame(whoami);
    this.scoreboard = new Vue({
      el: '#vuestuff',
      data: {
        loaded: false,
        p1: {}, 
        p2: {},
        whoseturn: null
      }
    });
  }

  initScoreboard() {
    this.scoreboard.p1 = {
      name: this.game.p1.name,
      faction: this.game.p1.faction,
      position: this.game.p1.position
    }
    this.scoreboard.p2 = {
      name: this.game.p2.name,
      faction: this.game.p2.faction,
      position: this.game.p2.position
    }
    this.scoreboard.loaded = true;  
  }
  startGame() {
    var that = this;

    //Init scoreboard
    this.initScoreboard();

    //Start listening to opponent actions
    this.channel.bind('client-opponent-action', function(data) {
      that.opponentAction(data.uid, data.x, data.y);
    });

    //Unit selection
    var units = this.game.getMyUnits();
    for (var i in units) {
      var that = this;
      var createCallback = function(unit) {
        unit.element.click(function(){
          that.game.selectUnit(unit);
        });
      }
      createCallback(units[i]);
    }

    //Unit movement
    $('.chessSlot').click(function(){
      if (!that.myturn) return;
      var x = Number($(this).attr('x'));
      var y = Number($(this).attr('y'));
      that.playerAction(x,y);
    });

    //Unit attack
    var units = this.game.getOpponentUnits();
    for (var i in units) {
      var that = this;
      var createCallback = function(unit) {
        unit.element.click(function(){
          if (!that.myturn) return;
          that.playerAction(unit.x, unit.y);
        });
      }
      createCallback(units[i]);
    }
  }
  playerAction(x,y) {
    if (this.game.selectedUnit && this.game.isPlayerActionValid(this.game.selectedUnit,x,y)) {
      this.channel.trigger('client-opponent-action', { uid: this.game.selectedUnit.id, x:x, y:y });
      this.myturn = false;
      if (this.whoami == 'p1') {
        this.scoreboard.whoseturn = 'p2';
      } else {
        this.scoreboard.whoseturn = 'p1';
      }
      this.game.performAction(this.game.selectedUnit, x, y);
    }
  }
  opponentAction(uid, x, y) {
    var unit = this.game.getUnitByUid(uid);
    this.game.performAction(unit, x, y);
    this.myturn = true;
    this.scoreboard.whoseturn = this.whoami;
  }
}

class CreateClient extends GameClient {
  constructor(name, room, faction) {
    super(name, room, faction, 'p1');

    this.position = (Math.round(Math.random()) == 1)?true:false;
    var whostarts = (Math.round(Math.random()) == 1)?true:false;

    var that = this;
    this.console.write("Waiting for other player to join");
    this.channel.bind('client-join-action', function(data) {
      that.console.write("Player joined, game starts in 2 seconds");
      setTimeout(function(){
        that.channel.trigger('client-start-action', { name: name, faction: faction, position: that.position, whostarts:whostarts });
        
        that.console.write("Game started");
        that.status = "started";

        if (whostarts) {
          that.myturn = true;
          that.scoreboard.whoseturn = 'p1';
        } else {
          that.myturn = false;
          that.scoreboard.whoseturn = 'p2';          
        }

        that.game.createPlayer1(that.name, that.faction, that.position);
        that.game.createPlayer2(data.name, data.faction, !that.position);
        that.startGame();
      }, 500);
    });
  }
}

class JoinClient extends GameClient {
  constructor(name, room, faction) {
    super(name, room, faction, 'p2');

    var that = this;
    this.channel.bind('pusher:subscription_succeeded', function() {
      that.channel.trigger('client-join-action', { name: name, faction: faction });
      that.console.write("Join signal sent, waiting for the game to start");
      that.channel.bind('client-start-action', function(data) {
        that.position = (data.position == "true")?false:true;

        that.console.write("Game started");
        that.status = "started";

        if (data.whostarts) {
          that.myturn = false;
          that.scoreboard.whoseturn = 'p1';
        } else {
          that.myturn = true;
          that.scoreboard.whoseturn = 'p2';
        }

        that.game.createPlayer1(data.name, data.faction, data.position);
        that.game.createPlayer2(that.name, that.faction, !data.position);
        that.startGame();
      });
    });
  }
}

class ViewerClient {

}
var client;
switch(clienttype) {
  case "create":
    client = new CreateClient(username, gameroom, userfaction);
    break;
  case "join":
    client = new JoinClient(username, gameroom, userfaction);
    break;
}

