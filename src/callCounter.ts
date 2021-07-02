type ModuleHotReference = NonNullable<NodeModule['hot']>;

interface CallCounterMetadataItem {
  callCounter: number;
}

type CallCounterMetadata = WeakMap<ModuleHotReference, CallCounterMetadataItem>;

const callCounterMetadata: CallCounterMetadata = new WeakMap();

const getOrCreateModulePersistenceMetadata = (
  hot: ModuleHotReference
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

export const resetCallCounter = (hot: ModuleHotReference): void => {
  callCounterMetadata.delete(hot);
};

export const getCallCounter = (hot: ModuleHotReference): number => {
  return getOrCreateModulePersistenceMetadata(hot).callCounter++;
};
