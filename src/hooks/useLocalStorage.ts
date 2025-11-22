import { useState, useCallback, useEffect } from 'react';

// Aangepaste hook voor het synchroniseren van state met localStorage.
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  
  // Initialiseer de state door eerst te proberen de waarde uit localStorage te lezen.
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // EFFECT TOEGEVOEGD: Dit effect laadt de waarde opnieuw vanuit localStorage
  // wanneer de 'key' verandert. Dit is cruciaal voor scenario's waarin een 
  // gebruiker uitlogt en een andere inlogt, zodat altijd de juiste data wordt getoond.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValue);
      } catch (error) {
        console.error(`Error reading localStorage key “${key}”:`, error);
        setStoredValue(initialValue);
      }
    }
  }, [key]);


  // Creëer een 'setter' functie die de state bijwerkt en de nieuwe waarde naar localStorage schrijft.
  // useCallback zorgt ervoor dat deze functie niet onnodig opnieuw wordt aangemaakt.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Gebruik de functionele update-vorm van useState's setter.
      // Dit garandeert dat we altijd met de meest recente state werken.
      setStoredValue(currentStoredValue => {
        const valueToStore = value instanceof Function ? value(currentStoredValue) : value;
        
        // Sla de nieuwe waarde op in localStorage.
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error writing to localStorage key “${key}”:`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;