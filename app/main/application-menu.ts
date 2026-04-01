import { BrowserWindow, Menu, type MenuItemConstructorOptions, shell } from 'electron';

export interface InlineWindowMenuItem {
  id: string;
  label: string;
}

export function createApplicationMenu() {
  const template: MenuItemConstructorOptions[] = [];
  const fileSubmenu: MenuItemConstructorOptions[] = process.platform === 'darwin'
    ? [{ role: 'close' }]
    : [{ role: 'quit' }];
  const editSubmenu: MenuItemConstructorOptions[] = [
    { role: 'undo' },
    { role: 'redo' },
    { type: 'separator' },
    { role: 'cut' },
    { role: 'copy' },
    { role: 'paste' },
    ...(process.platform === 'darwin'
      ? [
        { role: 'pasteAndMatchStyle' as const },
        { role: 'delete' as const },
      ]
      : []),
    { role: 'selectAll' },
  ];
  const windowSubmenu: MenuItemConstructorOptions[] = process.platform === 'darwin'
    ? [
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' },
      { role: 'window' },
    ]
    : [
      { role: 'minimize' },
      { role: 'close' },
    ];

  if (process.platform === 'darwin') {
    template.push({ role: 'appMenu' });
  }

  template.push(
    {
      id: 'file',
      label: 'File',
      submenu: fileSubmenu,
    },
    {
      id: 'edit',
      label: 'Edit',
      submenu: editSubmenu,
    },
    {
      id: 'view',
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      id: 'window',
      label: 'Window',
      submenu: windowSubmenu,
    },
    {
      id: 'help',
      role: 'help',
      label: 'Help',
      submenu: [
        {
          id: 'learn-more',
          label: 'Cast Interface Website',
          click: () => {
            void shell.openExternal('https://openai.com');
          },
        },
      ],
    },
  );

  return Menu.buildFromTemplate(template);
}

export function getInlineWindowMenuItems(): InlineWindowMenuItem[] {
  const menu = Menu.getApplicationMenu();
  if (!menu) return [];

  return menu.items
    .filter((item) => item.id && item.label && item.submenu)
    .map((item) => ({ id: item.id, label: item.label }));
}

export function popupInlineWindowMenu(menuId: string, browserWindow: BrowserWindow, x: number, y: number): Promise<void> {
  const menu = Menu.getApplicationMenu();
  const submenu = menu?.items.find((item) => item.id === menuId)?.submenu;
  if (!submenu) return Promise.resolve();

  return new Promise((resolve) => {
    submenu.popup({
      window: browserWindow,
      x: Math.round(x),
      y: Math.round(y),
      callback: () => { resolve(); },
    });
  });
}
