export const colorFromClientId = (clientId: number) => {
  const hue = (clientId * 137.508) % 360; // golden angle
  return {
    cursor: `hsl(${hue}, 80%, 45%)`,
  };
};

export function injectCursorStyles(
  clientId: number,
  color: string,
  userName: string,
) {
  const styleId = `cursor-style-${clientId}`;
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.dataset.clientId = String(clientId);

  style.textContent = `
    .remote-cursor-${clientId} {
      position: relative;
      border-left: 2px solid ${color};
    }

    .remote-cursor-${clientId}::before {
      content: '';
      position: absolute;
      top: -6px;
      left: -6px;
      width: 8px;
      height: 8px;
      background: ${color};
      border-radius: 50%;
      z-index: 2;
    }

    .remote-cursor-${clientId}::after {
      content: "${userName}";
      position: absolute;
      top: -20px;
      left: -2px;
      padding: 2px 6px;
      font-size: 10px;
      line-height: 1.4;
      border-radius: 4px;
      background: ${color};
      color: #fff;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0.85;
      z-index: 2;
    }
  `;

  document.head.appendChild(style);
}
