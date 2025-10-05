// Utility functions for parsing and checking element types

export function parseElementType(elementType: string): { type: string; id: string } | null {
  if (!elementType || typeof elementType !== 'string') return null;
  
  const parts = elementType.split('-');
  if (parts.length < 2) return null;
  
  const type = parts[0];
  const id = parts.slice(1).join('-'); // Rejoin in case ID contains dashes
  
  return { type, id };
}

export function isTextElement(elementType: string): boolean {
  return elementType?.startsWith('heading-') || elementType?.startsWith('subheading-');
}

export function isMockupElement(elementType: string): boolean {
  return elementType?.startsWith('mockup-');
}

export function isVisualElement(elementType: string): boolean {
  return elementType?.startsWith('visual-');
}

export function isHeading(elementType: string): boolean {
  return elementType?.startsWith('heading-');
}

export function isSubheading(elementType: string): boolean {
  return elementType?.startsWith('subheading-');
}
