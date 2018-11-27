fetch('../out/main.wasm').then(response =>
    response.arrayBuffer()
  ).then(bytes => WebAssembly.instantiate(bytes)).then(results => {
    instance = results.instance;
    document.getElementById("result").textContent = instance.exports.add(5, 5);
  }).catch(console.error);
  
  