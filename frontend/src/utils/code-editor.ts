export const colorFromClientId = (clientId: number) => {
  const hue = (clientId * 137.508) % 360; // golden angle
  return {
    cursor: `hsl(${hue}, 80%, 45%)`,
  };
};

const injectedUserStyles = new Set<number>();

export const injectCursorStyles = (clientId: number, cursorColor: string) => {
  if (injectedUserStyles.has(clientId)) return;

  injectedUserStyles.add(clientId);

  const style = document.createElement('style');
  style.dataset.clientId = String(clientId);

  style.textContent = `
    .remote-cursor-${clientId} {
      border-left: 2px solid ${cursorColor};
      margin-left: -1px;
    }
  `;

  document.head.appendChild(style);
};
