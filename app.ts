import * as TWEEN from '@tweenjs/tween.js';
import * as PIXI from 'pixi.js';

const app = new PIXI.Application({
  width: 1000,
  height: 860,
  backgroundColor: 'blue',
});
document.body.appendChild(app.view as any);

const GATE = {
  x: 400,
  y: (app.screen.height - 200) / 2,
  width: 100,
  height: 200,
};

const OPERATION_DELAY = 5000;
const SHIP_CREATION_INTERVAL = 8000;

enum Direction {
  Forward = 'forward',
  Return = 'return',
}

enum Color {
  Green = 'green',
  Red = 'red',
}

const docks: Dock[] = [];
let gateQueue: Ship[] = [];

const lineGraphics = new PIXI.Graphics();

lineGraphics.lineStyle(2, 0xffff00, 1);
lineGraphics.moveTo(GATE.x + GATE.width / 2, 0);
lineGraphics.lineTo(GATE.x + GATE.width / 2, GATE.y);

lineGraphics.moveTo(GATE.x + GATE.width / 2, GATE.y + GATE.height);
lineGraphics.lineTo(GATE.x + GATE.width / 2, app.screen.height);

app.stage.addChild(lineGraphics);

let gateIsFree: boolean = true;

class Dock extends PIXI.Graphics {
  constructor(public isEmpty: boolean = true) {
    super();
    this.draw();
  }

  draw() {
    this.clear();
    if (this.isEmpty) {
      this.lineStyle(2, 0xffff00, 1);
    } else {
      this.beginFill(0xffff00);
    }
    this.drawRect(0, 0, 100, 200);
  }

  targetedBy: Ship | null = null;
}

for (let i = 0; i < 4; i++) {
  const dock = new Dock();
  dock.y = i * (200 + 20);
  docks.push(dock);
  app.stage.addChild(dock);
}

class ShipMovement {
  constructor(private ship: Ship) {}

  moveToQueue() {
    const redQueueLength = gateQueue.filter(
      (ship) => ship.color === 'red'
    ).length;
    const greenQueueLength = gateQueue.filter(
      (ship) => ship.color === 'green'
    ).length;
    const stoppagePlaceBeforeGate = {
      x:
        this.ship.color === 'red'
          ? Ship.gatePosition.x + 100 + redQueueLength * (this.ship.width + 5)
          : Ship.gatePosition.x +
            100 +
            greenQueueLength * (this.ship.width + 5),

      y:
        this.ship.color === 'red'
          ? Ship.gatePosition.y - 50
          : Ship.gatePosition.y + 200,
    };

    const tweenToStoppagePlaceBeforeGate = new TWEEN.Tween(this.ship)
      .to(stoppagePlaceBeforeGate, 2000)
      .onComplete(() => {
        this.ship.lookForSuitableDock();
        if (!this.ship.targetDock) {
          const dockCheckInterval = setInterval(() => {
            this.ship.lookForSuitableDock();
            if (this.ship.targetDock) {
              clearInterval(dockCheckInterval);
            }
          }, 1000);
        }
      })
      .start();
  }

  lookForSuitableDock() {
    let suitableDock = this.findSuitableDock();

    if (suitableDock) {
      this.assignDock(suitableDock);
    } else {
      const dockCheckInterval = setInterval(() => {
        suitableDock = this.findSuitableDock();

        if (suitableDock) {
          this.assignDock(suitableDock);
          clearInterval(dockCheckInterval);
        }
      }, 0);
    }
  }

  private findSuitableDock() {
    return docks.find(
      (dock) =>
        (this.ship.color === Color.Green ? !dock.isEmpty : dock.isEmpty) &&
        dock.targetedBy === null
    );
  }

  private assignDock(dock: Dock) {
    const firstInQueue = gateQueue.filter(
      (ship) => ship.color === this.ship.color
    )[0];

    if (firstInQueue === this.ship) {
      dock.targetedBy = this.ship;
      this.ship.targetDock = dock;
      this.ship.startJourneyToDock();
    }
  }

  moveShipThroughGate() {
    gateQueue = gateQueue.filter((ship) => ship !== this.ship);
    const stoppagePlaceAfterGate =
      this.ship.direction === 'forward'
        ? { x: GATE.x - 100, y: GATE.y + 50 }
        : { x: GATE.x + 100, y: GATE.y + 50 };

    const tweenThroughGateToStoppagePlaceAfterGate = new TWEEN.Tween(this.ship)
      .to(stoppagePlaceAfterGate, 1000)
      .onComplete(() => {
        this.ship.moveShipToDestination();
        gateIsFree = true;
        updateQueuePositions(this.ship.color);
      })
      .start();
  }

  moveShipToDestination() {
    const tweenToDock = new TWEEN.Tween(this.ship)
      .to(
        this.ship.targetDock && this.ship.direction === 'forward'
          ? {
              x: this.ship.targetDock.width,
              y:
                this.ship.targetDock.y +
                this.ship.targetDock.height / 2 -
                this.ship.height / 2,
            }
          : { x: 900 },
        2000
      )
      .onComplete(() => {
        if (this.ship.targetDock && this.ship.direction === 'forward') {
          this.ship.startOperationWithCargo();
        } else {
          this.ship.destroy();
        }
      })
      .start();
  }

  startJourneyHome() {
    const tweenToGate = new TWEEN.Tween(this.ship)
      .to({ x: Ship.gatePosition.x - 100, y: Ship.gatePosition.y - 50 }, 2000)
      .onComplete(() => {
        const gateCheckInterval = setInterval(() => {
          if (gateIsFree) {
            console.log('return');
            this.ship.moveShipThroughGate();
            gateIsFree = false;
            clearInterval(gateCheckInterval);
          }
        }, 0);
      })
      .start();
  }
}

class Ship extends PIXI.Graphics {
  static gatePosition = GATE;
  private movement: ShipMovement;

  direction: Direction;
  color: Color;
  targetDock: Dock | null = null;

  constructor(direction: Direction, color: Color) {
    super();
    this.direction = direction;
    this.color = color;
    this.movement = new ShipMovement(this);

    if (color === 'green') {
      this.lineStyle(2, this.color, 1);
    } else {
      this.beginFill(this.color);
    }
    this.drawRect(0, 0, 100, 50);
    this.x = app.screen.width - this.width;
    this.y = Math.random() * (app.screen.height - this.height);
    this.moveToQueue();
    gateQueue.push(this);
  }
  moveToQueue() {
    this.movement.moveToQueue();
  }

  lookForSuitableDock() {
    this.movement.lookForSuitableDock();
  }
  startJourneyToDock() {
    const gateCheckInterval = setInterval(() => {
      if (gateIsFree) {
        this.moveShipThroughGate();
        gateIsFree = false;
        clearInterval(gateCheckInterval);
      }
    }, 0);
  }

  moveShipThroughGate() {
    this.movement.moveShipThroughGate();
  }

  moveShipToDestination() {
    this.movement.moveShipToDestination();
  }

  startOperationWithCargo() {
    setTimeout(() => {
      if (this.targetDock) {
        this.targetDock.isEmpty = !this.targetDock.isEmpty;
        this.targetDock.targetedBy = null;
        this.targetDock.draw();
      }
      this.changeCargo();
      this.startJourneyHome();
    }, OPERATION_DELAY);
  }
  changeCargo() {
    this.clear();
    if (this.color === 'green') {
      this.beginFill(this.color);
    } else {
      this.lineStyle(2, this.color, 1);
    }
    this.direction = Direction.Return;
    this.drawRect(0, 0, 100, 50);
  }
  startJourneyHome() {
    this.movement.startJourneyHome();
  }
}

function updateQueuePositions(color: Color) {
  gateQueue
    .filter((ship) => ship.color === color)
    .forEach((ship, index) => {
      const stoppagePlaceBeforeGate = {
        x:
          ship.color === 'red'
            ? Ship.gatePosition.x + 100 + index * (ship.width + 5)
            : Ship.gatePosition.x + 100 + index * (ship.width + 5),

        y:
          ship.color === 'red'
            ? Ship.gatePosition.y - 50
            : Ship.gatePosition.y + 200,
      };

      new TWEEN.Tween(ship).to(stoppagePlaceBeforeGate, 2000).start();
    });
}

const createShip = () => {
  const redQueueLength = gateQueue.filter(
    (ship) => ship.color === 'red'
  ).length;
  const greenQueueLength = gateQueue.filter(
    (ship) => ship.color === 'green'
  ).length;

  if (redQueueLength === 3 && greenQueueLength === 3) return;

  if (redQueueLength < 3 && greenQueueLength < 3) {
    const color = Math.random() < 0.5 ? Color.Green : Color.Red;
    const ship = new Ship(Direction.Forward, color);
    app.stage.addChild(ship);
  } else if (redQueueLength === 3 && greenQueueLength < 3) {
    const ship = new Ship(Direction.Forward, Color.Green);
    app.stage.addChild(ship);
  } else if (redQueueLength < 3 && greenQueueLength === 3) {
    const ship = new Ship(Direction.Forward, Color.Red);
    app.stage.addChild(ship);
  }
};

createShip();
setInterval(createShip, SHIP_CREATION_INTERVAL);
app.ticker.add(() => {
  TWEEN.update();
});
