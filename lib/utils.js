module.exports = {
    abbreviate(n, decimals=0) {
        return (n>1e9) ? `${(n/1e9).toFixed(decimals)}G` : (n>1e6) ? `${(n/1e6).toFixed(decimals)}M` : (n>1e3) ? `${(n/1e3).toFixed(decimals)}k` : n.toFixed(decimals)
    }
}