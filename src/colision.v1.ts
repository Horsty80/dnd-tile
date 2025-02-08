
// ...existing code...
export function updatePositionToTheRight(entries: string[], newValue: string, oldValue: string): string[] {
    const arr = [...entries];
    const oldIndex = arr.indexOf(oldValue);
    if (oldIndex === -1) return arr;
  
    // Trouver la longueur du bloc contigu de oldValue
    let blockLength = 1;
    for (let i = oldIndex + 1; i < arr.length && arr[i] === oldValue; i++) {
      blockLength++;
    }
  
    // Remplace la première occurrence par "0"
    arr[oldIndex] = "0";
    // Retirer les autres occurrences immédiates du bloc
    arr.splice(oldIndex + 1, blockLength - 1);
  
    // Trouver la position de newValue
    const newIndex = arr.indexOf(newValue);
    if (newIndex === -1) return arr;
  
    // Réinsérer le bloc (blockLength) de oldValue
    const block = new Array(blockLength).fill(oldValue);
    arr.splice(newIndex, 0, ...block);
    return arr;
  }

export function expandEntryToTheRight(
  entries: string[],
  value: string,
  size: number
): string[] {
  const arr = [...entries];
  const index = arr.indexOf(value);
  for (let i = 0; i < size; i++) {
    arr.splice(index + 1, 0, value);
  }
  return arr;
}