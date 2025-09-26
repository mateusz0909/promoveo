const { prisma } = require('../lib/clients');
const { BUILTIN_TEMPLATES } = require('../templates/registry/builtinTemplates');

const DEFAULT_TEMPLATE_ID = BUILTIN_TEMPLATES.find((template) => template.isDefault)?.id
  || BUILTIN_TEMPLATES[0]?.id
  || null;

const TEMPLATE_STATUS = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
};

const pickDefined = (input = {}) =>
  Object.entries(input).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

const normalizeSlug = (value) => {
  if (!value) {
    return null;
  }

  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 120);
};

const mapVersionRecord = (version, { includeSchema = false } = {}) => {
  if (!version) {
    return null;
  }

  return pickDefined({
    id: version.id,
    version: version.version,
    isDefault: Boolean(version.isDefault),
    changelog: version.changelog || null,
    publishedAt: version.publishedAt || null,
    createdAt: version.createdAt || null,
    schema: includeSchema ? version.schema || null : undefined,
    assets: includeSchema ? version.assets || null : undefined,
    source: 'database',
  });
};

const mapTemplateRecord = ({
  template,
  preferredVersion,
  includeSchema = false,
  includeVersions = false,
}) => {
  if (!template) {
    return null;
  }

  const versionRecord = preferredVersion || template.versions?.[0] || null;
  const versionsList = includeVersions
    ? (template.versions || [])
        .map((version) => mapVersionRecord(version, { includeSchema }))
        .filter(Boolean)
    : undefined;

  return {
    id: template.id,
    slug: template.slug,
    name: template.name,
    description: template.description,
    status: template.status,
    thumbnailUrl: template.thumbnailUrl,
    supportedDevices: template.supportedDevices,
    aspectRatios: template.aspectRatios,
    tags: template.tags,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    source: 'database',
    version: versionRecord?.version || null,
    templateVersionId: versionRecord?.id || null,
    changelog: versionRecord?.changelog || null,
    isDefault: versionRecord?.isDefault || false,
    publishedAt: versionRecord?.publishedAt || null,
    schema: includeSchema ? versionRecord?.schema || null : undefined,
    assets: includeSchema ? versionRecord?.assets || null : undefined,
    versions: includeVersions ? versionsList : undefined,
  };
};

const mapBuiltinTemplate = (template, { includeSchema = false, includeVersions = false } = {}) => ({
  id: template.id,
  slug: template.slug,
  name: template.name,
  description: template.description,
  status: template.status,
  thumbnailUrl: template.thumbnailUrl || null,
  supportedDevices: template.supportedDevices,
  aspectRatios: template.aspectRatios,
  tags: template.tags,
  createdAt: null,
  updatedAt: null,
  source: 'builtin',
  version: template.version,
  templateVersionId: null,
  changelog: null,
  isDefault: Boolean(template.isDefault),
  publishedAt: null,
  schema: includeSchema ? template.schema : undefined,
  assets: includeSchema ? null : undefined,
  versions: includeVersions
    ? [
        pickDefined({
          id: `${template.id}-builtin`,
          version: template.version,
          isDefault: Boolean(template.isDefault),
          changelog: template.changelog || null,
          publishedAt: null,
          createdAt: null,
          schema: includeSchema ? template.schema || null : undefined,
          assets: undefined,
          source: 'builtin',
        }),
      ]
    : undefined,
});

const pickDefaultVersion = (template) => {
  if (!template?.versions?.length) {
    return null;
  }

  const explicitDefault = template.versions.find((version) => version.isDefault);
  if (explicitDefault) {
    return explicitDefault;
  }

  const publishedVersion = template.versions
    .filter((version) => Boolean(version.publishedAt))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0];

  return publishedVersion || template.versions[0];
};

const listTemplates = async ({
  includeDrafts = false,
  includeSchema = false,
  includeVersions = false,
  device,
  includeBuiltin = true,
} = {}) => {
  const whereClause = includeDrafts
    ? {}
    : {
        status: {
          in: [TEMPLATE_STATUS.PUBLISHED, TEMPLATE_STATUS.REVIEW],
        },
      };

  const templates = await prisma.template.findMany({
    where: whereClause,
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const mapped = templates
    .map((template) =>
      mapTemplateRecord({
        template,
        preferredVersion: pickDefaultVersion(template),
        includeSchema,
        includeVersions,
      })
    )
    .filter(Boolean)
    .filter((item) => (device ? item?.supportedDevices?.includes(device) : true));

  let allTemplates = mapped;

  if (includeBuiltin) {
    const builtin = BUILTIN_TEMPLATES.filter((template) =>
      device ? template.supportedDevices.includes(device) : true
  ).map((template) => mapBuiltinTemplate(template, { includeSchema, includeVersions }));

    const existingSlugs = new Set(allTemplates.map((item) => item.slug));
    const enriched = [
      ...allTemplates,
      ...builtin.filter((template) => !existingSlugs.has(template.slug)),
    ];

    allTemplates = enriched;
  }

  allTemplates.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return allTemplates;
};

const findTemplateByIdentifier = async (identifier, { includeSchema = false } = {}) => {
  if (!identifier) {
    return null;
  }

  const normalized = identifier.trim();

  const template = await prisma.template.findFirst({
    where: {
      OR: [
        { id: normalized },
        { slug: normalized },
      ],
    },
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (template) {
    const preferredVersion = pickDefaultVersion(template);
    return mapTemplateRecord({
      template,
      preferredVersion,
      includeSchema,
    });
  }

  const builtin = BUILTIN_TEMPLATES.find(
    (item) => item.id === normalized || item.slug === normalized
  );
  if (builtin) {
    return mapBuiltinTemplate(builtin, { includeSchema });
  }

  return null;
};

const findTemplateVersionById = async (versionId, { includeSchema = false } = {}) => {
  if (!versionId) {
    return null;
  }

  const version = await prisma.templateVersion.findUnique({
    where: { id: versionId },
    include: { template: true },
  });

  if (!version) {
    return null;
  }

  const templatePayload = {
    ...version.template,
    versions: [version],
  };

  return mapTemplateRecord({
    template: templatePayload,
    preferredVersion: version,
    includeSchema,
  });
};

const createTemplate = async ({
  name,
  slug,
  description,
  supportedDevices = ['iPhone', 'iPad'],
  aspectRatios = ['9:19.5'],
  tags = [],
  thumbnailUrl = null,
  status = TEMPLATE_STATUS.DRAFT,
  createdById = null,
} = {}) => {
  if (!name) {
    throw new Error('Template name is required');
  }

  const finalSlug = normalizeSlug(slug || name);

  const existing = await prisma.template.findFirst({
    where: {
      OR: [
        { slug: finalSlug },
        { name },
      ],
    },
  });

  if (existing) {
    throw new Error('Template with the same name or slug already exists');
  }

  const template = await prisma.template.create({
    data: {
      name,
      slug: finalSlug,
      description,
      supportedDevices,
      aspectRatios,
      tags,
      thumbnailUrl,
      status,
      createdById,
    },
  });

  return mapTemplateRecord({ template, includeSchema: false });
};

const createTemplateVersion = async (
  templateId,
  {
    version,
    schema,
    assets = null,
    changelog = null,
    isDefault = false,
    publish = false,
  } = {}
) => {
  if (!templateId) {
    throw new Error('templateId is required');
  }

  if (!schema) {
    throw new Error('Template schema is required');
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: { versions: true },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  const finalVersion = version || `v${template.versions.length + 1}`;

  const versionRecord = await prisma.templateVersion.create({
    data: {
      version: finalVersion,
      schema,
      assets,
      changelog,
      isDefault: Boolean(isDefault) || template.versions.length === 0,
      publishedAt: publish ? new Date() : null,
      templateId,
    },
  });

  if (versionRecord.isDefault) {
    await prisma.templateVersion.updateMany({
      where: {
        templateId,
        id: { not: versionRecord.id },
      },
      data: {
        isDefault: false,
      },
    });
  }

  if (publish) {
    await prisma.template.update({
      where: { id: templateId },
      data: { status: TEMPLATE_STATUS.PUBLISHED },
    });
  }

  return versionRecord;
};

const publishTemplateVersion = async (templateId, versionId, { setAsDefault = true } = {}) => {
  if (!templateId || !versionId) {
    throw new Error('templateId and versionId are required');
  }

  const versionRecord = await prisma.templateVersion.update({
    where: { id: versionId },
    data: {
      publishedAt: new Date(),
      isDefault: Boolean(setAsDefault),
    },
  });

  if (setAsDefault) {
    await prisma.templateVersion.updateMany({
      where: {
        templateId,
        id: { not: versionId },
      },
      data: {
        isDefault: false,
      },
    });
  }

  await prisma.template.update({
    where: { id: templateId },
    data: {
      status: TEMPLATE_STATUS.PUBLISHED,
    },
  });

  return versionRecord;
};

const setDefaultTemplateVersion = async (templateId, versionId) => {
  if (!templateId || !versionId) {
    throw new Error('templateId and versionId are required');
  }

  await prisma.templateVersion.updateMany({
    where: { templateId },
    data: { isDefault: false },
  });

  await prisma.templateVersion.update({
    where: { id: versionId },
    data: { isDefault: true },
  });
};

const archiveTemplate = async (templateId) => {
  if (!templateId) {
    throw new Error('templateId is required');
  }

  await prisma.template.update({
    where: { id: templateId },
    data: { status: TEMPLATE_STATUS.ARCHIVED },
  });
};

const updateTemplateMetadata = async (templateId, payload = {}) => {
  if (!templateId) {
    throw new Error('templateId is required');
  }

  const data = pickDefined({
    name: payload.name,
    description: payload.description,
    tags: payload.tags,
    thumbnailUrl: payload.thumbnailUrl,
    supportedDevices: payload.supportedDevices,
    aspectRatios: payload.aspectRatios,
    status: payload.status,
  });

  if (Object.keys(data).length === 0) {
    return prisma.template.findUnique({ where: { id: templateId } });
  }

  return prisma.template.update({
    where: { id: templateId },
    data,
  });
};

module.exports = {
  TEMPLATE_STATUS,
  listTemplates,
  findTemplateByIdentifier,
  findTemplateVersionById,
  createTemplate,
  createTemplateVersion,
  publishTemplateVersion,
  setDefaultTemplateVersion,
  archiveTemplate,
  updateTemplateMetadata,
  DEFAULT_TEMPLATE_ID,
};