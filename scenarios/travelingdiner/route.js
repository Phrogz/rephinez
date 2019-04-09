
class Route {
    constructor(restaurants) {
        this.route = shuffle(restaurants.slice())
    }
    vary() {
        swapRandom(this.route)
        return this
    }
    eachLeg(ƒ) {
        for (let i=0; i<this.route.length-1; ++i) ƒ(this.route[i], this.route[i+1]);
    }
    duplicate() {
        return new Route(this.route.slice())
    }
    length() {
        let sum=0
        this.eachLeg((a,b) => sum+=Math.hypot(b.x-a.x, b.y-a.y))
        return sum
    }
    serialize() {
        return { content:JSON.stringify(this.route), type:'json' }
    }
}

function shuffle(array) {
    for (let i=array.length;i--;) {
        const j=(Math.random()*(i+1))<<0;
        [array[i], array[j]]=[array[j], array[i]]
    }
    return array
}

function swapRandom(array) {
    const a = (Math.random()*array.length)<<0;
    let b;
    do{ b=(Math.random()*array.length)<<0 } while (b===a);
    [array[a], array[b]] = [array[b], array[a]]
}

module.exports = Route