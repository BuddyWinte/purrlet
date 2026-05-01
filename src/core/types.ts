import type { Tool } from "../tools";

export type UploadContext = {
  canvas: HTMLCanvasElement;
};

export type SaveStrategy = "commands" | "blob" | "data-url";

export type PurrletConfig = {
  canvas: HTMLCanvasElement;
  debug?: boolean;
  tool?: string;
  color?: string;
  size?: number;
  opacity?: number;
  tools?: Tool[];
  save?: {
    enabled?: boolean;
    key?: string;
    strategy?: SaveStrategy;
    maxCommands?: number;
  },
  upload?: {
    provider?: "imgbb" | "imgur";
    handler?: (data: Blob, ctx: UploadContext) => Promise<string>;
    apiKey?: string;
    clientId?: string;
    beforeUpload?: (data: Blob) => Promise<Blob> | Blob;
    onUploadSuccess?: (url: string) => void;
    onUploadError?: (err: any) => void;
  }
};
