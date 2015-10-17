/* Brettspiel nach Hero Quest */


/* Aufbau des Programms:
 *   - LGame: View/Controler mit aller Logik und dem Modell
 *     - Hauptteil des Programms. Enthält:
 *       - Modell, inklusive Standard-Brett und Beispiel-Level
 *       - Komplette Logik der Figuren und deren Möglichkeiten
 *   - Board: Liste von Reihen von Feldern
 *   - BoardRow: Layout-Hilfe: 1 Reihe von Feldern
 *   - Tile: 1 Feld, inklusive Bild, Wänden und Türen
 *   - Pic: Bild eines Helden/Gegners/Hindernisses/etc. auf einem Feld
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
  pending: null,

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
  addBlocks: function (board, blocks) {
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      board.tiles[b.x][b.y].block = b.type;
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
        { x: 3, y: 0, type: "stone" },
        { x: 13, y: 2, type: "stone" },
        { x: 5, y: 0, type: "stone" },
      ],
      sprites: [
        {
          x: 0, y: 0,
          name: "Barbar", type: "hero",
          lives: 8,
          pic: "gf.png",
        },
        {
          x: 2, y: 0,
          name: "Goblin", type: "monster",
          pic: "goblin.png",
        },
        {
          x: 0, y: 2,
          name: "Zwerg", type: "hero",
          lives: 7, reach: 1,
          pic: "zwerg.png",
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

          /* automatisch fahren */
          play: function () {
            var z = this.findEnemy("Zwerg");
            var target = {
              x: z.coord.x,
              y: 0,
            };
            var p = this.findPath(this.coord, target, { 'walls': true});
            if (p && p.length <= 8) {
              this.moveXY(target.x, target.y);
            }
            else if (p) {
              var s = p[8];
              this.moveXY(s.x, s.y);
            }
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

    /* Der erste Figur fängt an. */
    board.turn = 0;

    this.board = board;
    return {data: this.board };
  },
  receivedData: function () {
    this.setState({data: this.board });
  },
  coordsMatch: function (c1, c2) {
    if (c1.x == c2.x && c1.y == c2.y) {
      return 1;
    }
    else {
      return 0;
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
  animateMove: function (moving, path) {
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
          if (this.pending) {
            var p = this.pending;
            this.pending = null;
            p();
          }
        }
      }.bind(this), 200);
    }
  },
  tryMoveTo: function (coord) {
    var sp = this.coordsSprite(coord);
    var m = this.board.moving;
    if (sp !== null && m != sp && sp.type != "attack") {
      /* Auf dem Feld steht schon jemand. Vielleicht als Angriff */
      if (m.attack.area == 'XY' && (coord.x != m.coord.x && coord.y != m.coord.y)) {
        /* Normalerweise kann nicht angegriff werden, wenn X- oder
         * Y-Koordinate gleich ist. */
        this.doAbortAttack('Nicht in der gleichen Zeile/Spalte');
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
        var attackPossible = this.findPath(sp.coord, m.coord, ignoreObstacles);
        if (!attackPossible) {
          this.doAbortAttack('Kein Pfad gefunden.');
        }
        /* Reicht die Angriffs-Reichweite für den Pfad? */
        else if (attackPossible.length > m.attack.reach + 1) {
          this.doAbortAttack('Zu weit weg.');
        }
        else {
          this.doAttack(sp);
        }
      }
    }
    /* Stein */
    else if (this.board.tiles[coord.x][coord.y].block == "stone") {
      /* auch ein Stein kann angegriffen werden, wenn X/Y
       * mit der eigenen Position übereinstimmt
       */
      if (coord.x == m.coord.x || coord.y == m.coord.y) {
        var d_x, d_y;
        if (coord.y == m.y) {
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

        var p = this.findPath(m.coord, to);
        if (!p) {
          this.board.message = "Kein Pfad vor den Stein gefunden.";
        }
        else {
          var stoneTo = {
            x: coord.x + d_x * -1,
            y: coord.y + d_y * -1,
          };
          var ps = this.findPath(coord, stoneTo);
          if (!ps) {
            this.board.message = "Stein kann nicht verschoben werden.";
          }
          else {
            this.board.tiles[coord.x][coord.y].block = null;
            this.board.tiles[stoneTo.x][stoneTo.y].block = "stone";
          }
        }
      }
      /* X/Y passt nicht -> Feld ist blockiert */
      else {
        this.board.message = "Dieses Feld ist blockiert.";
      }
    }
    else {
      this.doMoveTo(coord);
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
  useTurn: function (who) {
    this.board.moving = who;
  },
  endTurn: function () {
    var sp;
    do {
      this.board.turn = (this.board.turn + 1) % (this.board.sprites.length - 1);
      sp = this.board.sprites[this.board.turn + 1];
    } while (sp.active != true);

    this.board.moving = null;
    if (sp.play) {
      /* kann automatisch fahren */
      if (sp.play) {
        var game = this;
        var f = function () {
          var self = {
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
            findPath: function (from, to, ignore) {
              return game.findPath(from, to, ignore);
            },
            moveXY: function (x, y) {
              game.actionMoveFrom({ from: this.coord, to: {x: x, y: y}});
            },
          };
          for (var k in self) {
            if (typeof k == 'function') {
              self[k].bind(self);
            }
          }
          sp.play.call(self);

          /* falls play() nicht zu einem kompletten Zug führt,
           * dann hier weitersetzen */
          if (this.board.sprites[this.board.turn + 1] == sp) {
            this.endTurn();
          }
        }.bind(this);
        if (this.animation) {
          this.pending = f;
        }
        else {
          f();
        }
      }
    }
  },
  actionStartMove: function (who) {
    this.actionInit();
    this.useTurn(who);
    if (who.type == "monster") {
      this.board.message = "Wohin soll der Gegner?";
    }
    else {
      this.board.message = who.name + ": Wohin willst Du gehen?";
    }
    this.actionFinally();
  },
  actionSetMessage: function (message) {
    this.actionInit();
    this.board.message = message;
    this.actionFinally();
  },
  doAbortAttack: function (message) {
    this.board.message = "Angriff nicht möglich: " + message;
  },
  actionMoveFrom: function (args) {
    var sp = this.board.tiles[args.from.x][args.from.y].sprite;
    if (this.board.sprites[this.board.turn + 1] == sp) {
      this.useTurn(sp);
      this.actionClick(args.to);
    }
    else {
      this.actionInit();
      this.actionSetMessage("Der " + this.board.sprites[this.board.turn + 1].name + " ist am Zug.");
      this.actionFinally();
    }
  },
  doMoveTo: function (coord) {
    var m = this.board.moving;
    if (!m) {
      return;
    }
    var i = m.move.ignore ? m.move.ignore : null;
    var p = this.findPath(m.coord, coord, i);
    if (p) {
      if (p.length > m.move.range + 1) {
        this.board.message = "Zu weit weg.";
      }
      else {
        this.openDoors(p);
        this.animateMove(m, p);
      }
    }
    else {
      if (this.board.tiles[coord.x][coord.y].block == "stone") {
        this.board.message = "Dieses Feld ist blockiert.";
      }
      else {
        this.board.message = "Keinen Weg gefunden.";
      }
    }
  },
  actionClick: function (coord) {
    this.actionInit();
    if (this.animation != -1) {
      this.board.message = "Warte auf Deinen Zug.";
    }
    else if (this.board.moving) {
      this.tryMoveTo(coord);
      this.endTurn();
    }
    else {
      var sp = this.coordsSprite(coord);
      if (sp) {
        if (this.board.sprites[this.board.turn + 1] == sp) {
          this.actionStartMove(sp);
        }
        else {
          this.actionSetMessage("Der " + this.board.sprites[this.board.turn + 1].name + " ist am Zug.");
        }
      }
      else {
        this.actionSetMessage("Hier steht doch niemand.");
      }
    }
    this.actionFinally();
  },
  doAttack: function (sprite) {
    sprite.lives--;
    if (sprite.lives <= 0) {
      sprite.active = false;

      this.board.sprites[0].active = true;
      this.board.sprites[0].subtype = sprite.type;

      this.board.tiles[sprite.coord.x][sprite.coord.y].sprite = this.board.sprites[0];
      this.board.sprites[0].coord.x = sprite.coord.x;
      this.board.sprites[0].coord.y = sprite.coord.y;
    }
    else {
      this.board.message = "Noch " + sprite.lives + " Leben";
    }
  },
  coordEvent: function (command, coords) {
    if (command == "click") {
      this.actionClick(coords.coord);
    }
    else if (command == "drag") {
      this.actionMoveFrom(coords);
    }
  },
  findPath: function (from, to, ignoreObstacles) {
    var t = { first: null, last: null };
    t.first = t.last = { val: from, next: null, from: []};
    var ignore = ignoreObstacles ? ignoreObstacles : {};

    var visited = {};
    visited[from.x + "/" + from.y] = true;

    var found = null;
    while (t.first) {
      var el = t.first;
      t.first = t.first.next;
      if (!t.first) {
        t.last = null;
      }
      var c = el.val;

      if (this.coordsMatch(c, to)) {
        found = el.from.concat(to);
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
        var cnext = {
          val: nc,
          next: null,
          from: el.from.concat(c),
        };

        if (nc.x < 0 || nc.y < 0 ||
            nc.y >= this.board.rows || nc.x >= this.board.cols) {
          continue;
        }
        if (visited[nc.x + "/" + nc.y]) {
          continue;
        }
        visited[nc.x + "/" + nc.y] = true;

        if (this.board.tiles[nc.x][nc.y].block == "stone") {
          if (!ignore.stones) {
            continue;
          }
        }
        if (nc.x != to.x || nc.y != to.y) {
          if (this.board.tiles[nc.x][nc.y].sprite) {
            if (this.board.tiles[nc.x][nc.y].sprite.active) {
              if (!ignore.sprites) {
                continue;
              }
            }
          }
        }

        if (!t.last) {
          t.first = t.last = cnext;
        }
        else {
          t.last.next = cnext;
          t.last = cnext;
        }
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
      if (tile.block == 'stone') {
        return (
          <span key={key} className="stone">
            <img src="img/mauer.png" />
          </span>
        );
      }
      else {
        return (
          <span key={key}>?</span>
        );
      }
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
