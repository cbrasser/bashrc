export function log(name, value, color) {
    var col = color ? color : 'black';
        console.log(`%c${name}: ${value}`,`color: ${col}`)
}
