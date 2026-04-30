export type UploadContext = {
  canvas: HTMLCanvasElement;
};

export type PurrletConfig = {
  canvas: HTMLCanvasElement;
  debug?: boolean;
  tool?: string;
  color?: string;
  size?: number;
  opacity?: number;
  save?: {
    enabled?: boolean;
    key?: string;
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