/**
 * Toplina kadra. Nema alokacija.
 * 0 hladno, 1 toplo (ukras stane), 2 vruće (isto, dulje).
 * Jedan težak kadar ne pali termiku. Niz od 3 pali, niz od 8 drži vruće.
 */
export class Termika {
  vruce = 0;
  private niz = 0;

  frame(teret: number): number {
    if (teret) {
      if (this.niz < 12) this.niz++;
    } else if (this.niz > 0) {
      this.niz--;
    }
    this.vruce = this.niz >= 8 ? 2 : this.niz >= 3 ? 1 : 0;
    return this.vruce;
  }
}
