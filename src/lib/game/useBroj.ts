import { useEffect, useRef, useState } from "react";

/** Broj na čipu prati stanje odmah. Let ne smije ostaviti stari prikaz. */
export function useBroj(value: number, kljuc: string) {
  const [prikaz, setPrikaz] = useState(value);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    setPrikaz(valueRef.current);
  }, [value, kljuc]);

  return prikaz;
}
