const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const templateController = require('../controllers/templateController');

const router = express.Router();

router.get('/', templateController.listTemplates);
router.get('/:identifier', templateController.getTemplate);

router.post('/', requireAuth, requireAdmin, templateController.createTemplate);
router.post('/:id/versions', requireAuth, requireAdmin, templateController.createTemplateVersion);
router.post(
  '/:id/versions/:versionId/publish',
  requireAuth,
  requireAdmin,
  templateController.publishTemplateVersion
);
router.post(
  '/:id/versions/:versionId/default',
  requireAuth,
  requireAdmin,
  templateController.setDefaultTemplateVersion
);
router.patch('/:id', requireAuth, requireAdmin, templateController.updateTemplateMetadata);
router.delete('/:id', requireAuth, requireAdmin, templateController.archiveTemplate);

module.exports = router;
