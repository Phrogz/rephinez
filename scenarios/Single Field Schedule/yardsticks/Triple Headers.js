module.exports = function(season) {
    const tripleHeaderCounts = season.tripleHeaders()
    return {
        score:tripleHeaderCounts.reduce((a,b) => a+b, 0),
        stats:{ "Triple Headers":tripleHeaderCounts.join(',') }
    }
}