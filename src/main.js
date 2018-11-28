function checkEqual(value, expected) {
  if (value !== expected) {
    console.error(`Check equal failed`, value, "!==", expected);
    throw new Error();
  }
}

/**
 * Checks that the thunk throws an error message which contains the expected message.
 * Logs an error if it doesn't
 *
 * @param {*} thunk - A function with no arguments that should trigger an error
 * @param {string} expectedMsg - A substring of the desired error message.
 * @returns
 */
function checkExn(thunk, expectedMsg) {
  try {
    thunk();
  } catch (error) {
    if (!error.message.includes(expectedMsg)) {
      console.error(
        `checkExn: error message ${
          error.message
        } did not contain expected message ${expectedMsg}.`
      );
    }
    return;
  }
  console.error(
    "Check exn did not reutrn an error for",
    thunk,
    "expected",
    errorMsg
  );
}

/**
 * @constant add   {+ lhs rhs}     = lhs + rhs
 * @constant sub   {- lhs rhs}     = lhs - rhs
 * @constant mult  {* lhs rhs}     = lhs * rhs
 * @constant div   {/ lhs rhs}     = lhs / rhs
 * @constant leq   {<= lhs rhs}    = lhs <= rhs
 * @constant is_eq {is_eq lhs rhs} = lhs == rhs
 */
let primop = {};
let baseEnv = {};

fetch("../out/main.wasm")
  .then(response => response.arrayBuffer())
  .then(bytes => WebAssembly.instantiate(bytes))
  .then(results => {
    instance = results.instance;

    primop.add = instance.exports.add;
    primop.sub = instance.exports.sub;
    primop.mult = instance.exports.mult;
    primop.div = instance.exports.div;
    primop.leq = instance.exports.leq;
    primop.is_eq = instance.exports.is_equal;
  })
  .then(() => {
    baseEnv = {
      "+": primop.add,
      "-": primop.sub,
      "*": primop.mult,
      "/": primop.div,
      "<=": primop.leq,
      "equal?": primop.is_eq,
      true: true,
      false: false
    };

    // call top-interp here
    document.getElementById("input").textContent =
      "['+', [['+', [21, 21]], ['+', [21, 21]]]]";
    document.getElementById("result").textContent = topInterp([
      "+",
      [["+", [21, 21]], ["+", [21, 21]]]
    ]);
    runTests();
  })
  .catch(console.error);

/**
 *
 * Definiton of ExprC
 * @typedef {(NumC|IdC|StrC|IfC|FunAppC|FundefC)} ExprC
 *
 * Definiton of ZValue
 * @typedef {number|string|boolean|ZFunc|PrimOp} ZValue
 *
 * Definiton of a PrimOp
 * @typedef {(op1:any, op2:any) => any} PrimOp
 *
 * Definiton of an environment
 * @typedef {Object.<string, ZValue>} Environment
 */

class ZFunc {
  /**
   *Creates an instance of ZFunc.
   * @param {Array<string>} parameters
   * @param {ExprC} body
   * @param {Environment} closure
   * @memberof ZFunc
   */
  constructor(parameters, body, closure) {
    this.parameters = parameters;
    this.body = body;
    this.closure = closure;
  }
}

class NumC {
  /**
   *Creates an instance of NumC.
   * @param {number} num
   * @memberof NumC
   */
  constructor(num) {
    this.num = num;
  }
}

class IdC {
  /**
   *Creates an instance of IdC.
   * @param {string} name
   * @memberof IdC
   */
  constructor(name) {
    this.name = name;
  }
}

class StrC {
  /**
   *Creates an instance of StrC.
   * @param {string} val
   * @memberof StrC
   */
  constructor(val) {
    this.val = val;
  }
}

class IfC {
  /**
   *Creates an instance of IfC.
   * @param {ExprC} cond
   * @param {ExprC} trueVal
   * @param {ExprC} falseVal
   * @memberof IfC
   */
  constructor(cond, trueVal, falseVal) {
    this.cond = cond;
    this.trueVal = trueVal;
    this.falseVal = falseVal;
  }
}

class FunAppC {
  /**
   *Creates an instance of FunAppC.
   * @param {ExprC} fn
   * @param {Array<ExprC>} args
   * @memberof FunAppC
   */
  constructor(fn, args) {
    this.fn = fn;
    this.args = args;
  }
}

class FundefC {
  /**
   *Creates an instance of FundefC.
   * @param {Array<string>} parameters
   * @param {ExprC} body
   * @memberof FundefC
   */
  constructor(parameters, body) {
    this.parameters = parameters;
    this.body = body;
  }
}

/**
 *
 * @param {Environment} env
 * @param {Array<string>} names
 * @param {Array<ZValue>} values
 *
 * @returns Environment
 */
function addToEnv(env, names, values) {
  let clone = { ...env };
  for (let i = 0; i < names.length; i++) {
    clone[names[i]] = values[i];
  }
  return clone;
}

/**
 *
 * @param {Array<Array>} sexp
 */
function topInterp(sexp) {
  return interp(parse(sexp), baseEnv);
}

/**
 * Takes a value and turns it into a string
 * 
 * @param {Value} val - a value from interp
 * @retusns {String}
 */
function serialize(val) {
  if (typeof val === "number") {
    return val.toString();
  } else if (typeof val === "boolean") {
    return val;
  } else if (typeof val === "string") {
    return val;
  } else if (val instanceof ZFunc) {
    return "#<procedure>";
  } else {
    return "#<binop>";
  }
}

/**
 * Interps an exprC
 *
 * @param {ExprC} expr - The expression to intepret
 * @param {Environment} env object
 * @returns {ZValue}
 */
function interp(expr, env) {
  if (expr instanceof NumC) {
    return expr.num;
  }
  if (expr instanceof StrC) {
    return expr.val;
  } else if (expr instanceof IdC) {
    if (env[expr.name] !== undefined) {
      return env[expr.name];
    }
    throw Error(
      `No variable ${expr.name} in enviroment ${JSON.stringify(env)}.`
    );
  } else if (expr instanceof IfC) {
    if (interp(expr.cond, env) === true) {
      return interp(expr.trueVal, env);
    } else {
      return interp(expr.falseVal, env);
    }
  } else if (expr instanceof FundefC) {
    return new ZFunc(expr.parameters, expr.body, env);
  } else if (expr instanceof FunAppC) {
    const argValues = expr.args.map(arg => interp(arg, env));
    const fnValue = interp(expr.fn, env);
    if (fnValue instanceof ZFunc) {
      if (argValues.length !== fnValue.parameters.length) {
        throw Error(
          `Function given wrong number of parameters wanted ${
            fn.parameters.length
          } got ${argValues.length}.`
        );
      }
      let newEnv = addToEnv(expr.closure, fnValue.parameters, argValues);
      return interp(fnValue.body, newEnv);
    } else if (fnValue instanceof Function) {
      if (argValues.length !== 2) {
        throw Error(
          `primop given wrong number of parameters wanted ${2} got ${
            argValues.length
          }.`
        );
      }
      return fnValue(...argValues);
    }
  }
}

function runTests() {
  primopTests();
  basicValueTests();
  idcTests();
  functionExprTests();
  ifCExprTests();
  parseTestCases();
  serializeTestCases();
}

function parseTestCases() {
  checkEqual(JSON.stringify(parse("Hello")), JSON.stringify(new StrC("Hello")));
  checkEqual(JSON.stringify(parse("`x")), JSON.stringify(new IdC("x")));
}

function topInterpTests() {}

function serializeTestCases() {
  checkEqual(serialize(34), "34");
  checkEqual(serialize(true), "true");
  checkEqual(serialize("strings"), "strings");
  checkEqual(serialize(new ZFunc([], new NumC(9),[])), "#<procedure>");
}

function primopTests() {
  checkEqual(primop.add(2, 2), 4);
  checkEqual(primop.mult(2, 2), 4);
  checkEqual(primop.div(2, 2), 1);
  checkEqual(primop.sub(1, 1), 0);
  checkEqual(primop.sub(2, 1), 1);
  checkEqual(primop.sub(10, 6), 4);
  checkEqual(primop.mult(2, 4), 8);
  checkEqual(primop.mult(25, 4), 100);
  checkEqual(primop.div(4, 2), 2);
  checkEqual(primop.div(10, 5), 2);
  checkEqual(primop.is_eq(2, 4), 0);
  checkEqual(primop.is_eq(4, 4), 1);
  checkEqual(primop.leq(2, 4), 1);
  checkEqual(primop.leq(10, 4), 0);
}

function basicValueTests() {
  checkEqual(interp(new NumC(42), {}), 42);
  checkEqual(interp(new StrC("hello"), {}), "hello");
  checkEqual(interp(new IdC("x"), { x: 42 }), 42);
  checkEqual(interp(new StrC("yes")), "yes");
  checkEqual(interp(new StrC("value")), "value");

  checkExn(() => interp(new IdC("y"), { x: 42 }), "variable");
}

function idcTests() {
  let test_env = { one: 1, two: 2, three: 3, four: "forth_value" };

  checkEqual(interp(new IdC("one"), test_env), 1);
  checkEqual(interp(new IdC("four"), test_env), "forth_value");
  checkEqual(interp(new IdC("three"), test_env), 3);
}

function ifCExprTests() {
  checkEqual(
    interp(
      new IfC(new IdC("true"), new StrC("true!"), new StrC("false!")),
      baseEnv
    ),
    "true!"
  );
  checkEqual(
    interp(
      new IfC(new IdC("false"), new StrC("true!"), new StrC("false!")),
      baseEnv
    ),
    "false!"
  );
}

function functionExprTests() {
  checkEqual(
    interp(new FunAppC(new IdC("+"), [new NumC(1), new NumC(1)]), baseEnv),
    2
  );

  checkEqual(
    JSON.stringify(interp(new FundefC([], new NumC(5)), {})),
    JSON.stringify(new ZFunc([], new NumC(5), {}))
  );
  checkEqual(
    JSON.stringify(
      interp(new FundefC(["one", "two", "three"], new StrC("func")), {})
    ),
    JSON.stringify(new ZFunc(["one", "two", "three"], new StrC("func"), {}))
  );

  checkEqual(
    interp(
      new FunAppC(new FundefC(["one", "two", "three"], new StrC("func")), [
        new NumC(1),
        new NumC(2),
        new NumC(3)
      ]),
      baseEnv
    ),
    "func"
  );
}

/**
 * Parses a String of sexp into an ExprC
 *
 * @param {Array | string | number} sexp - The String of expressions to parse
 * @returns {ExprC}
 */
function parse(sexp) {
  if (sexp instanceof Array && typeof sexp[0] === "string") {
    return new FunAppC(parse(sexp[0]), sexp.slice(1).map(exp => parse(exp)));
  } else if (typeof sexp === "number") {
    return new NumC(sexp);
  } else if (typeof sexp === "string") {
    if (sexp.length > 1 && sexp[0] === "`") {
      return new IdC(sexp.substring(1));
    } else {
      return new StrC(sexp);
    }
  } else if (typeof sexp === "object") {
    return sexp.map(exp => parse(exp));
  } else {
    throw Error(`Cant parse ${JSON.stringify(sexp)}`);
  }
}

checkEqual(interp(new NumC(42), {}), 42);
checkEqual(interp(new StrC("hello"), {}), "hello");
checkEqual(interp(new IdC("x"), { x: 42 }), 42);
checkEqual(interp(new StrC("yes")), "yes");
checkEqual(interp(new StrC("value")), "value");

let test_env = { one: 1, two: 2, three: 3, four: "forth_value" };

checkEqual(interp(new IdC("one"), test_env), 1);
checkEqual(interp(new IdC("four"), test_env), "forth_value");
checkEqual(interp(new IdC("three"), test_env), 3);

let trivalExpr = new NumC(42);
checkEqual(interp(trivalExpr), 42);
