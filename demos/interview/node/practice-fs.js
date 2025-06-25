const fs = require('fs')
const path = require('path')

// fs.readFile(path.join(__dirname, '1.text'), 'utf8', (err, data) => {
//     if (err) {
//         console.error(err)
//         return
//     }
//     console.log(data)
// })

// fs.readFileSync(path.join(__dirname, '1.txt'), 'utf8', (err, data) => {
//     if (err) {
//         console.error(err)
//         return
//     }
//     console.log(data)
// })

// fs.appendFile(path.join(__dirname, '1.text'), '\nHello World!', (err, data) => {
//     if (err) {
//         console.error(err)
//         return
//     }
//     //   console.log('File updated successfully!')
//     console.log(data)
// })

// fs.copyFile(path.join(__dirname, '1.text'), path.join(__dirname, '2.text'), (err) => {
//     if (err) {
//         console.error(err)
//         return
//     }
//     console.log('File copied successfully!')
// })

// fs.mkdir(path.join(__dirname, 'newDir'), { recursive: true }, (err) => {
//     if (err) {
//         console.error(err)
//         return
//     }
//     console.log('Directory created successfully!')
// })

// fs.readdir(path.join(__dirname, 'newDir'), (err, files) => {
//     if (err) {
//         console.error(err)
//         return
//     }
//     files.forEach(file => {
//         console.log(file)
//     })
//     // console.log(files)
// })  
