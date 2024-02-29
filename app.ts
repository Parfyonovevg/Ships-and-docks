import * as TWEEN from '@tweenjs/tween.js';
import * as PIXI from 'pixi.js';

const app = new PIXI.Application({
  width: 1000,
  height: 860,
  backgroundColor: 'blue',
});
document.body.appendChild(app.view as any);

class Dock extends PIXI.Graphics {
  constructor(public isEmpty: boolean = true) {
    super();
    this.draw();
  }

  draw() {
    this.clear();
    if (this.isEmpty) {
      this.lineStyle(2, 0xffff00, 1); // yellow border
    } else {
      this.beginFill(0xffff00); // yellow color
    }
    this.drawRect(0, 0, 100, 200);
  }

  targetedBy: Ship | null = null;
}

class Gate extends PIXI.Graphics {
  constructor() {
    super();
    this.beginFill(0x000000); // black color
    this.drawRect(0, 0, 100, 200); // draw a rectangle as the gate
    this.endFill();
  }
}

let gate = new Gate();
gate.x = 400;
gate.y = (app.screen.height - gate.height) / 2;
app.stage.addChild(gate);

const docks: Dock[] = [];
let gateQueue: Ship[] = [];

let gateIsFree: boolean = true;

for (let i = 0; i < 4; i++) {
  let dock = new Dock();
  dock.y = i * (200 + 20);
  docks.push(dock);
  app.stage.addChild(dock);
}

class Ship extends PIXI.Graphics {
  static gatePosition = { x: gate.x, y: gate.y };
  direction: 'forward' | 'return';
  color: string;
  targetDock: Dock | null;

  constructor(direction: 'forward' | 'return', color: string) {
    super();
    this.direction = direction;
    this.color = color;
    this.targetDock = null;
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
    const redQueueLength = gateQueue.filter(
      (ship) => ship.color === 'red'
    ).length;
    const greenQueueLength = gateQueue.filter(
      (ship) => ship.color === 'green'
    ).length;
    let stoppagePlaceBeforeGate = {
      x:
        this.color === 'red'
          ? Ship.gatePosition.x + 100 + redQueueLength * (this.width + 5)
          : Ship.gatePosition.x + 100 + greenQueueLength * (this.width + 5),

      y:
        this.color === 'red'
          ? Ship.gatePosition.y - 50
          : Ship.gatePosition.y + 200,
    };

    const tweenToStoppagePlaceBeforeGate = new TWEEN.Tween(this)
      .to(stoppagePlaceBeforeGate, 2000)
      .onComplete(() => {
        this.lookForSuitableDock();
      })
      .start();
  }

  lookForSuitableDock() {
    let suitableDock;

    if (this.color === 'green') {
      suitableDock = docks.find(
        (dock) => !dock.isEmpty && dock.targetedBy === null
      );
    } else {
      suitableDock = docks.find(
        (dock) => dock.isEmpty && dock.targetedBy === null
      );
    }

    if (suitableDock) {
      suitableDock.targetedBy = this;
      this.targetDock = suitableDock;
      this.startJourneyToDock();
    } else {
      let dockCheckInterval = setInterval(() => {
        if (this.color === 'green') {
          suitableDock = docks.find(
            (dock) => !dock.isEmpty && dock.targetedBy === null
          );
        } else {
          suitableDock = docks.find(
            (dock) => dock.isEmpty && dock.targetedBy === null
          );
        }

        if (suitableDock) {
          suitableDock.targetedBy = this;
          this.targetDock = suitableDock;
          clearInterval(dockCheckInterval);
          this.startJourneyToDock();
        }
      }, 0);
    }
  }
  startJourneyToDock() {
    let gateCheckInterval = setInterval(() => {
      if (gateIsFree) {
        this.moveShipThroughGate();
        gateIsFree = false;
        clearInterval(gateCheckInterval);
      }
    }, 0);
  }

  moveShipThroughGate() {
    const stoppagePlaceAfterGate =
      this.direction === 'forward'
        ? { x: gate.x - 100, y: gate.y + 50 }
        : { x: gate.x + 100, y: gate.y + 50 };

    let tweenThroughGateToStoppagePlaceAfterGate = new TWEEN.Tween(this)
      .to(stoppagePlaceAfterGate, 1000)
      .onComplete(() => {
        this.moveShipToDestination();
        gateIsFree = true;
      })
      .start();
    gateQueue = gateQueue.filter((ship) => ship !== this);
  }

  moveShipToDestination() {
    let tweenToDock = new TWEEN.Tween(this)
      .to(
        this.targetDock && this.direction === 'forward'
          ? {
              x: this.targetDock.width,
              y:
                this.targetDock.y +
                this.targetDock.height / 2 -
                this.height / 2,
            }
          : { x: 900 },
        2000
      )
      .onComplete(() => {
        if (this.targetDock && this.direction === 'forward') {
          console.log('moveShipToDock');
          this.startOperationWithCargo();
        } else {
          console.log('destroy');
          this.destroy();
        }
      })
      .start();
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
    }, 5000);
  }
  changeCargo() {
    this.clear();
    if (this.color === 'green') {
      this.beginFill(this.color);
    } else {
      this.lineStyle(2, this.color, 1);
    }
    this.direction = 'return';
    this.drawRect(0, 0, 100, 50);
  }
  startJourneyHome() {
    let tweenToGate = new TWEEN.Tween(this)
      .to({ x: Ship.gatePosition.x - 100, y: Ship.gatePosition.y }, 2000)
      .onComplete(() => {
        let gateCheckInterval = setInterval(() => {
          if (gateIsFree) {
            console.log('return');
            this.moveShipThroughGate();
            gateIsFree = false;
            clearInterval(gateCheckInterval);
          }
        }, 0);
      })
      .start();
  }
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
    const color = Math.random() < 0.5 ? 'green' : 'red';
    const ship = new Ship('forward', color);
    app.stage.addChild(ship);
  } else if (redQueueLength === 3 && greenQueueLength < 3) {
    const ship = new Ship('forward', 'green');
    app.stage.addChild(ship);
  } else if (redQueueLength < 3 && greenQueueLength === 3) {
    const ship = new Ship('forward', 'red');
    app.stage.addChild(ship);
  }
};

createShip();
setInterval(createShip, 8000);
app.ticker.add(() => {
  TWEEN.update();
});
