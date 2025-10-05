const prisma = require('../lib/clients').prisma;

/**
 * Add text instance to screenshot
 * POST /api/projects/:projectId/images/:imageId/text
 */
async function addTextToScreenshot(req, res) {
  try {
    const { projectId, imageId } = req.params;
    const textInstance = req.body;

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get current image
    const image = await prisma.generatedImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Update configuration with new text instance
    const config = image.configuration || {};
    const textInstances = config.textInstances || [];
    textInstances.push(textInstance);

    await prisma.generatedImage.update({
      where: { id: imageId },
      data: {
        configuration: {
          ...config,
          textInstances,
        },
      },
    });

    res.json({ textInstance });
  } catch (error) {
    console.error('Error adding text instance:', error);
    res.status(500).json({ error: 'Failed to add text instance' });
  }
}

/**
 * Update text instance
 * PUT /api/projects/:projectId/images/:imageId/text/:textInstanceId
 */
async function updateTextInstance(req, res) {
  try {
    const { projectId, imageId, textInstanceId } = req.params;
    const updates = req.body;

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get current image
    const image = await prisma.generatedImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Update text instance
    const config = image.configuration || {};
    const textInstances = config.textInstances || [];
    const instanceIndex = textInstances.findIndex(t => t.id === textInstanceId);

    if (instanceIndex === -1) {
      return res.status(404).json({ error: 'Text instance not found' });
    }

    textInstances[instanceIndex] = {
      ...textInstances[instanceIndex],
      ...updates,
    };

    await prisma.generatedImage.update({
      where: { id: imageId },
      data: {
        configuration: {
          ...config,
          textInstances,
        },
      },
    });

    res.json({ textInstance: textInstances[instanceIndex] });
  } catch (error) {
    console.error('Error updating text instance:', error);
    res.status(500).json({ error: 'Failed to update text instance' });
  }
}

/**
 * Remove text instance
 * DELETE /api/projects/:projectId/images/:imageId/text/:textInstanceId
 */
async function removeTextInstance(req, res) {
  try {
    const { projectId, imageId, textInstanceId } = req.params;

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get current image
    const image = await prisma.generatedImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Remove text instance
    const config = image.configuration || {};
    const textInstances = config.textInstances || [];
    const filteredInstances = textInstances.filter(t => t.id !== textInstanceId);

    await prisma.generatedImage.update({
      where: { id: imageId },
      data: {
        configuration: {
          ...config,
          textInstances: filteredInstances,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing text instance:', error);
    res.status(500).json({ error: 'Failed to remove text instance' });
  }
}

/**
 * Add mockup instance to screenshot
 * POST /api/projects/:projectId/images/:imageId/mockups
 */
async function addMockupToScreenshot(req, res) {
  try {
    const { projectId, imageId } = req.params;
    const mockupInstance = req.body;

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get current image
    const image = await prisma.generatedImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Update configuration with new mockup instance
    const config = image.configuration || {};
    const mockupInstances = config.mockupInstances || [];
    mockupInstances.push(mockupInstance);

    await prisma.generatedImage.update({
      where: { id: imageId },
      data: {
        configuration: {
          ...config,
          mockupInstances,
        },
      },
    });

    res.json({ mockupInstance });
  } catch (error) {
    console.error('Error adding mockup instance:', error);
    res.status(500).json({ error: 'Failed to add mockup instance' });
  }
}

/**
 * Update mockup instance
 * PUT /api/projects/:projectId/images/:imageId/mockups/:mockupInstanceId
 */
async function updateMockupInstance(req, res) {
  try {
    const { projectId, imageId, mockupInstanceId } = req.params;
    const updates = req.body;

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get current image
    const image = await prisma.generatedImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Update mockup instance
    const config = image.configuration || {};
    const mockupInstances = config.mockupInstances || [];
    const instanceIndex = mockupInstances.findIndex(m => m.id === mockupInstanceId);

    if (instanceIndex === -1) {
      return res.status(404).json({ error: 'Mockup instance not found' });
    }

    mockupInstances[instanceIndex] = {
      ...mockupInstances[instanceIndex],
      ...updates,
    };

    await prisma.generatedImage.update({
      where: { id: imageId },
      data: {
        configuration: {
          ...config,
          mockupInstances,
        },
      },
    });

    res.json({ mockupInstance: mockupInstances[instanceIndex] });
  } catch (error) {
    console.error('Error updating mockup instance:', error);
    res.status(500).json({ error: 'Failed to update mockup instance' });
  }
}

/**
 * Remove mockup instance
 * DELETE /api/projects/:projectId/images/:imageId/mockups/:mockupInstanceId
 */
async function removeMockupInstance(req, res) {
  try {
    const { projectId, imageId, mockupInstanceId } = req.params;

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get current image
    const image = await prisma.generatedImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Remove mockup instance
    const config = image.configuration || {};
    const mockupInstances = config.mockupInstances || [];
    const filteredInstances = mockupInstances.filter(m => m.id !== mockupInstanceId);

    await prisma.generatedImage.update({
      where: { id: imageId },
      data: {
        configuration: {
          ...config,
          mockupInstances: filteredInstances,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing mockup instance:', error);
    res.status(500).json({ error: 'Failed to remove mockup instance' });
  }
}

module.exports = {
  addTextToScreenshot,
  updateTextInstance,
  removeTextInstance,
  addMockupToScreenshot,
  updateMockupInstance,
  removeMockupInstance,
};
