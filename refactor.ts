// import * as TWEEN from '@tweenjs/tween.js';
// import * as PIXI from 'pixi.js';

// const app = new PIXI.Application({
//   width: 1000,
//   height: 860,
//   backgroundColor: 'blue',
// });
// document.body.appendChild(app.view as any);

// class Dock extends PIXI.Graphics {
//   constructor(public isEmpty: boolean = true) {
//     super();
//     this.draw();
//   }

//   draw() {
//     this.clear();
//     if (this.isEmpty) {
//       this.lineStyle(2, 0xffff00, 1); // yellow border
//     } else {
//       this.beginFill(0xffff00); // yellow color
//     }
//     this.drawRect(0, 0, 100, 200);
//   }

//   targetedBy: Ship | null = null;
// }

// class Gate extends PIXI.Graphics {
//   constructor() {
//     super();
//     this.beginFill(0x000000); // black color
//     this.drawRect(0, 0, 100, 200); // draw a rectangle as the gate
//     this.endFill();
//   }
// }

// let gate = new Gate();
// gate.x = 400; // position the gate 400 pixels from the left side of the screen
// gate.y = (app.screen.height - gate.height) / 2; // position the gate at the center of the screen by y
// app.stage.addChild(gate);

// const docks: Dock[] = [];
// const gateQueue: Ship[] = [];
// let gateIsFree: boolean = true;

// for (let i = 0; i < 4; i++) {
//   let dock = new Dock();
//   dock.y = i * (200 + 20); // position the docks vertically with a gap of 20
//   docks.push(dock);
//   app.stage.addChild(dock);
// }

// class Ship extends PIXI.Graphics {
//   color: string;
//   targetDock: Dock | null;
//   constructor(color: string) {
//     super();
//     this.color = color;
//     this.targetDock = null;
//     if (this.color === 'green') {
//       this.lineStyle(2, this.color, 1); // green border
//     } else {
//       this.beginFill(this.color); // red fill
//     }
//     this.drawRect(0, 0, 100, 50);
//   }
//   changeCargo() {
//     this.clear();
//     if (this.color === 'green') {
//       this.beginFill(this.color);
//     } else {
//       this.lineStyle(2, this.color, 1);
//     }
//     this.drawRect(0, 0, 100, 50);
//   }

//   moveToQueue(gatePosition: { x: number; y: number }, direction: string) {
//     let stoppagePlaceBeforeGate =
//       direction === 'forward'
//         ? {
//             x: gatePosition.x + 150, // 50 units before the gate on x-axis
//             y:
//               this.color === 'red'
//                 ? gatePosition.y - 50
//                 : gatePosition.y + 200,
//           }
//         : {
//             x: gatePosition.x - 50, // 50 units before the gate on x-axis
//             y: gatePosition.y,
//           };

//     let tweenToStoppagePlaceBeforeGate = new TWEEN.Tween(this)
//       .to(stoppagePlaceBeforeGate, 2000) // immediate movement
//       .start();
//   }

//   startJourneyToDock(dock: Dock) {
//     this.targetDock = dock;

//     this.moveShipToTheGate({ x: gate.x, y: gate.y }, 'forward', dock);
//   }

//   moveShipToTheGate(
//     gatePosition: { x: number; y: number },
//     direction: string,
//     dock?: Dock
//   ) {
//     let stoppagePlaceBeforeGate =
//       direction === 'forward'
//         ? {
//             x: gatePosition.x + 150,
//             y:
//               this.color === 'red' ? gatePosition.y - 50 : gatePosition.y + 200,
//           }
//         : {
//             x: gatePosition.x - 150,
//             y: gatePosition.y - 50,
//           }; // 100 units before the gate on x-axis

//     let tweenToStoppagePlaceBeforeGate = new TWEEN.Tween(this)
//       .to(stoppagePlaceBeforeGate, 2000) // 2 seconds
//       .onComplete(() => {
//         // Once the ship reaches the stoppage place before the gate, check if the gate is free
//         let gateCheckInterval = setInterval(() => {
//           if (gateIsFree && direction === 'forward' && dock) {
//             // If the gate is free, set it to occupied and move the ship to the gate
//             this.moveShipThroughGate(gatePosition, 'forward', dock);
//             gateIsFree = false;
//             clearInterval(gateCheckInterval);
//           } else if (gateIsFree && direction === 'return') {
//             // If the gate is not free, the ship waits at the stoppage place
//             this.moveShipThroughGate(gatePosition, 'return', dock);
//             gateIsFree = false;
//             clearInterval(gateCheckInterval);
//           } else {
//             gateQueue.push(this);
//           }
//         }, 100);
//       })
//       .start();
//   }

//   moveShipThroughGate(destination: any, direction: string, dock?: Dock) {
//     let stoppagePlaceAfterGate =
//       direction === 'forward'
//         ? { x: destination.x - 100, y: destination.y + 50 }
//         : { x: destination.x + 100, y: destination.y + 50 }; // 100 units after the gate on x-axis

//     let tweenThroughGateToStoppagePlaceAfterGate = new TWEEN.Tween(this)
//       .to(stoppagePlaceAfterGate, 1000)
//       .onComplete(() => {
//         // Once the ship reaches the stoppage place after the gate, set the gate to free and move the ship to the dock
//         if (direction === 'forward' && dock) {
//           this.moveShipToDestination(dock);
//         } else {
//           this.moveShipToDestination();
//         }
//         gateIsFree = true;
//       })
//       .start();
//   }

//   moveShipToDestination(dock?: Dock) {
//     // console.log(dock.width);
//     let tweenToDock = new TWEEN.Tween(this)
//       .to(
//         dock
//           ? { x: dock.width, y: dock.y + dock.height / 2 - this.height / 2 }
//           : { x: 1000 },
//         2000
//       )
//       .onComplete(() => {
//         // Once the ship reaches the dock, it does its work with the dock and then starts its return journey
//         console.log('moveShipToDock');
//         if (dock) {
//           this.startOperationWithCargo(dock);
//         } else {
//           this.destroy();
//         }
//       })
//       .start();
//   }

//   startOperationWithCargo(dock: Dock) {
//     setTimeout(() => {
//       dock.isEmpty = !dock.isEmpty;
//       dock.targetedBy = null;
//       dock.draw();
//       this.changeCargo();
//       this.moveShipToTheGate({ x: gate.x, y: gate.y }, 'return', dock);
//     }, 2000);
//   }
// }

// function createShip() {
//   let color = Math.random() < 0.5 ? 'green' : 'red';
//   let ship = new Ship(color);
//   ship.x = app.screen.width - ship.width;
//   ship.y = Math.random() * (app.screen.height - ship.height);
//   app.stage.addChild(ship);

//   ship.moveToQueue({ x: gate.x, y: gate.y }, 'forward');

//   // Finding free dock for apropriate ship
//   let suitableDock;

//   if (color === 'green') {
//     suitableDock = docks.find(
//       (dock) => !dock.isEmpty && dock.targetedBy === null
//     );
//   } else {
//     suitableDock = docks.find(
//       (dock) => dock.isEmpty && dock.targetedBy === null
//     );
//   }

//   // If there is - starting moving to it

//   if (suitableDock) {
//     suitableDock.targetedBy = ship;
//     ship.startJourneyToDock(suitableDock);
//   } else {
//     // If no suitable dock is available, wait until one becomes available
//     let dockCheckInterval = setInterval(() => {
//       if (color === 'green') {
//         suitableDock = docks.find(
//           (dock) => !dock.isEmpty && dock.targetedBy === null
//         );
//       } else {
//         suitableDock = docks.find(
//           (dock) => dock.isEmpty && dock.targetedBy === null
//         );
//       }

//       if (suitableDock) {
//         suitableDock.targetedBy = ship;
//         clearInterval(dockCheckInterval);
//         ship.startJourneyToDock(suitableDock);
//       }
//     }, 1000); //  check every second
//   }
// }

// createShip();
// setInterval(createShip, 5000);
// // Update the tweens in the ticker
// app.ticker.add(() => {
//   TWEEN.update();
// });