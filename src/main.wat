(module
   (func $add (param $lhs i32) (param $rhs i32) (result i32)
      get_local $lhs
      get_local $rhs
      i32.add)
   
   (func $sub (param $lhs i32) (param $rhs i32) (result i32)
      get_local $lhs
      get_local $rhs
      i32.sub)

   (func $mult (param $lhs i32) (param $rhs i32) (result i32)
      get_local $lhs
      get_local $rhs
      i32.mul)

   (func $div (param $lhs f32) (param $rhs f32) (result f32)
      get_local $lhs
      get_local $rhs
      f32.div))

  (export "add" (func $add))
  (export "sub" (func $sub))
  (export "mul" (func $mul))
  (export "div" (func $div))
)