const { prisma, supabase } = require('../lib/clients');

const userController = {
  // Get current user profile
  async getProfile(req, res) {
    try {
      console.log('get-profile: Received request');
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { projects: true }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('get-profile: User profile fetched successfully');
      res.json({ user });

    } catch (error) {
      console.error('Error in get-profile:', error);
      res.status(500).json({ error: 'Error fetching user profile' });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      console.log('update-profile: Received request');
      const userId = req.user.id;
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Valid name is required' });
      }

      console.log('update-profile: Updating user profile');
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name: name.trim() },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { projects: true }
          }
        }
      });

      console.log('update-profile: User profile updated successfully');
      res.json({ 
        message: 'Profile updated successfully', 
        user: updatedUser 
      });

    } catch (error) {
      console.error('Error in update-profile:', error);
      res.status(500).json({ error: 'Error updating user profile' });
    }
  },

  // Get user statistics
  async getStats(req, res) {
    try {
      console.log('get-stats: Received request');
      const userId = req.user.id;

      const stats = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: {
            select: { projects: true }
          },
          projects: {
            select: {
              id: true,
              createdAt: true,
              generatedImages: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5 // Latest 5 projects
          }
        }
      });

      if (!stats) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate total images generated
      const totalImages = stats.projects.reduce((acc, project) => {
        return acc + (project.generatedImages ? project.generatedImages.length : 0);
      }, 0);

      const userStats = {
        totalProjects: stats._count.projects,
        totalImages,
        recentProjects: stats.projects
      };

      console.log('get-stats: User statistics fetched successfully');
      res.json({ stats: userStats });

    } catch (error) {
      console.error('Error in get-stats:', error);
      res.status(500).json({ error: 'Error fetching user statistics' });
    }
  },

  // Delete user account
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      console.log('Attempting to delete account for user:', userId);

      // Delete user's projects and related data
      await prisma.generatedImage.deleteMany({
        where: {
          project: {
            userId: userId
          }
        }
      });

      await prisma.project.deleteMany({
        where: {
          userId: userId
        }
      });

      // Delete the user record from our public User table (if it exists)
      const deletedUser = await prisma.user.deleteMany({
        where: {
          id: userId
        }
      });
      
      console.log(`Deleted ${deletedUser.count} user record(s) for user ${userId}`);

      // Delete user's files from Supabase storage
      try {
        const { data: files } = await supabase.storage
          .from('project-assets')
          .list(userId);
        
        if (files && files.length > 0) {
          const filePaths = files.map(file => `${userId}/${file.name}`);
          await supabase.storage
            .from('project-assets')
            .remove(filePaths);
          console.log(`Deleted ${filePaths.length} files for user ${userId}`);
        }
      } catch (storageError) {
        console.warn('Warning: Failed to delete user files from storage:', storageError);
        // Don't fail the entire deletion process if storage cleanup fails
      }

      // Delete user from Supabase Auth (GDPR compliance)
      try {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
        if (authDeleteError) {
          console.warn('Warning: Failed to delete user from Supabase Auth:', authDeleteError);
          // Log the error but don't fail the request - the user's data is already cleaned up
        } else {
          console.log(`Successfully deleted user ${userId} from Supabase Auth`);
        }
      } catch (authError) {
        console.warn('Warning: Exception during Supabase Auth user deletion:', authError);
      }

      res.status(200).json({ message: 'Account and associated data deleted successfully' });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  }
};

module.exports = userController;