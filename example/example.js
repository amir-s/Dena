const Dena = require('../dist');

let simulatedDownload = function (delay) {
  return new Promise((acc, rej) => setTimeout(acc, delay))
}

let tokens = ['1_1a2b3c', '2_4d5e6f', '3_7g8h9i'];

let download = async function (token, path, delay) {
  console.log(`[ ] Started downloading ${path}?token=${token}`);
  
  await simulatedDownload(delay);

  console.log(`[x] Finished downloading ${path}?token=${token}`);
}

let denaDownload = Dena(tokens, download);


let run = async () => {
  denaDownload('/one', 1000);
  denaDownload('/two', 500);
  denaDownload('/three', 2000);
  denaDownload('/four', 500);
  denaDownload('/five', 100);
  // you can also await on denaDownload
}

run();
