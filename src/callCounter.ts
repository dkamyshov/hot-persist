import type { HotApi } from './interface';

interface CallCounterMetadataItem {
  callCounter: number;
}

const callCounterMetadata = new WeakMap<HotApi, CallCounterMetadataItem>();

const getOrCreateModulePersistenceMetadata = (
  hot: HotApi,
): CallCounterMetadataItem => {
  const item = callCounterMetadata.get(hot);

  if (typeof item === 'undefined') {
    const newItem: CallCounterMetadataItem = {
      callCounter: 0,
    };

    callCounterMetadata.set(hot, newItem);

    return newItem;
  }

  return item;
};

export const resetCallCounter = (hot: HotApi): void => {
  callCounterMetadata.delete(hot);
};

export const getCallCounter = (hot: HotApi): number => {
  return getOrCreateModulePersistenceMetadata(hot).callCounter++;
};
