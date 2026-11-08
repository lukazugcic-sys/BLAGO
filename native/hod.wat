(module
  (func $polinom (param $t f64) (param $a f64) (param $b f64) (result f64)
    (local $c f64)
    (local $d f64)
    (local $e f64)
    (local.set $c (f64.mul (f64.const 3) (local.get $a)))
    (local.set $d
      (f64.sub
        (f64.mul (f64.const 3) (f64.sub (local.get $b) (local.get $a)))
        (local.get $c)))
    (local.set $e (f64.sub (f64.sub (f64.const 1) (local.get $c)) (local.get $d)))
    (f64.mul
      (f64.add
        (f64.mul
          (f64.add (f64.mul (local.get $e) (local.get $t)) (local.get $d))
          (local.get $t))
        (local.get $c))
      (local.get $t)))

  (func $nagib (param $t f64) (param $a f64) (param $b f64) (result f64)
    (local $c f64)
    (local $d f64)
    (local $e f64)
    (local.set $c (f64.mul (f64.const 3) (local.get $a)))
    (local.set $d
      (f64.sub
        (f64.mul (f64.const 3) (f64.sub (local.get $b) (local.get $a)))
        (local.get $c)))
    (local.set $e (f64.sub (f64.sub (f64.const 1) (local.get $c)) (local.get $d)))
    (f64.add
      (f64.mul
        (f64.add (f64.mul (f64.const 3) (f64.mul (local.get $e) (local.get $t))) (f64.mul (f64.const 2) (local.get $d)))
        (local.get $t))
      (local.get $c)))

  (func $krivulja (param $x f64) (param $x1 f64) (param $y1 f64) (param $x2 f64) (param $y2 f64) (result f64)
    (local $t f64)
    (local $i i32)
    (local $dx f64)
    (local $slj f64)
    (if (f64.le (local.get $x) (f64.const 0))
      (then (return (f64.const 0))))
    (if (f64.ge (local.get $x) (f64.const 1))
      (then (return (f64.const 1))))
    (local.set $t (local.get $x))
    (local.set $i (i32.const 0))
    (loop $korak
      (local.set $dx (call $nagib (local.get $t) (local.get $x1) (local.get $x2)))
      (if (f64.ge (f64.abs (local.get $dx)) (f64.const 1e-6))
        (then
          (local.set $slj
            (f64.sub
              (local.get $t)
              (f64.div
                (f64.sub (call $polinom (local.get $t) (local.get $x1) (local.get $x2)) (local.get $x))
                (local.get $dx))))
          (if (f64.lt (local.get $slj) (f64.const 0))
            (then (local.set $t (f64.const 0)))
            (else
              (if (f64.gt (local.get $slj) (f64.const 1))
                (then (local.set $t (f64.const 1)))
                (else (local.set $t (local.get $slj))))))))
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br_if $korak (i32.lt_s (local.get $i) (i32.const 8))))
    (call $polinom (local.get $t) (local.get $y1) (local.get $y2)))

  (func (export "slijetanje") (param $t f64) (param $skoro i32) (result f64)
    (if (result f64) (i32.ne (local.get $skoro) (i32.const 0))
      (then (call $krivulja (local.get $t) (f64.const 0.18) (f64.const 1.72) (f64.const 0.46) (f64.const 1)))
      (else (call $krivulja (local.get $t) (f64.const 0.34) (f64.const 1.36) (f64.const 0.64) (f64.const 1))))))
