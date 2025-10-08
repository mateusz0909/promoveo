export type DevicePresetId = 'iphone-15-pro' | 'ipad-pro-13';

export interface DevicePreset {
  id: DevicePresetId;
  label: string;
  aliases: string[];
  type: 'iphone' | 'ipad';
  canvasWidth: number;
  canvasHeight: number;
  frameAsset: string;
  fontScaleMultiplier: number;
  defaultTextWidth: number;
  headingPosition: { x: number; y: number };
  subheadingPosition: { x: number; y: number };
  mockup: {
    baseWidth: number;
    baseHeight: number;
    defaultScale: number;
    offset: { x: number; y: number };
    innerPadding: number;
    cornerRadius: number;
  };
  legacyDeviceLabel: 'iPhone' | 'iPad';
}

interface DeviceDefinition {
  id: DevicePresetId;
  label: string;
  type: 'iphone' | 'ipad';
  width: number;
  height: number;
  frameAsset: string;
  aliases: string[];
  legacyDeviceLabel: 'iPhone' | 'iPad';
}

interface DeviceOverrides {
  mockup?: {
    defaultScale?: number;
    innerPaddingMultiplier?: number;
    cornerRadiusMultiplier?: number;
    offset?: { x: number; y: number };
  };
}

const BASE_TEMPLATE = {
  width: 1242,
  height: 2688,
  headingXRatio: 0.49749962,
  headingYRatio: 0.10586081,
  subheadingXRatio: 0.51107036,
  subheadingYRatio: 0.24385017,
  textWidthRatio: 0.90016103,
  mockupOffsetXRatio: 0.00846561,
  mockupOffsetYRatio: 0.16438874,
  mockupBaseWidthRatio: 0.58333333,
  mockupBaseHeightRatio: 0.53846154,
  mockupInnerPaddingRatio: 0.02760524,
  mockupCornerRadiusRatio: 0.07591442,
  defaultMockupScale: 1.2,
  fontScaleDivisor: 365,
};

const DEVICE_DEFINITIONS: DeviceDefinition[] = [
  {
    id: 'iphone-15-pro',
    label: 'iPhone 15 Pro',
    type: 'iphone',
    width: 1242,
    height: 2688,
    frameAsset: '/iphone_15_frame.png',
    aliases: [
      'iphone',
      'iphone 15',
      'iphone 15 pro',
      'iphone-15',
      'iphone-15-pro',
      'iphone15',
      'iphone15pro',
      'iphone 14 pro',
      'iphone-14-pro',
    ],
    legacyDeviceLabel: 'iPhone',
  },
  {
    id: 'ipad-pro-13',
    label: 'iPad Pro 13',
    type: 'ipad',
    width: 2048,
    height: 2732,
    frameAsset: '/iPad Pro 13 Frame.png',
    aliases: [
      'ipad',
      'ipad pro',
      'ipad pro 13',
      'ipad pro 12.9',
      'ipad 12.9',
      'ipad-pro-13',
      'ipad13',
      'ipad pro 11',
      'ipad-pro-11',
      'ipad 11',
      'ipad pro 13"',
      'ipad pro 11"',
    ],
    legacyDeviceLabel: 'iPad',
  },
];

const DEVICE_OVERRIDES: Partial<Record<DevicePresetId, DeviceOverrides>> = {
  'ipad-pro-13': {
    mockup: {
      defaultScale: 1,
      innerPaddingMultiplier: 1.70,
      cornerRadiusMultiplier: 0.1,
    },
  },
};

function buildDevicePreset(definition: DeviceDefinition): DevicePreset {
  const { width, height } = definition;
  const headingX = width * BASE_TEMPLATE.headingXRatio;
  const headingY = height * BASE_TEMPLATE.headingYRatio;
  const subheadingX = width * BASE_TEMPLATE.subheadingXRatio;
  const subheadingY = height * BASE_TEMPLATE.subheadingYRatio;
  const defaultTextWidth = Math.round(width * BASE_TEMPLATE.textWidthRatio);

  const mockupBaseWidth = width * BASE_TEMPLATE.mockupBaseWidthRatio;
  const mockupBaseHeight = height * BASE_TEMPLATE.mockupBaseHeightRatio;
  let mockupInnerPadding = mockupBaseWidth * BASE_TEMPLATE.mockupInnerPaddingRatio;
  let mockupCornerRadius = mockupBaseWidth * BASE_TEMPLATE.mockupCornerRadiusRatio;
  let mockupOffsetX = width * BASE_TEMPLATE.mockupOffsetXRatio;
  let mockupOffsetY = height * BASE_TEMPLATE.mockupOffsetYRatio;
  let mockupDefaultScale = BASE_TEMPLATE.defaultMockupScale;

  const overrides = DEVICE_OVERRIDES[definition.id];
  if (overrides?.mockup) {
    if (typeof overrides.mockup.defaultScale === 'number') {
      mockupDefaultScale = overrides.mockup.defaultScale;
    }
    if (typeof overrides.mockup.innerPaddingMultiplier === 'number') {
      mockupInnerPadding *= overrides.mockup.innerPaddingMultiplier;
    }
    if (typeof overrides.mockup.cornerRadiusMultiplier === 'number') {
      mockupCornerRadius *= overrides.mockup.cornerRadiusMultiplier;
    }
    if (overrides.mockup.offset) {
      mockupOffsetX = overrides.mockup.offset.x;
      mockupOffsetY = overrides.mockup.offset.y;
    }
  }

  return {
    id: definition.id,
    label: definition.label,
    aliases: definition.aliases,
    type: definition.type,
    canvasWidth: width,
    canvasHeight: height,
    frameAsset: definition.frameAsset,
    fontScaleMultiplier: width / BASE_TEMPLATE.fontScaleDivisor,
    defaultTextWidth,
    headingPosition: {
      x: headingX,
      y: headingY,
    },
    subheadingPosition: {
      x: subheadingX,
      y: subheadingY,
    },
    mockup: {
      baseWidth: mockupBaseWidth,
      baseHeight: mockupBaseHeight,
      defaultScale: mockupDefaultScale,
      offset: {
        x: mockupOffsetX,
        y: mockupOffsetY,
      },
      innerPadding: mockupInnerPadding,
      cornerRadius: mockupCornerRadius,
    },
    legacyDeviceLabel: definition.legacyDeviceLabel,
  };
}

const PRESET_MAP: Record<DevicePresetId, DevicePreset> = DEVICE_DEFINITIONS.reduce(
  (acc, definition) => {
    acc[definition.id] = buildDevicePreset(definition);
    return acc;
  },
  {} as Record<DevicePresetId, DevicePreset>
);

const ALIAS_LOOKUP = DEVICE_DEFINITIONS.reduce<Record<string, DevicePresetId>>((acc, definition) => {
  acc[definition.label.toLowerCase()] = definition.id;
  definition.aliases.forEach((alias) => {
    acc[alias.toLowerCase()] = definition.id;
  });
  return acc;
}, {});

export const DEFAULT_DEVICE_PRESET_ID: DevicePresetId = 'iphone-15-pro';

export function resolveDevicePreset(device?: string | null): DevicePreset {
  if (!device) {
    return PRESET_MAP[DEFAULT_DEVICE_PRESET_ID];
  }

  const normalized = device.trim().toLowerCase();
  const resolvedId = ALIAS_LOOKUP[normalized];

  if (resolvedId) {
    return PRESET_MAP[resolvedId];
  }

  if (normalized.includes('ipad')) {
    return PRESET_MAP['ipad-pro-13'];
  }

  return PRESET_MAP[DEFAULT_DEVICE_PRESET_ID];
}

export function listAvailableDevicePresets(): DevicePreset[] {
  return Object.values(PRESET_MAP);
}

export function isIpadPreset(presetOrDevice?: DevicePreset | string | null): boolean {
  if (!presetOrDevice) {
    return false;
  }
  const preset = typeof presetOrDevice === 'string' ? resolveDevicePreset(presetOrDevice) : presetOrDevice;
  return preset.type === 'ipad';
}

export function getDevicePresetId(device?: string | null): DevicePresetId {
  return resolveDevicePreset(device).id;
}

export function getDeviceFrameAsset(device?: string | null): string {
  return resolveDevicePreset(device).frameAsset;
}
