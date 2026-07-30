// Minimal stand-in so tools/check-data.ts can import modules that touch the
// Obsidian runtime. Only the surface the pure logic actually reaches is here —
// anything else should stay out of the tested modules.

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
}

export class TFile {}
export class TFolder {}
export class Component {}
export class Notice {}
export class Modal {}
export class Setting {}
export class PluginSettingTab {}
export class Plugin {}
export const Platform = { isMobile: false };

/** No-op: the icon *mapping* is what gets tested, not the DOM injection. */
export function setIcon(_el: unknown, _name: string): void {}
