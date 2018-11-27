function checkEqual(value, expected) {
  if (value !== expected) {
    console.error(`Check equal failed ${value} !== ${expected}`);
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
      "true": true,
      "false": false
    };

    // call top-interp here
    document.getElementById("result").textContent = top_interp(['+', [21, 21]]);
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

function isFunction(functionToCheck) {
  return (
    functionToCheck && {}.toString.call(functionToCheck) === "[object Function]"
  );
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
function top_interp(sexp) {
  interp(parse(sexp), baseEnv);
}

/**
 * Interps an exprC
 *
 * @param {ExprC} expr - The expression to intepret
 * @param {Environment} environment object
 * @returns {ZValue}
 */
function interp(expr, env) {
  if (expr instanceof NumC) {
    return expr.num;
  }
  if (expr instanceof StrC) {
    return expr.val;
  } else if (expr instanceof IdC) {
    if (env[expr.name]) {
      return env[expr.name];
    }
    throw Error(`No variable ${expr.name} in enviroment ${env}`);
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
      let newEnv = addToEnv(expr.closure, expr.parameters, argValues);
      return interp(expr.body, newEnv);
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

function functionExprTests() {
  checkEqual(
    interp(new FunAppC(new IdC("+"), [new NumC(1), new NumC(1)]), baseEnv),
    2
  );
}


/**
 * Parses a String of sexp into an ExprC
 * 
 * @param {Array} sexp - The String of expressions to parse
 * @returns {ExprC} 
 */
function parse(sexp) {
  if (typeof sexp[0] === "string") {
    return new FunAppC(new IdC(sexp[0]), parse(sexp.slice(1)[0]));
  } else if (typeof sexp === "number") {
    return new NumC(sexp);
  } else if (typeof sexp === "object") {
    return sexp.map(exp => parse(exp));
  } else {
    console.log(`no idea, ${sexp}`)
    return null;
  }
}

checkEqual(interp(new NumC(42), {}), 42);
checkEqual(interp(new StrC("hello"), {}), "hello");
checkEqual(interp(new IdC("x"), {x: 42}), 42);
checkEqual(interp(new StrC("yes")), "yes");
checkEqual(interp(new StrC("value")), "value");

let test_env = {one : 1, two : 2, three : 3, four : "forth_value"};

checkEqual(interp (new IdC("one"), test_env), 1);
checkEqual(interp (new IdC("four"), test_env), "forth_value");
checkEqual(interp (new IdC("three"), test_env), 3);


let trivalExpr = new NumC(42);
checkEqual(interp(trivalExpr), 42);
