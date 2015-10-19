/* Brettspiel nach Hero Quest */


/* Aufbau des Programms:
 *   - LGame: View/Controler mit aller Logik und dem Modell
 *     - Hauptteil des Programms. Enthält:
 *       - Modell, inklusive Standard-Brett und Beispiel-Level
 *       - Komplette Logik der Figuren und deren Möglichkeiten
 *   - Board: Liste von Reihen von Feldern
 *   - BoardRow: Layout-Hilfe: 1 Reihe von Feldern
 *   - Tile: 1 Feld, inklusive Bild, Wänden und Türen
 *   - Pic: Bild eines Helden/Monsters/Hindernisses/etc. auf einem Feld
 *   - Message: Statusanzeige / Hinweise
 * */

"use strict";

/* Das Programm ist für den Webbrowser geschrieben.
 * Es soll aber auch auf dem Server mittels node ausfürbar sein
 * (Vorablayout).
 * */
if (typeof React == 'undefined') {
  var React = require('react');
}

var LGame = React.createClass({
  board: {},
  animation: -1,
  pending: [],

  addWalls: function (board, w) {
    for (var i = 0; i < w.length; i++) {
      var x = w[i].x;
      var y = w[i].y;
      var d = w[i].dir;
      var dir = 0;
      var end_x;
      var end_y;
      if (d == 'y') {
        dir = 1;
        end_x = x;
        end_y = w[i].to;
      }
      else {
        end_x = w[i].to;
        end_y = y;
      }
      var move = [
        { x: 1, y: 0},
        { x: 0, y: 1},
      ];
      while (x <= end_x && y <= end_y) {
        if (d == 'y') {
          board.tiles[x][y].east = 'W';
          board.tiles[x+1][y].west = 'W';
        }
        else {
          board.tiles[x][y].south = 'W';
          board.tiles[x][y+1].north = 'W';
        }
        x = x + move[dir].x;
        y = y + move[dir].y;
      }
    }
  },
  addDoors: function (board, doors) {
    for (var i = 0; i < doors.length; i++) {
      var d = doors[i];
      var x = d.x;
      var y = d.y;
      var dir = d.dir;
      if (dir == 'y') {
        board.tiles[x][y].south = 'D';
        board.tiles[x][y+1].north = 'D';
      }
      else {
        board.tiles[x][y].east = 'D';
        board.tiles[x+1][y].west = 'D';
      }
    }
  },
  addBlocks: function (board, inBlocks) {
    for (var i = 0; i < inBlocks.length; i++) {
      var b = inBlocks[i];
      board.blocks.push({
        type: b.type,
        pic: b.pic,
        movable: b.movable ? true : false,
      });
      board.tiles[b.x][b.y].block = board.blocks[board.blocks.length - 1];
    }
  },
  addSprites: function (board, sprites) {
    for (var i = 0; i < sprites.length; i++) {
      var s = sprites[i];
      board.sprites.push({
        coord: {
          x: s.x,
          y: s.y,
        },
        name: s.name,
        type: s.type,
        active: true,
        lives: s.lives ? s.lives : 1,
        move: {
          range: s.range ? s.range : 100,
          ignore: s.ignoreObstacles ? s.ignoreObstacles :
                    s.type == "hero" ? { doors: true} : null,
        },
        attack: {
          area: s.attackArea ? s.attackArea : 'XY',
          reach: s.reach ? s.reach : 100,
        },
        pic: s.pic ? s.pic : null,
        play: s.play ? s.play : null,
      });
      var sp = board.sprites[board.sprites.length - 1];
      board.tiles[s.x][s.y].sprite = sp;
    }
  },
  addToBoard: function (board, t) {
    for (var k in t) {
      if (k == "walls") {
        this.addWalls(board, t[k]);
      }
      else if (k == "doors") {
        this.addDoors(board, t[k]);
      }
      else if (k == "blocks") {
        this.addBlocks(board, t[k]);
      }
      else if (k == "sprites") {
        this.addSprites(board, t[k]);
      }
    }
  },
  createBoard: function (cols, rows) {
    var board = {
      rows: rows,
      cols: cols,
      message: "",
      tiles: {},
      sprites: [],
      blocks: [],
      moving: null,
    };

    for (var x = 0; x < board.cols; x++) {
      board.tiles[x] = {};
      for (var y = 0; y < board.rows; y++) {
        board.tiles[x][y] = {};
        board.tiles[x][y].sprite = null;
      }
    }

    board.sprites[0] = {
      coord: {
        x: 0,
        y: 0,
      },
      name: "attack1",
      type: "attack",
      active: false,
      lives: 0,
    };

    return board;
  },
  getInitialState: function () {

    var board = this.createBoard(26, 19);

    /* basic board layout */
    this.addToBoard(board, {
      walls: [
        /* "outer" walls */
        { x: 1, y: 0, dir: 'x', to: 11 },
        { x: 14, y: 0, dir: 'x', to: 24 },
        { x: 1, y: 17, dir: 'x', to: 11 },
        { x: 14, y: 17, dir: 'x', to: 24 },
        { x: 0, y: 1, dir: 'y', to: 8 },
        { x: 0, y: 10, dir: 'y', to: 17 },
        { x: 24, y: 1, dir: 'y', to: 8 },
        { x: 24, y: 10, dir: 'y', to: 17 },
        /* horizoncal corridors */
        { x: 1, y: 9, dir: 'x', to: 8 },
        { x: 1, y: 8, dir: 'x', to: 8 },
        { x: 17, y: 9, dir: 'x', to: 24 },
        { x: 17, y: 8, dir: 'x', to: 24 },
        /* vertical corridors */
        { x: 11, y: 1, dir: 'y', to: 5 },
        { x: 13, y: 1, dir: 'y', to: 5 },
        { x: 11, y: 13, dir: 'y', to: 17 },
        { x: 13, y: 13, dir: 'y', to: 17 },
        /* inner/main room */
        { x: 10, y: 6, dir: 'x', to: 15 },
        { x: 10, y: 11, dir: 'x', to: 15 },
        { x: 9, y: 7, dir: 'y', to: 11 },
        { x: 9, y: 7, dir: 'y', to: 11 },
        { x: 15, y: 7, dir: 'y', to: 11 },
        /* corridors around the main room */
        /*   horizontal */
        { x: 9, y: 5, dir: 'x', to: 11 },
        { x: 14, y: 5, dir: 'x', to: 16 },
        { x: 9, y: 12, dir: 'x', to: 11 },
        { x: 14, y: 12, dir: 'x', to: 16 },
        /*   vertical */
        { x: 8, y: 6, dir: 'y', to: 8 },
        { x: 16, y: 6, dir: 'y', to: 8 },
        { x: 8, y: 10, dir: 'y', to: 12 },
        { x: 16, y: 10, dir: 'y', to: 12 },
        /* inner rooms top left */
        { x: 4, y: 1, dir: 'y', to: 8 },
        { x: 8, y: 1, dir: 'y', to: 5 },
        { x: 1, y: 3, dir: 'x', to: 8 },
        /* inner rooms top right */
        { x: 20, y: 1, dir: 'y', to: 8 },
        { x: 16, y: 1, dir: 'y', to: 5 },
        { x: 17, y: 4, dir: 'x', to: 24 },
        /* inner rooms bottom left */
        { x: 4, y: 10, dir: 'y', to: 17 },
        { x: 6, y: 10, dir: 'y', to: 12 },
        { x: 8, y: 10, dir: 'y', to: 17 },
        { x: 1, y: 13, dir: 'x', to: 4 },
        { x: 5, y: 12, dir: 'x', to: 8 },
        /* inner rooms bottom right */
        { x: 17, y: 13, dir: 'y', to: 17 },
        { x: 17, y: 12, dir: 'x', to: 17 },
        { x: 18, y: 13, dir: 'x', to: 24 },
        { x: 6, y: 10, dir: 'y', to: 12 },
        { x: 20, y: 10, dir: 'y', to: 17 },
      ],
    });

    /* example level */
    this.addToBoard(board, {
      doors: [
        { x: 0, y: 1, dir: 'x' },
      ],
      blocks: [
        { x: 3, y: 0, type: "stone", pic: "mauer.png" },
        { x: 13, y: 2, type: "stone", pic: "mauer.png" },
        { x: 5, y: 0, type: "stone", pic: "mauer.png" },
        { x: 3, y: 1, type: "table", pic: "tisch.png" },
      ],
      sprites: [
        {
          x: 0, y: 0,
          name: "Barbar", type: "hero",
          lives: 8,
          pic: "gf.png",
        },
        {
          x: 0, y: 2,
          name: "Zwerg", type: "hero",
          lives: 7, reach: 1,
          pic: "zwerg.png",
        },
        {
          x: 2, y: 0,
          name: "Goblin", type: "monster",
          pic: "goblin.png",
          play: function () {
            var p = this.findPath(this.coord, {}, function (coord) {
              var sp = this.getSprite(coord);
              if (sp && sp.type == "hero") {
                return true;
              }
              else {
                return false;
              }
            }.bind(this));
            var actions = [];
            if (!p) {
              // nothing
            }
            else if (p.length == 1) {
              actions.push({action: "attack", coord: p[0]});
            }
            else {
              var theHero = p.pop();
              var atHero = p.pop();
              actions.push({action: "move", coord: atHero});
              actions.push({action: "attack", coord: theHero});
            }
            return actions;
          },
        },
        {
          x: 25, y: 0,
          name: "Alb", type: "hero",
          lives: 6,
          attackArea: 'path',
          pic: "alb.png",
        },
        {
          x: 23, y: 0,
          name: "Zauberer", type: "hero",
          lives: 4,
          attackArea: 'everywhere',
          pic: "zauberer.png",
        },
        {
          x: 3, y: 3,
          name: "Orc", type: "monster",
          range: 8,
          ignoreObstacles: { 'walls': true },
          pic: "orc.png",

          // automatisch fahren
          play: function () {
            var actions = [];
            var z = this.findEnemy("Zwerg");
            var target = {
              x: z.coord.x,
              y: 0,
            };
            var p = this.findPathTo(this.coord, z.coord, { 'walls': true});
            if (p && p.length == 2) {
              actions = [ { action: "move", coord: {x: 2, y: 4}}];
            }
            else if (p) {
              var enemyindex = 0;
              var canAttack = false;
              while (!canAttack) {
                enemyindex = enemyindex + 1;
                var pos = p[enemyindex];
                if (pos.x == z.coord.x || pos.y == z.coord.y) {
                  canAttack = true
                  ;
                }
              }
              actions = [
                { action: "move", coord: p[enemyindex]},
                { action: "attack", coord: z.coord },
              ];
            }
            else if (p && p.length <= 8) {
              actions.push({action: "move", coord: target});
              actions.push({action: "attack", coord: z.coord});
            }
            else if (p) {
              var s = p[8];
              actions.push({action: "move", coord: s});
            }
            return actions;
          },

        },
        {
          x: 12, y: 9,
          name: "Gargoyle", type: "monster",
          lives: 2,
          attackArea: 'everywhere',
          pic: "gargoyle.png",
        },
      ],
    });

    this.board = board;
    /* Die erste Figur fängt an. */
    board.turn = 0;
    var m = this.board.sprites[1];
    this.moving = {
      sprite: m,
      canMove: true,
      canAttack: true,
    };
    this.board.message = "Was soll der " + m.name + " machen?";

    return {data: this.board };
  },
  receivedData: function () {
    this.setState({data: this.board });
  },
  coordsMatch: function (c1, c2) {
    if (c1.x == c2.x && c1.y == c2.y) {
      return true;
    }
    else {
      return false;
    }
  },
  coordsSprite: function (coord) {
    var sp = this.board.tiles[coord.x][coord.y].sprite;
    return sp;
  },
  openDoors: function (path) {
    for (var i = 0; i < path.length - 1; i++) {
      var t1 = path[i];
      var t2 = path[i + 1];
      var dirStr = "" + (t2.x - t1.x) + "" + (t2.y - t1.y);
      var dir;
      var rdir;
      switch (dirStr) {
        case "0-1": /* North */
          dir = 'north'; rdir = 'south';
          break;
        case "01": /* South */
          dir = 'south'; rdir = 'north';
          break;
        case "10": /* East */
          dir = 'east'; rdir = 'west';
          break;
        case "-10": /* West */
          dir = 'west'; rdir = 'east';
          break;
      }
      if (this.board.tiles[t1.x][t1.y][dir] == 'D') {
        this.board.tiles[t1.x][t1.y][dir] = 'd';
        this.board.tiles[t2.x][t2.y][rdir] = 'd';
      }
    }
  },
  animateAbortAttack: function (message) {
    this.animateMessage("Angriff nicht möglich: " + message);
  },
  animateMessage: function (message) {
    this.board.message = message;
    this.animation = setTimeout(function () {
      this.animation = -1;
      if (this.pending.length > 0) {
        var p = this.pending.shift();
        p();
      }
    }.bind(this), 500);
  },
  animateMove: function (moving, path) {
    this.moving.canMove = false; /* nur einmal laufen pro Zug */
    this.openDoors(path);
    if (path.length > 1) {
      var m = moving;
      var step = 1;
      this.animation = setInterval(function () {
        /* Moving Sprite */
        this.board.tiles[m.coord.x][m.coord.y].sprite = null;
        m.coord.x = path[step].x;
        m.coord.y = path[step].y;
        this.board.tiles[m.coord.x][m.coord.y].sprite = m;
        step++;
        this.setState({data: this.board });
        if (step >= path.length) {
          clearInterval(this.animation);
          this.animation = -1;
          if (this.pending.length > 0) {
            var p = this.pending.shift();
            p();
          }
        }
      }.bind(this), 200);
    }
  },
  animateMoveStone: function (coord, stoneTo) {
    this.moving.canAttack = false;
    var b = this.board.tiles[coord.x][coord.y].block;
    this.board.tiles[coord.x][coord.y].block = null;
    this.board.tiles[stoneTo.x][stoneTo.y].block = b;
  },
  animateAttack: function (m, sprite) {
    this.moving.canAttack = false; /* nur einmal attackieren pro Zug */
    this.board.message = "Der " + m.name + " greift den " + sprite.name + " an.";

    this.animation = setTimeout(function () {
      sprite.lives--;
      if (sprite.lives <= 0) {
        sprite.active = false;

        var att = this.board.sprites[0];
        if (att.active == true) {
          this.board.tiles[att.coord.x][att.coord.y].sprite = null;
        }
        att.active = true;
        att.subtype = sprite.type;

        this.board.tiles[sprite.coord.x][sprite.coord.y].sprite = this.board.sprites[0];
        att.coord.x = sprite.coord.x;
        att.coord.y = sprite.coord.y;
        this.board.message = "Der " + sprite.name + " ist aus dem Spiel.";
      }
      else {
        this.board.message = "Der " + sprite.name + " hat noch " + sprite.lives + " Leben";
      }
      this.animation = -1;
      if (this.pending.length > 0) {
        var p = this.pending.shift();
        p();
      }
    }.bind(this), 500);
  },
  tryMoveTo: function (coord) {
    var sp = this.coordsSprite(coord);
    var m = this.moving.sprite;
    if (this.coordsMatch(m.coord, coord)) {
      /* Auf die Figur clicken bedeutet passen. */
      this.moving.canMove = this.moving.canAttack = false;
    }
    else if (sp !== null && m != sp && sp.type != "attack") {
      if (!this.moving.canAttack) {
        this.animateAbortAttack('Kein Angriff mehr möglich.');
      }
      /* Auf dem Feld steht schon jemand. Vielleicht als Angriff */
      else if (m.attack.area == 'XY' && (coord.x != m.coord.x && coord.y != m.coord.y)) {
        /* Normalerweise kann nicht angegriff werden, wenn X- oder
         * Y-Koordinate gleich ist. */
        this.animateAbortAttack('Nicht in der gleichen Zeile/Spalte');
      }
      else {
        var ignoreObstacles = {};
        /* Figur darf angereifen, wenn es irgend einen Pfad
         * von der Figur zum Ziel gibt. */
        if (m.attack.area == 'everywhere') {
          /* Manche Figuren können durch Hindernisse gehen */
          ignoreObstacles = {
            'walls': true,
            'doors': true,
            'sprites' : true,
            'stones': true,
          };
        }
        var attackPath = this.findPathTo(sp.coord, m.coord, ignoreObstacles);
        if (!attackPath) {
          this.animateAbortAttack('Kein Pfad gefunden.');
        }
        /* Reicht die Angriffs-Reichweite für den Pfad? */
        else if (attackPath.length > m.attack.reach + 1) {
          this.animateAbortAttack('Zu weit weg.');
        }
        else {
          /* ist der Pfad entlang der X/Y-Richtung? */
          var attackOK = true;
          if (m.attack.area == 'XY') {
            var dir = coord.x == m.coord.x ? 'x' : 'y';
            for (var i = 0; i < attackPath.length; i++) {
              if (attackPath[i][dir] != m.coord[dir]) {
                this.animateAbortAttack('Kein Pfad in der gleichen Zeile/Spalte');
                attackOK = false;
                break;
              }
            }
          }
          if (attackOK) {
            this.animateAttack(m, sp);
          }
        }
      }
    }
    /* Stein */
    else if (this.board.tiles[coord.x][coord.y].block
             && this.board.tiles[coord.x][coord.y].block.type == "stone") {
      /* auch ein Stein kann angegriffen werden, wenn X/Y
       * mit der eigenen Position übereinstimmt
       */
      if (coord.x == m.coord.x || coord.y == m.coord.y) {
        var d_x, d_y;
        if (coord.y == m.coord.y) {
          d_x = -1;
          d_y = 0;
          if (m.coord.x > coord.x) { d_x = +1; }
        }
        else {
          d_x = 0;
          d_y = -1;
          if (m.coord.y > coord.y) { d_y = +1; }
        }

        var to = {
          x: coord.x + d_x,
          y: coord.y + d_y,
        };

        var p = this.findPathTo(m.coord, to, {});
        if (!p) {
          this.animateMessage("Kein Pfad vor den Stein gefunden.");
        }
        else {
          var stoneTo = {
            x: coord.x + d_x * -1,
            y: coord.y + d_y * -1,
          };
          var ps = this.findPathTo(coord, stoneTo);
          if (!ps) {
            this.animateMessage("Stein kann nicht verschoben werden.");
          }
          if (!this.moving.canAttack) {
            this.animateAbortAttack('Kein Angriff mehr möglich.');
          }
          else {
            this.animateMoveStone(coord, stoneTo);
          }
        }
      }
      /* X/Y passt nicht -> Feld ist blockiert */
      else {
        this.animateMessage("Dieses Feld ist blockiert.");
      }
    }
    /* anderes Hindernis */
    else if (this.board.tiles[coord.x][coord.y].block) {
      this.animateMessage("Dieses Feld ist blockiert.");
    }
    else {
      var ign = m.move.ignore ? m.move.ignore : {};
      var mp = this.findPathTo(m.coord, coord, ign);
      if (mp) {
        if (mp.length > m.move.range + 1) {
          this.animateMessage("Zu weit weg.");
        }
        if (!this.moving.canMove) {
          this.animateAbortAttack('Kein Fahren mehr möglich.');
        }
        else {
          this.animateMove(m, mp);
        }
      }
      else {
        if (this.board.tiles[coord.x][coord.y].block) {
          this.animateMessage("Dieses Feld ist blockiert.");
        }
        else {
          this.animateMessage("Keinen Weg gefunden.");
        }
      }
    }
  },
  actionInit: function () {
    this.board.message = "";
    /* Pseudo-Sprite "toter Gegener" entfernen */
    if (this.board.sprites[0].active) {
      var sp = this.board.sprites[0];
      this.board.tiles[sp.coord.x][sp.coord.y].sprite = null;
    }
    this.board.sprites[0].active = false;
  },
  actionFinally: function () {
    this.receivedData();
  },
  endTurn: function () {
    var humans = 0;
    var robots = 0;
    /* gibt es noch menschliche Mitspieler? */
    for (var i = 1; i < this.board.sprites.length; i++) {
      var sph = this.board.sprites[i];
      if (!sph.active) {
        continue;
      }
      if (sph.play) {
        robots++;
      }
      else {
        humans++;
      }
    }
    if (humans < 1) {
      this.animateMessage("Game Over!");
      return;
    }
    else if (robots < 1) {
      this.animateMessage("You won!");
      return;
    }

    this.animateMessage("test");
    var sp;
    /* Darf noch ein Zug gemacht werden? */
    if (this.moving.canMove || this.moving.canAttack) {
      sp = this.moving.sprite;
      this.animateMessage("Der " + sp.name + " kann noch " +
        (this.moving.canMove ? "fahren." : "attackieren."));
    }
    else {
      do {
        this.board.turn = (this.board.turn + 1) % (this.board.sprites.length - 1);
        sp = this.board.sprites[this.board.turn + 1];
      } while (sp.active != true);

      this.moving = {
        sprite: sp,
        canMove: true,
        canAttack: true,
      };
      /* falls sp.play gesetzt ist, kann die Figure automatisch fahren */
      if (sp.play) {
        this.animateMessage("Der " + sp.name + " zieht jetzt.");
        this.doAutoPlay(sp);
      }
      else {
        this.animateMessage("Was soll der " + sp.name + " machen?");
      }
    }
  },
  doAutoPlay: function (sp) {
    var game = this;

    /* object für den 'this'-Pointer */
    var player = {
      coord: {
        x: sp.coord.x,
        y: sp.coord.y,
      },
      findEnemy: function (name) {
        for (var i = 0; i < game.board.sprites.length; i++) {
          if (game.board.sprites[i].name == name) {
            return game.board.sprites[i];
          }
        }
        return null;
      },
      findPathTo: function (from, to, ignore) {
        return game.findPathTo(from, to, ignore);
      },
      findPath: function (from, ignore, match) {
        return game.findPath(from, ignore, match);
      },
      getSprite: function (coord) {
        return game.coordsSprite(coord);
      },
    };
    for (var k in player) {
      if (typeof k == 'function') {
        player[k].bind(self);
      }
    }
    var f = function () {

      var actions = sp.play.call(player);

      if (actions && actions.length) {
        /* es sind maximal 2 Aktionen erlaubt */
        if (actions.length > 0) {
          this.runAction(sp, actions[0]);
        }
        if (actions.length > 1) {
          this.runAction(sp, actions[1]);
        }
      }
      /* pass (in case there was an action (move/attack) left */
      this.runAction(sp, { action: "pass/endturn" });
    }.bind(this);
    if (this.animation != -1) {
      this.pending.push(f);
    }
    else {
      f();
    }
  },
  runAction: function (sp, action) {
    var f = function () {
      var tsp = this.board.sprites[this.board.turn + 1];
      if (action.action == 'pass/endturn') {
        /* falls sp noch am Zug wäre -> nächster bitte */
        if (tsp == sp) {
          this.moving.canMove = this.moving.canAttack = false;
          this.endTurn();
        }
      }
      else if (action.action == 'endturn') {
        if (tsp == sp) {
          this.endTurn();
        }
      }
      else {
        this.tryMoveTo(action.coord);
      }
      this.actionFinally();
      /* MoveTo kann async auslösen -> startet nächste Funktion,
       * oder aber nicht -> nächste Funktion wird hier gestartet
       * */
      if (this.animation == -1) {
        if (this.pending.length > 0) {
          var n = this.pending.shift();
          n();
        }
      }
    }.bind(this);
    if (this.animation != -1) {
      this.pending.push(f);
    }
    else {
      f();
    }
  },
  actionMoveFrom: function (args) {
    var sp = this.board.tiles[args.from.x][args.from.y].sprite;
    if (this.moving.sprite == sp) {
      this.actionClick(args.to);
    }
    else {
      this.actionInit();
      this.board.message = "Der " + sp.name + " kann nicht. Der " + this.moving.sprite.name + " ist am Zug.";
      this.actionFinally();
    }
  },
  actionClick: function (coord) {
    this.actionInit();
    if (this.animation != -1) {
      this.board.message = "Warte auf Deinen Zug.";
    }
    else {
      this.tryMoveTo(coord);
      this.runAction(this.moving.sprite, { action: "endturn" });
    }
    this.actionFinally();
  },
  coordEvent: function (command, coords) {
    if (command == "click") {
      this.actionClick(coords.coord);
    }
    else if (command == "drag") {
      this.actionMoveFrom(coords);
    }
  },
  findPathTo: function (from, to, ignoreObstacles) {
    return this.findPath(from, ignoreObstacles, function (coord) {
      return this.coordsMatch(to, coord);
    }.bind(this));
  },
  /* Findet einen Pfad von einer Quell-Koordinate (from)
   * zu einem anderen Feld, für das die Funktion "match" true
   * zurückliefert.
   * */
  findPath: function (from, ignoreObstacles, match) {
    var qp = []; /* queue of paths */
    qp.push([from]);
    var ignore = ignoreObstacles ? ignoreObstacles : {};

    var visited = {};
    visited[from.x + "/" + from.y] = true;

    var found = null;
    while (qp.length > 0) {

      var p = qp.shift();
      var c = p[p.length - 1];

      if (match(c)) {
        found = p;
        break;
      }
      var walls = this.board.tiles[c.x][c.y];
      for (var k in { 'north': 1, 'east': 1, 'south': 1, 'west': 1 }) {
        if (walls[k] == 'W') {
          if (!ignore.walls) {
            continue;
          }
        }
        if (walls[k] == 'D') {
          if (!ignore.doors) {
            continue;
          }
        }

        var dir = {
          'north': {x: +0, y: -1 },
          'east': {x: +1, y: +0 },
          'south': {x: +0, y: +1 },
          'west': {x: -1, y: +0 },
        };
        var nc = {
          x: c.x + dir[k].x,
          y: c.y + dir[k].y,
        };
        if (nc.x < 0 || nc.y < 0 ||
            nc.y >= this.board.rows || nc.x >= this.board.cols) {
          continue;
        }
        if (visited[nc.x + "/" + nc.y]) {
          continue;
        }
        visited[nc.x + "/" + nc.y] = true;

        if (this.board.tiles[nc.x][nc.y].block) {
          if (this.board.tiles[nc.x][nc.y].block.type != "stone" || !ignore.stones) {
            continue;
          }
        }
        /* Andere Figuren sind Hindernisse. Ausnahme ist das Ziel.
         * Wenn das Ziel eine Figur ist, so wird dies als
         * Angriff aufgefasst und es soll der Pfad zum Ziel
         * gefunden werden.
         * */
        if (this.board.tiles[nc.x][nc.y].sprite) {
          if (this.board.tiles[nc.x][nc.y].sprite.active) {
            if (!match(nc)) {
              if (!ignore.sprites) {
                continue;
              }
            }
          }
        }
        qp.push(p.concat(nc));
      }
    }
    return found;
  },
  findElement: function (coord, kind) {
    if (kind == "tile") {
      return this.board.tiles[coord.x][coord.y];
    }
    else if (kind == "sprite") {
      var sp = this.coordsSprite(coord);
      return sp;
    }
    else {
      return null;
    }
  },
  componentDidMount: function() {
  },
  render: function() {
    var sp = this.board.sprites[this.board.turn + 1];
    return (
      <div className="LGame">
        <h1>L-Spiel</h1>
        <Message key={"a-message"} message={this.board.message} />
        <TurnMessage key={"t-message"} turn={sp} />
        <Board rows={this.board.rows} cols={this.board.cols} coordEvent={this.coordEvent} findElement={this.findElement} />
      </div>
    );
  },
});

var Message = React.createClass({
  render: function () {
    return (
      <div className="message">
        {this.props.message}
      </div>
    );
  },
});

var TurnMessage = React.createClass({
  render: function () {
    var sp = this.props.turn;
    var p = sp.pic ? sp.pic : p;
    return (
      <div className="turn-message">
        <span key={"turn-message-1"}>Der {sp.name} [</span>
        <span key={"img-message"} className={sp.type}>
          <img src={"img/" + p} title={sp.name + " (" + sp.lives + ")"} />
        </span>
        <span key={"turn-message-2"}>] ist am Zug</span>
      </div>
    );
  },
});
/*
 * Auswahl eines Bildes auf einem nichtleeren Feld.
 * */
var Pic = React.createClass({
  render: function () {
    var sp = this.props.findElement(this.props.coord, "sprite");
    var tile = this.props.findElement(this.props.coord, "tile");
    var key = "pic-" + this.props.coord.x + "-" + this.props.coord.y;
    if (!sp && !tile.block) {
      return (
        <span key={key}></span>
      );
    }
    else if (tile.block) {
      var bp = "mauer.png";
      if (tile.block.pic) {
        bp = tile.block.pic;
      }
      return (
        <span key={key} className="stone">
          <img src={"img/" + bp} />
        </span>
      );
    }
    else if (sp.type == "attack") {
      if (sp.subtype == "hero") {
        return (
          <span key={key} className="attack">
            <img src="img/verloren.png" />
          </span>
        );
      }
      else {
        return (
          <span key={key} className="attack">
            <img src="img/attack.png" />
          </span>
        );
      }
    }
    else if (sp.type == "hero" || sp.type == "monster") {
      var p = "enemy.png";
      if (sp.pic) {
        p = sp.pic;
      }
      return (
        <span key={key} className={sp.type}>
          <img src={"img/" + p} title={sp.name + " (" + sp.lives + ")"} />
        </span>
      );
    }
    else {
      return <span key={key}>?</span>;
    }
  },
});

/*
 * Ein Feld.
 *   - Setzt die CSS-Klassen zur Anzeige von Türen und Wänden
 *   - (mimimale) Drag&Drop-Logik
 *   - Enthält ggf. ein Bild
 * */
var Tile = React.createClass({
  handleClick: function () {
    this.props.coordEvent("click", {coord: this.props.coord});
  },
  handleDragStart: function (e) {
    e.dataTransfer.setData("L-Spiel", JSON.stringify({
      x: this.props.coord.x,
      y: this.props.coord.y,
    }));
  },
  handleDrop: function (e) {
    e.preventDefault();
    var from = JSON.parse(e.dataTransfer.getData("L-Spiel"));
    this.props.coordEvent("drag", {from: from, to: this.props.coord});
  },
  handleDragOver: function (e) {
    e.preventDefault();
  },
  render: function () {
    var x = this.props.coord.x;
    var y = this.props.coord.y;

    var tile = this.props.findElement(this.props.coord, "tile");
    var classes = [];
    for (var k in tile) {
      classes.push("tile-" + k + "-" + tile[k]);
    }

    return (
      <div key={"tile-" + x + "/" + y} className={"tile " + classes.join(" ")} onClick={this.handleClick} onDragStart={this.handleDragStart} onDrop={this.handleDrop} onDragOver={this.handleDragOver}>
        <Pic coord={this.props.coord} findElement={this.props.findElement}/>
      </div>
    );
  },
});

var BoardRow = React.createClass({
  render: function() {
    var tiles = [];
    for (var x = 0; x < this.props.cols; x++) {
      var coords = {};
      coords.y = this.props.y;
      coords.x = x;
      tiles.push(
        <Tile findElement={this.props.findElement} key={this.props.y + "," + x} coord={coords} coordEvent={this.props.coordEvent} />
      );
    }
    return (
        <div key={"boardrow-" + this.props.y} className="tileRow">
          {tiles}
        </div>
    );
  },
});

var Board = React.createClass({
  render: function() {
    var rows = [];
    for (var y = 0; y < this.props.rows; y++) {
      rows.push(
          <BoardRow key={"board-" + y} coordEvent={this.props.coordEvent} findElement={this.props.findElement} y={y} cols={this.props.cols} />
      );
    }

    return (
      <div className="board">
        {rows}
      </div>
    );
  },
});

/* Im Browser: Render-Funktion aufrufen. */
if (typeof document != 'undefined') {
  React.render(
    <LGame key="LGame" />,
    document.getElementById('content')
  );
}

/* Als Module in node: Haupt-Komponente exportieren */
if (typeof module != 'undefined') {
  module.exports.LGame = LGame;
}

/* Hinweise für lint: */
/* global require */
/* global module */
