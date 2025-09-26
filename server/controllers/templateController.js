const templateService = require('../services/templateService');

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = value.toString().toLowerCase().trim();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }
  return defaultValue;
};

const templateController = {
  async listTemplates(req, res) {
    try {
      const { device, includeSchema, drafts, includeVersions } = req.query;
      const templates = await templateService.listTemplates({
        includeDrafts: parseBoolean(drafts, false),
        includeSchema: parseBoolean(includeSchema, false),
        includeVersions: parseBoolean(includeVersions, false),
        device,
        includeBuiltin: true,
      });

      res.status(200).json({ templates });
    } catch (error) {
      console.error('templateController.listTemplates error:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  },

  async getTemplate(req, res) {
    try {
      const { identifier } = req.params;
      const includeSchema = parseBoolean(req.query.includeSchema, true);

      const template = await templateService.findTemplateByIdentifier(identifier, {
        includeSchema,
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.status(200).json(template);
    } catch (error) {
      console.error('templateController.getTemplate error:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  },

  async createTemplate(req, res) {
    try {
      const payload = req.body || {};
      const createdTemplate = await templateService.createTemplate({
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        supportedDevices: payload.supportedDevices,
        aspectRatios: payload.aspectRatios,
        tags: payload.tags,
        thumbnailUrl: payload.thumbnailUrl,
        status: payload.status,
        createdById: req.user?.id || null,
      });

      res.status(201).json(createdTemplate);
    } catch (error) {
      console.error('templateController.createTemplate error:', error);
      res.status(400).json({ error: error.message || 'Failed to create template' });
    }
  },

  async createTemplateVersion(req, res) {
    try {
      const { id } = req.params;
      const payload = req.body || {};

      const version = await templateService.createTemplateVersion(id, {
        version: payload.version,
        schema: payload.schema,
        assets: payload.assets,
        changelog: payload.changelog,
        isDefault: parseBoolean(payload.isDefault, false),
        publish: parseBoolean(payload.publish, false),
      });

      res.status(201).json(version);
    } catch (error) {
      console.error('templateController.createTemplateVersion error:', error);
      res.status(400).json({ error: error.message || 'Failed to create template version' });
    }
  },

  async publishTemplateVersion(req, res) {
    try {
      const { id, versionId } = req.params;
      const payload = req.body || {};

      const version = await templateService.publishTemplateVersion(id, versionId, {
        setAsDefault: parseBoolean(payload.setAsDefault, true),
      });

      res.status(200).json(version);
    } catch (error) {
      console.error('templateController.publishTemplateVersion error:', error);
      res.status(400).json({ error: error.message || 'Failed to publish template version' });
    }
  },

  async setDefaultTemplateVersion(req, res) {
    try {
      const { id, versionId } = req.params;
      await templateService.setDefaultTemplateVersion(id, versionId);
      res.status(204).send();
    } catch (error) {
      console.error('templateController.setDefaultTemplateVersion error:', error);
      res.status(400).json({ error: error.message || 'Failed to set default template version' });
    }
  },

  async updateTemplateMetadata(req, res) {
    try {
      const { id } = req.params;
      const payload = req.body || {};
      const updated = await templateService.updateTemplateMetadata(id, payload);
      res.status(200).json(updated);
    } catch (error) {
      console.error('templateController.updateTemplateMetadata error:', error);
      res.status(400).json({ error: error.message || 'Failed to update template' });
    }
  },

  async archiveTemplate(req, res) {
    try {
      const { id } = req.params;
      await templateService.archiveTemplate(id);
      res.status(204).send();
    } catch (error) {
      console.error('templateController.archiveTemplate error:', error);
      res.status(400).json({ error: error.message || 'Failed to archive template' });
    }
  },
};

module.exports = templateController;
