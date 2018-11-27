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
      f32.div)
   
   (func $is_equal (param $lhs i32) (param $rhs i32) (result i32)
      get_local $lhs 
      get_local $rhs
      i32.eq)
  
   (func $leq (param $lhs i32) (param $rhs i32) (result i32)
      get_local $lhs 
      get_local $rhs
      i32.le_s)
  

  (export "add" (func $add))
  (export "sub" (func $sub))
  (export "mult" (func $mult))
  (export "div" (func $div))
  (export "leq" (func $leq))
  (export "is_equal" (func $is_equal))
)
