export type MountStyle = 0 | 1 | 2 | 3;
export type MountView = "exploded" | "installed" | "print";

export interface MountSettings {
  style: MountStyle;
  base: number;
  slide: number;
  width: number;
  height: number;
  depth: number;
  fit: number;
  lip: number;
  origin: [number, number, number];
  offset: [number, number];
}

export interface MountModels {
  base: ArrayBuffer;
  cover: ArrayBuffer;
  style: MountStyle;
  size: number;
  frontBottom: number;
  frontPlane: number;
  lift: number;
}

export interface MountRequest {
  settings: MountSettings;
  imported?: ArrayBuffer;
}

export type MountResponse = { models: MountModels } | { error: string };

export const mountFiles = "/staple-mount/files/";
