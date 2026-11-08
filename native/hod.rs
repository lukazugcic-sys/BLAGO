fn polinom(t: f64, a: f64, b: f64) -> f64 {
    let c = 3.0 * a;
    let d = 3.0 * (b - a) - c;
    let e = 1.0 - c - d;
    ((e * t + d) * t + c) * t
}

fn nagib(t: f64, a: f64, b: f64) -> f64 {
    let c = 3.0 * a;
    let d = 3.0 * (b - a) - c;
    let e = 1.0 - c - d;
    (3.0 * e * t + 2.0 * d) * t + c
}

fn krivulja(x: f64, x1: f64, y1: f64, x2: f64, y2: f64) -> f64 {
    if x <= 0.0 {
        return 0.0;
    }
    if x >= 1.0 {
        return 1.0;
    }
    let mut t = x;
    for _ in 0..8 {
        let dx = nagib(t, x1, x2);
        if dx.abs() < 1e-6 {
            break;
        }
        let sljedeci = t - (polinom(t, x1, x2) - x) / dx;
        t = sljedeci.clamp(0.0, 1.0);
    }
    polinom(t, y1, y2)
}

fn slijetanje(t: f64, skoro: bool) -> f64 {
    if skoro {
        krivulja(t, 0.18, 1.72, 0.46, 1.0)
    } else {
        krivulja(t, 0.34, 1.36, 0.64, 1.0)
    }
}

fn main() {
    let uzorci = [0.0, 0.15, 0.4, 0.62, 0.78, 0.9, 1.0];
    for skoro in [false, true] {
        for t in uzorci {
            println!("{} {} {:.12}", skoro, t, slijetanje(t, skoro));
        }
    }
}
