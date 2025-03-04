const msg = (i) => `This is the test message. 0123456789. Color code ${i}`
for (let i = 0; i < 10; i++) console.log(`\x1b[${i}m${msg(i)}\x1b[0m`)
for (let i = 30; i < 50; i++) console.log(`\x1b[${i}m${msg(i)}\x1b[0m`)
for (let i = 90; i < 110; i++) console.log(`\x1b[${i}m${msg(i)}\x1b[0m`)

