const {stddev} = require('../utils')
module.exports = function(season) {
    const counts = season.doubleHeaders()
    return {
        score:counts.reduce((a,b) => a+b, 0) + stddev(counts),
        stats:{ "Double Headers":counts.join(',') }
    }
}