var slotWidth = 70;
var slotHeight = 70;
var border = 3;

class ChessBoard {
	constructor (x,y) {
		this.x = x;
		this.y = y;
		this.render();
	}

	render() {
		for (var i = 0; i < this.x; i++) {
			for (var j = 0; j < this.y; j++) {
				var slot = $('<div class="chessSlot"></div>');
				slot.attr('x',j);
				slot.attr('y',i);
				var wrapper = $('<div class="chessSlotWrapper"></div>');
				wrapper.append(slot);
				$('#chessTable').append(wrapper);
			}
		}
	}
}

var idcounter = 1;
class Unit {
	constructor (x,y,faction,img,symbol) {
		this.id = idcounter++;
		this.x = x;
		this.y = y;
		this.faction = faction;
		this.img = img;
		this.symbol = symbol;
		this.dead = false;
		this.render();
	}
	render() {
		var element = $('<div>');
		element.append("<div class='unitSymbol'>"+ this.symbol + "</div>");
		element.addClass('unit');
		element.css('left', (this.x * slotWidth) + (border * (this.x+1)) + "px");
		element.css('top', (this.y * slotHeight) + (border * (this.y+1)) + "px");
		element.css('background-image','url(' + this.img + ')');
		element.attr('uid', this.id);
		$("#units").append(element);
		this.element = element;
	}
	setGame(game) {
		this.game = game;
	}
	setPlayer(player) {
		this.player = player;
		this.element.addClass(this.player.pid);
	}
	move(x,y) {
		this.x = x;
		this.y = y;
		var animateTo = {'left': (x * slotWidth) + (border * (x+1)) + "px",
					     'top': (y * slotHeight) + (border * (y+1)) + "px"};
		this.element.animate(animateTo);
	}
	kill() {
		this.dead = true;
		this.element.hide();
	}
	select() { this.element.addClass('selected'); }
	deselect() { this.element.removeClass('selected'); }
	isKing() { return false; }
}

//UNIT TYPES
class Pawn extends Unit {
	constructor (x,y,faction,img) {
		super(x,y,faction,img,"&#9817;");
	}	
	isMoveValid(x,y) {
		if (this.player.position) {
			if ((y - this.y) == 1 && (x == this.x)) {
				return true;
			}
			return false;
		} else {
			if ((this.y - y) == 1 && (x == this.x)) {
				return true;
			}
			return false;
		}
	}
	isAttackValid(x,y) {
		var xDiff = x-this.x;
		var yDiff = y-this.y;
		if (this.player.position) {
			if (Math.abs(xDiff) == 1 && yDiff == 1) {
				return true;
			}
			return false;
		} else {
			if (Math.abs(xDiff) == 1 && yDiff == -1) {
				return true;
			}
			return false;
		}
	}
}
class Knight extends Unit {
	constructor (x,y,faction,img) {
		super(x,y,faction,img,"&#9816;");
	}		
	isMoveValid(x,y) {
		var xDiff = Math.abs(x - this.x);
		var yDiff = Math.abs(y - this.y);
		if ( ((xDiff == 2) && (yDiff == 1)) || ((xDiff == 1) && (yDiff == 2))) {
			return true;
		}
		return false;
	}
	isAttackValid(x,y) {
		return this.isMoveValid(x,y);
	}
}

class Rook extends Unit {
	constructor (x,y,faction,img) {
		super(x,y,faction,img,"&#9814;");
	}		
	isMoveValid(x,y) {
		var game = this.game;
		var xDiff = x - this.x;
		var yDiff = y - this.y;

		if (xDiff == 0) {
			if (yDiff>0) {
				for (var i = 1; i <= yDiff; i++) {
					if (!game.isSlotEmpty(this.x,this.y+i)) {
						return false;
					}
				}
			} else {
				for (var i = 1; i <= Math.abs(yDiff); i++) {
					if (!game.isSlotEmpty(this.x,this.y-i)) {
						return false;
					}
				}
			}
		} else if (yDiff == 0) {
			if (xDiff>0) {
				for (var i = 1; i <= xDiff; i++) {
					if (!game.isSlotEmpty(this.x+i,this.y)) {
						return false;
					}
				}
			} else {
				for (var i = 1; i <= Math.abs(xDiff); i++) {
					if (!game.isSlotEmpty(this.x-i,this.y)) {
						return false;
					}
				}
			}
		} else {
			return false;
		}
		return true;
	}
	isAttackValid(x,y) {
		var xDiff = x - this.x;
		var yDiff = y - this.y;

		if (xDiff == 0) {
			if (yDiff>0) {
				return this.isMoveValid(x,y-1);
			} else {
				return this.isMoveValid(x,y+1);
			}
		} else if (yDiff == 0) {
			if (xDiff>0) {
				return this.isMoveValid(x-1,y);
			} else {
				return this.isMoveValid(x+1,y);
			}
		} else {
			return false;
		}
		return true;
	}
}

class Bishop extends Unit {
	constructor (x,y,faction,img) {
		super(x,y,faction,img,"&#9815;");
	}		
	isMoveValid(x,y) {
		var xDiff = x - this.x;
		var yDiff = y - this.y;

		if (Math.abs(xDiff) == Math.abs(yDiff)) {
			for (var i = 1; i <= Math.abs(xDiff); i++) {
				if (!this.game.isSlotEmpty((xDiff > 0)?this.x+i:this.x-i,(yDiff > 0)?this.y+i:this.y-i)) {
					return false;
				}
			}
		} else {
			return false;
		}
		return true;
	}
	isAttackValid(x,y) {
		var xDiff = x - this.x;
		var yDiff = y - this.y;

		if (Math.abs(xDiff) == Math.abs(yDiff)) {
			return this.isMoveValid((xDiff > 0)?x-1:x+1,(yDiff > 0)?y-1:y+1);
		} else {
			return false;
		}
	}
}
class Queen extends Unit {
	constructor (x,y,faction,img) {
		super(x,y,faction,img,"&#9813;");
	}	
	isMoveValid(x,y) {
		if (Rook.prototype.isMoveValid.call(this,x,y)) { return true; }
		if (Bishop.prototype.isMoveValid.call(this,x,y)) { return true; }
		return false;
	}
	isAttackValid(x,y) {
	}
}

class King extends Unit {
	constructor (x,y,faction,img) {
		super(x,y,faction,img,"&#9812;"n);
	}		
	isMoveValid(x,y) {
		var xDiff = Math.abs(x - this.x);
		var yDiff = Math.abs(y - this.y);

		if (xDiff < 2 && yDiff < 2) {
			return true;
		}
		return false;
	}
	isAttackValid(x,y) {
		return this.isMoveValid(x,y);
	}
	isKing(){ return true; }
}

/*************
/* HUMAN UNITS
/*************/
class Footman extends Pawn {
	constructor (x,y) {
		super(x,y,'human','images/human/BTNFootman.png');
	}
}
class SteamTank extends Rook {
	constructor (x,y) {
		super(x,y,'human','images/human/BTNSteamTank.png');	
	}	
}
class HumanKnight extends Knight {
	constructor (x,y) {
		super(x,y,'ork','images/human/BTNKnight.png');	
	}
}
class Sorceress extends Bishop {
	constructor (x,y) {
		super(x,y,'human','images/human/BTNSorceress.png');	
	}	
}
class HumanHero2 extends Queen {
	constructor (x,y) {
		super(x,y,'human','images/human/BTNHeroMountainKing.png');	
	}	
}
class HumanHero extends King {
	constructor (x,y) {
		super(x,y,'human','images/human/BTNHeroArchMage.png');	
	}	
}

/*************
/* ORK UNITS
/*************/
class Grunt extends Pawn {
	constructor (x,y) {
		super(x,y,'ork','images/ork/BTNGrunt.png');
	}
}
class Catapult extends Rook {
	constructor (x,y) {
		super(x,y,'ork','images/ork/BTNCatapult.png');	
	}	
}
class Raider extends Knight {
	constructor (x,y) {
		super(x,y,'ork','images/ork/BTNRaider.png');	
	}	
}
class WitchDoctor extends Bishop {
	constructor (x,y) {
		super(x,y,'ork','images/ork/BTNWitchDoctor.png');	
	}
}
class OrkHero2 extends Queen {
	constructor (x,y) {
		super(x,y,'ork','images/ork/BTNHeroBlademaster.png');	
	}	
}
class OrkHero extends King {
	constructor (x,y) {
		super(x,y,'ork','images/ork/BTNShadowHunter.png');	
	}	
}

/******************
/* NIGHTELVEN UNITS
/******************/
class Archer extends Pawn {
	constructor (x,y) {
		super(x,y,'nightelven','images/nightelven/BTNArcher.png');
	}
}
class GlaiveThrower extends Rook {
	constructor (x,y) {
		super(x,y,'nightelven','images/nightelven/BTNGlaiveThrower.png');	
	}	
}
class Huntress extends Knight {
	constructor (x,y) {
		super(x,y,'nightelven','images/nightelven/BTNHuntress.png');	
	}	
}
class DruidOfTheTalon extends Bishop {
	constructor (x,y) {
		super(x,y,'nightelven','images/nightelven/BTNDruidOfTheTalon.png');	
	}
}
class NightElvenHero2 extends Queen {
	constructor (x,y) {
		super(x,y,'nightelven','images/nightelven/BTNHeroDemonHunter.png');	
	}	
}
class NightElvenHero extends King {
	constructor (x,y) {
		super(x,y,'nightelven','images/nightelven/BTNKeeperOfTheGrove.png');	
	}	
}

/****************
/* UNDEAD UNITS
/***************/
class Ghoul extends Pawn {
	constructor (x,y) {
		super(x,y,'undead','images/undead/BTNGhoul.png');
	}
}
class MeatWagon extends Rook {
	constructor (x,y) {
		super(x,y,'undead','images/undead/BTNMeatWagon.png');	
	}	
}
class CryptFiend extends Knight {
	constructor (x,y) {
		super(x,y,'undead','images/undead/BTNCryptFiend.png');	
	}	
}
class Necromancer extends Bishop {
	constructor (x,y) {
		super(x,y,'undead','images/undead/BTNNecromancer.png');	
	}
}
class UndeadHero2 extends Queen {
	constructor (x,y) {
		super(x,y,'undead','images/undead/BTNHeroDeathKnight.png');	
	}	
}
class UndeadHero extends King {
	constructor (x,y) {
		super(x,y,'undead','images/undead/BTNHeroLich.png');	
	}	
}

class Player {
	//Position == true -> top
	//Position == false -> bottom
	constructor(name, faction, position, pid) {
		this.name = name;
		this.faction = faction;
		this.units = [];
		this.position = position;
		this.pid = pid;
	}

	createUnits(game) {
		var pos = this.position?0:7;
		switch(this.faction) {
			case "ork":
				for (var i = 0; i < 8; i++) { this.units.push(new Grunt(i,this.position?1:6)); }
				this.units.push(new Catapult(0,pos), new Catapult(7,pos));
				this.units.push(new Raider(1,pos), new Raider(6,pos));
				this.units.push(new WitchDoctor(2,pos), new WitchDoctor(5,pos));
				this.units.push(new OrkHero(3,pos), new OrkHero2(4,pos));
				break;
			case "human":
				for (var i = 0; i < 8; i++) { this.units.push(new Footman(i,this.position?1:6)); }
				this.units.push(new SteamTank(0,pos), new SteamTank(7,pos));
				this.units.push(new HumanKnight(1,pos), new HumanKnight(6,pos));
				this.units.push(new Sorceress(2,pos), new Sorceress(5,pos));
				this.units.push(new HumanHero(3,pos), new HumanHero2(4,pos));
				break;
			case "undead":
				for (var i = 0; i < 8; i++) { this.units.push(new Ghoul(i,this.position?1:6)); }
				this.units.push(new MeatWagon(0,pos), new MeatWagon(7,pos));
				this.units.push(new CryptFiend(1,pos), new CryptFiend(6,pos));
				this.units.push(new Necromancer(2,pos), new Necromancer(5,pos));
				this.units.push(new UndeadHero(3,pos), new UndeadHero2(4,pos));
				break;
			case "nightelven":
				for (var i = 0; i < 8; i++) { this.units.push(new Archer(i,this.position?1:6)); }
				this.units.push(new GlaiveThrower(0,pos), new GlaiveThrower(7,pos));
				this.units.push(new Huntress(1,pos), new Huntress(6,pos));
				this.units.push(new DruidOfTheTalon(2,pos), new DruidOfTheTalon(5,pos));
				this.units.push(new NightElvenHero(3,pos), new NightElvenHero2(4,pos));
				break;
		}

		//Create back reference to player game objects
		for (var i in this.units) {
			this.units[i].setPlayer(this);
			this.units[i].setGame(game);
		}
	}
}

class ChessGame {
	constructor(whoami) {
		this.selectedUnit = null;
		this.whoami = whoami;
		var board = new ChessBoard(8,8);
	}
	selectUnit(unit) {
		if (this.selectedUnit) {
			this.selectedUnit.deselect();
		}
		unit.select();
		this.selectedUnit = unit;
	}
	createPlayer1(name, faction, position) {
		this.p1 = new Player(name, faction, position, 'p1');
		this.p1.createUnits(this);
	}
	createPlayer2(name, faction, position) {
		this.p2 = new Player(name, faction, position, 'p2');
		this.p2.createUnits(this);
	}
	isPlayerActionValid(unit, x, y) {
		if (this.isSlotEmpty(x,y)) {
			return unit.isMoveValid(x,y);
		} else {
			return unit.isAttackValid(x,y);
		}
	}
	performAction(unit, x, y) {
		var targetUnit = this.getUnitAtXY(x,y);
		unit.move(x,y);
		if (targetUnit) {
			targetUnit.kill();
		}
	}
	getUnitByUid(uid) {
		var allUnits = this.p1.units.concat(this.p2.units);
		for (var i in allUnits) {
			var unit = allUnits[i];
			if (unit.id == uid) {
				return unit;
			}
		}
		return null;
	}
	getMyUnits() {
	    if (this.whoami == 'p1') {
	      return this.p1.units;
	    } else {
	      return this.p2.units;
	    }
	}
	getOpponentUnits() {
	    if (this.whoami == 'p1') {
	      return this.p2.units;
	    } else {
	      return this.p1.units;
	    }
	}
	getUnitAtXY(x,y) {
		var allUnits = this.p1.units.concat(this.p2.units).filter(function(u){return !u.dead});
		for (var i in allUnits) {
			var unit = allUnits[i];
			if (unit.x == x && unit.y == y) {
				return unit;
			}
		}
		return null;
	}
	isSlotEmpty(x,y) {
		var allUnits = this.p1.units.concat(this.p2.units).filter(function(u){return !u.dead});;
		for (var i in allUnits) {
			var unit = allUnits[i];
			if (unit.x == x && unit.y == y) {
				return false;
			}
		}
		return true;
	}
}