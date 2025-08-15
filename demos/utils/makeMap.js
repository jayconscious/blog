/**
 * Make a map and return a function for checking if a key is in that map.
 * 产生一个映射并生成一个函数用来检测一个key是否在其中
 * 
 */
function makeMap (str, expectsLowerCase) {
    const map = Object.create(null)
    const strArr = str.split(',')
    strArr.forEach(str => {
        map[str] = true
    })
    return function (val) {
        return expectsLowerCase ? map[val.toLowerCase()] : map[val]
    }
}

console.log('111')


