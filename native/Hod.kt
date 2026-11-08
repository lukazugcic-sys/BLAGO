// Isti ispit kao C++ slijetanje. Isti ulaz mora dati isti pomak.
// Pokreni: kotlinc Hod.kt -include-runtime -d hod.jar && java -jar hod.jar

import kotlin.math.abs

fun polinom(t: Double, a: Double, b: Double): Double {
    val c = 3.0 * a
    val d = 3.0 * (b - a) - c
    val e = 1.0 - c - d
    return ((e * t + d) * t + c) * t
}

fun nagib(t: Double, a: Double, b: Double): Double {
    val c = 3.0 * a
    val d = 3.0 * (b - a) - c
    val e = 1.0 - c - d
    return (3.0 * e * t + 2.0 * d) * t + c
}

fun krivulja(x: Double, x1: Double, y1: Double, x2: Double, y2: Double): Double {
    if (x <= 0.0) return 0.0
    if (x >= 1.0) return 1.0
    var t = x
    for (i in 0 until 8) {
        val dx = nagib(t, x1, x2)
        if (abs(dx) < 1e-6) break
        val sljedeci = t - (polinom(t, x1, x2) - x) / dx
        t = sljedeci.coerceIn(0.0, 1.0)
    }
    return polinom(t, y1, y2)
}

fun slijetanje(t: Double, skoro: Boolean): Double {
    return if (skoro) krivulja(t, 0.18, 1.72, 0.46, 1.0)
    else krivulja(t, 0.34, 1.36, 0.64, 1.0)
}

fun main() {
    val uzorci = doubleArrayOf(0.0, 0.15, 0.4, 0.62, 0.78, 0.9, 1.0)
    for (skoro in listOf(false, true)) {
        for (t in uzorci) {
            println("$skoro $t ${slijetanje(t, skoro)}")
        }
    }
}
