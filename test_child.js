if (process.send) {
    console.log('child')
    process.on('message', message => {
        console.log('parent said', message)
        if (message=='die') process.disconnect();
    })
} else {
    console.log('standalone')
}
