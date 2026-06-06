/**
 * Parse script text into structured lines.
 * Supports formats:
 *   CHARACTER NAME: dialogue text
 *   CHARACTER NAME
 *   dialogue text (continued)
 */
export function parseScriptText(text) {
  const rawLines = text.split('\n');
  const lines = [];
  let currentCharacter = null;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Match "CHARACTER: dialogue" — character may contain spaces but not colons
    const colonMatch = trimmed.match(/^([A-Z][A-Z\s\.\-']{0,40}):\s*(.+)$/);
    if (colonMatch) {
      currentCharacter = colonMatch[1].trim();
      const dialogue = colonMatch[2].trim();
      if (dialogue) {
        lines.push({ character: currentCharacter, dialogue });
      }
      continue;
    }

    // Line that is all-caps (or mostly) and short → character name header
    const isCharHeader =
      trimmed === trimmed.toUpperCase() &&
      trimmed.length < 40 &&
      /[A-Z]/.test(trimmed) &&
      !/[.!?]$/.test(trimmed);

    if (isCharHeader) {
      currentCharacter = trimmed;
      continue;
    }

    // Plain dialogue line — attach to current character
    if (currentCharacter && trimmed) {
      // Append to previous line if same character and looks like continuation
      const last = lines[lines.length - 1];
      if (last && last.character === currentCharacter) {
        last.dialogue += ' ' + trimmed;
      } else {
        lines.push({ character: currentCharacter, dialogue: trimmed });
      }
    }
  }

  return lines;
}

export function getCharacters(lines) {
  const seen = new Set();
  const chars = [];
  for (const line of lines) {
    if (!seen.has(line.character)) {
      seen.add(line.character);
      chars.push(line.character);
    }
  }
  return chars;
}
