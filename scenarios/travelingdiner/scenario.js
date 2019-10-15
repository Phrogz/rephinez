Route = require('./route')

const restaurants = [
	{kind:"meat", x:27.4,  y:26.2},
	{kind:"veg",  x:71.8,  y:59.2},
	{kind:"veg",  x:6.5,   y:76.5},
	{kind:"meat", x:47.8,  y:94.5},
	{kind:"meat", x:252,   y:6.5},
	{kind:"meat", x:214.9, y:34},
	{kind:"veg",  x:302.3, y:47.2},
	{kind:"veg",  x:260.4, y:70.6},
	{kind:"veg",  x:125.1, y:149},
	{kind:"meat", x:100.5, y:186.1},
	{kind:"meat", x:264,   y:168.8},
	{kind:"veg",  x:137,   y:208.9},
	{kind:"meat", x:153.8, y:174.2},
	{kind:"meat", x:252,   y:150.8},
]

module.exports = {
    name: 'Traveling Diner',

    initial: () => new Route(restaurants),
    vary:    Route.prototype.vary,
    clone:   Route.prototype.duplicate,
    save:    Route.prototype.serialize,
    html:    Route.prototype.html,

    tempStart:              5e2,
    tempFalloffVariations:  1e2,

    checkinAfterVariations: 3e5,
    restartAfterVariations: 1e2,
    stopAfterVariations:    1e7,

    yardsticks: {
        distance:    { weight:2, scale:0.01 },
        alternating: { weight:1e9, scale:2    }
    }
}
