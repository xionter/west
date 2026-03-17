import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card {
    constructor(name, power, image) {
        super(name, power, image);
        this._currentPower = this.maxPower;
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
    constructor(image='duck.png') {
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

class Lad extends Dog {
    constructor() {
        super();
        this.name = "Браток";
        this.maxPower = 2;
        this.currentPower = 2;
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const n = this.getInGameCount();
        return (n * (n + 1)) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        const bonus = Lad.getBonus();

        this.view.signalAbility(() => {
            continuation(value + bonus);
        });
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const bonus = Lad.getBonus();

        this.view.signalAbility(() => {
            continuation(Math.max(0, value - bonus));
        });
    }

    getDescriptions() {
        const desc = [...super.getDescriptions()];

        if (
            Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') ||
            Lad.prototype.hasOwnProperty('modifyTakenDamage')
        ) {
            desc.push("Чем их больше, тем они сильнее");
        }

        return desc;
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
    getDescriptions() {
        return [...super.getDescriptions(), "Получает на 1 меньше урона"];
    }
}

class Rogue extends Creature {
    constructor() {
        super("Изгой", 2);
    }
    stealAbilities(target, gameContext) {
        if (target instanceof Rogue) return;

        const proto = Object.getPrototypeOf(target);

        const abilityNames = [
            'modifyDealedDamageToCreature',
            'modifyDealedDamageToPlayer',
            'modifyTakenDamage'
        ];

        abilityNames.forEach(name => {
            if (proto.hasOwnProperty(name)) {
                this[name] = proto[name].bind(this);
                delete proto[name];
            }
        });

        gameContext.updateView();
    }

    attack(gameContext, continuation) {
        const { oppositePlayer } = gameContext;
        const target = oppositePlayer.table.find(c => c);

        if (target) {
            this.stealAbilities(target, gameContext);
        }

        super.attack(gameContext, continuation);
    }
}


class Brewer extends Duck {
    constructor() {
        super();
        this.name = "Пивовар";
        this.maxPower = 2;
        this.currentPower = 2;
        this.image = "brewer.png";
    }

    buff(card) {
        card.maxPower += 1;
        card.currentPower += 2;

        card.view.signalHeal(() => {
            card.updateView();
        });
    }

    attack(gameContext, continuation) {
        const { currentPlayer, oppositePlayer } = gameContext;

        const allCards = currentPlayer.table.concat(oppositePlayer.table);

        allCards.forEach(card => {
            if (card && isDuck(card)) {
                this.buff(card);
            }
        });

        super.attack(gameContext, continuation);
    }

    getDescriptions() {
        return [ ...super.getDescriptions(), "Баффает уток (+1 max, +2 current)"];
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
                    onDone();
                    return;
                }
                const card = cards[i++];
                this.dealDamageToCreature(2, card, gameContext, next);
            };

            next();
        });

        taskQueue.continueWith(continuation);
    }
}



const seriffStartDeck = [
    new Brewer(),
    new Trasher(),
    new Duck(),
    new Duck(),
    new Duck(),
    new Duck(),
    new Duck()
];
const banditStartDeck = [
    new Lad(),
    new Dog(),
    new Rogue(),
    new Duck(),
    new Duck(),
    new Duck(),
    new Duck()
];

const game = new Game(seriffStartDeck, banditStartDeck);

SpeedRate.set(1);

game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
