export type ProviderConfig = {
  readonly debug?: boolean;
};

export type UploadResult = {
  readonly url: string;
  readonly deleteUrl?: string;
};

export type UploadProvider<TOptions = undefined> = (
  blob: Blob,
  options?: TOptions,
) => Promise<UploadResult>;
