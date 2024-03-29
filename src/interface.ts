/* eslint-disable @typescript-eslint/no-explicit-any */

export interface HotApi {
  readonly data?: any;
  dispose: (callback: (data: any) => void) => void;
}

export interface ModuleLike {
  hot?: HotApi | null;
  webpackHot?: HotApi | null;
}

export type HotApiProvider =
  | HotApi
  | (() => HotApi | null | undefined)
  | ModuleLike
  | null
  | undefined;
