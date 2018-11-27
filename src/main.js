function checkEqual(value, expected) {
  if (value !== expected) {
    console.error(`Check equal failed ${value} !== ${expected}`);
  }
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
    document.getElementById("result").textContent = primop.mult(20, 4);
    checkEqual(instance.exports.add(2, 2), 4);
  }).catch(console.error);

/**
 *
 * Definiton of ExprC
 * @typedef {(NumC|IdC|StrC|IfC|FunAppC|FundefC)} ExprC
 *
 * Definiton of ZValue
 * @typedef {number|string|boolean|ZFunc} ZValue
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
 * Interps an experC
 *
 * @param {ExprC} expr - The expression to intepret
 * @param {object} environment object
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
    return {};
  } else if (expr instanceof FunAppC) {
    throw Error("Not implemented");
  }
}

/*[(NumC n) n]
    [(StrC s) s]
    [(IdC var) (hash-ref env var
                         (λ () (error 'ZIBR "No value found for variable '~v'" var)))]
    [(IfC cond true-val false-val)
     (let ([cond-res (interp cond env)])
       (if (boolean? cond-res)
           (if cond-res (interp true-val env) (interp false-val env))
           (error 'ZIBR " condition of if statment evaluated to ~v which is not a boolean" cond)))]
    [(FundefC params body) (ZFunc params body env)]
    [(FuncAppC func args)
     (let ([arg-vals (map (λ ([arg : ExprC]) (interp arg env)) args)]
           [fn-value (interp func env)])
       (match fn-value
         [[ZPrimOp _] (apply-primop fn-value arg-vals)]
         [[ZFunc params body closure] (if (= (length params) (length args))
                     (let ([new-env (add-to-env closure params arg-vals)])
                       (interp body new-env))
                     (error 'ZIBR "Wrong number of arguments passed to function"))]
         [other (error 'ZIBR "Could not apply ~v which evaluates to ~v its not a function" func fn-value)]))]))
         */


/**
 * Parses a String of sexp into an ExprC
 * 
 * @param {String} sexp - The String of expressions to parse
 * @returns {ExprC} 
 */
function parse(sexp) {

}

let trivalExpr = new NumC(42);
checkEqual(interp(trivalExpr), 42);
