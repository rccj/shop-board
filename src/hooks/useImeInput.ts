import { useState } from 'react'

/**
 * Handles IME composition for Chinese/Japanese/Korean input.
 * Separates display value (inputValue) from committed search value,
 * so onChange always updates the input visually, but onCommit only
 * fires after composition ends (i.e. after character selection).
 */
export function useImeInput(onCommit: (value: string) => void, initialValue = '') {
  const [inputValue, setInputValue] = useState(initialValue)

  return {
    value: inputValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
      if (!(e.nativeEvent as InputEvent).isComposing) onCommit(e.target.value)
    },
    onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => {
      onCommit((e.target as HTMLInputElement).value)
    },
    reset: () => setInputValue(''),
    setValue: setInputValue,
  }
}
