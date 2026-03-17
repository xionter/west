import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card {
    constructor(name, power, image) {
        super(name, power, image);
    }

    getDescriptions() {
        const creatureDesc = getCreatureDescription(this);
        const cardDescriptions = super.getDescriptions();
        return [creatureDesc, ...cardDescriptions];
    }
}

function isDuck(card) {
    return card && card.quacks && card.swims;
}

function isDog(card) {
    return card instanceof Dog;
}

function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card))
        return 'Утка-Собака';
    if (isDuck(card))
        return 'Утка';
    if (isDog(card))
        return 'Собака';
    return 'Существо';
}


class Duck extends Creature {
    constructor(image) {
        super('Мирная утка', 2, image);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

class Dog extends Creature {
    constructor(image) {
        super('Пес-бандит', 3, image);
    }
}


class Trasher extends Dog {
    constructor() {
        super();
        this.name = "Громила";
        this.power = 5;
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const reduced = Math.max(0, value - 1);

        this.view.signalAbility(() => {
            continuation(reduced);
        });
    }
}


class Gatling extends Creature {
    constructor() {
        super("Гатлинг", 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const { oppositePlayer } = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));
        taskQueue.push(onDone => {
            const cards = oppositePlayer.table;
            let i = 0;

            const next = () => {
                while (i < cards.length && !cards[i]) {
                    i++;
                }

                if (i >= cards.length) {
                    onDone(); // ВАЖНО: один раз
                    return;
                }

                const card = cards[i++];

                this.dealDamageToCreature(1, card, gameContext, next);
            };

            next();
        });

        taskQueue.continueWith(continuation);
    }
}



const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];

const banditStartDeck = [
    new Gatling(),
];

const game = new Game(seriffStartDeck, banditStartDeck);

SpeedRate.set(1);

game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});

let dog = new Dog();
let duck = new Duck();

