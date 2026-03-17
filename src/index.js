import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';


class Creature extends Card {
    constructor(name, power, image) {
        super();
        this.name = name;
        this.power = power;
        this.image = image;
    }

    getDescriptions() {
        const creatureDesc = getCreatureDescription();
        const cardDescriptions = super.getDescriptions();
        return [creatureDesc, ...cardDescriptions];
    }
}
// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

console.log(getCreatureDescription)

// Основа для утки.
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


// Основа для собаки.
class Dog extends Creature {
    constructor(image) {
        super('Пес-бандит', 3, image);
    }
}

class Trasher extends Dog {
    constructor() {
        super();
        this.power = 5;
        this.name = "Громила";
    }
    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const reduced = Math.max(0, value - 1);
        this.view.signalAbility(() => { continuation(reduced) });  
    }
}

class Gatling extends Creature {
    constructor() {
        super();
        this.power = 6;
        this.name = "Гатлинг";
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        taskQueue.push(onDone => this.view.showAttack(onDone));
        taskQueue.push(onDone => {
            const cards = oppositePlayer.table;
            let i = 0;

            const next = () => {
                while(i < cards.length && !cards[i]) {
                    i++;
                }

                if(i >= cards.length) {
                    onDone();
                    return;
                }

                const card = cards[i++];
                this.dealDamageToCreature(this.currentPower, card, gameContext, next);
            };
            
            next();
        });

        taskQueue.continueWith(continuation);
    }
}

const seriffStartDeck = [
    new Dog(),
    new Dog(),
    new Dog(),
];
const banditStartDeck = [
    new Dog(),
];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});



