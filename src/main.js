primop = {}

fetch('../out/main.wasm').then(response =>
      response.arrayBuffer()
  ).then(bytes => WebAssembly.instantiate(bytes)).then(results => {
      instance = results.instance;

      primop.add = instance.exports.add;
      primop.sub = instance.exports.sub;
      primop.mult = instance.exports.mult;
      primop.div = instance.exports.div;
  }).catch(console.error);
  
  