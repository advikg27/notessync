import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../storage/db';
import { parseReferences, convertMarkdownToHtml } from '../modules/markdown';

const createModuleSchema = z.object({
  courseId: z.string(),
  type: z.enum(['definition', 'example', 'explanation', 'diagram', 'proof', 'problem']),
  title: z.string().min(1),
  contentMarkdown: z.string(),
  tags: z.array(z.string()).optional(),
});

const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  contentMarkdown: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function moduleRoutes(fastify: FastifyInstance) {
  // Create module
  fastify.post('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const body = createModuleSchema.parse(request.body);
      const userId = (request.user as any).id;

      // Verify user has access to course AND permission to create modules
      const membership = await prisma.courseMembership.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: body.courseId,
          },
        },
      });

      if (!membership) {
        return reply.status(403).send({ error: 'Not enrolled in this course' });
      }

      // Only OWNER and ADMIN can create modules
      if (membership.role === 'MEMBER') {
        return reply.status(403).send({ 
          error: 'Only course owners and admins can create modules',
          requiredRole: 'ADMIN or OWNER',
        });
      }

      // Convert markdown to HTML
      const contentHtml = await convertMarkdownToHtml(body.contentMarkdown);

      // Create module with first version
      const module = await prisma.module.create({
        data: {
          courseId: body.courseId,
          authorId: userId,
          type: body.type,
          title: body.title,
          versions: {
            create: {
              versionNumber: 1,
              contentMarkdown: body.contentMarkdown,
              contentHtml,
            },
          },
          tags: body.tags
            ? {
                create: body.tags.map((tag) => ({ tag })),
              }
            : undefined,
        },
        include: {
          versions: true,
          tags: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Parse and store references
      const references = parseReferences(body.contentMarkdown);
      if (references.length > 0) {
        await prisma.moduleReference.createMany({
          data: references.map((refId) => ({
            sourceModuleId: module.id,
            referencedModuleId: refId,
          })),
          skipDuplicates: true,
        });
      }

      return reply.status(201).send({ module });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // List modules
  fastify.get('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { courseId, type, tag, search } = request.query as any;

      const where: any = {};

      if (courseId) {
        where.courseId = courseId;
      }

      if (type) {
        where.type = type;
      }

      if (tag) {
        where.tags = {
          some: {
            tag,
          },
        };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
        ];
      }

      const modules = await prisma.module.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: true,
          versions: {
            orderBy: {
              versionNumber: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return reply.send({ modules });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get module by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;

      const module = await prisma.module.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: true,
          versions: {
            orderBy: {
              versionNumber: 'desc',
            },
            take: 1,
          },
          outgoingRefs: {
            include: {
              referencedModule: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                },
              },
            },
          },
          incomingRefs: {
            include: {
              sourceModule: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!module) {
        return reply.status(404).send({ error: 'Module not found' });
      }

      return reply.send({ module });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update module (creates new version)
  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const body = updateModuleSchema.parse(request.body);
      const userId = (request.user as any).id;

      // Get current module
      const currentModule = await prisma.module.findUnique({
        where: { id },
        include: {
          versions: {
            orderBy: {
              versionNumber: 'desc',
            },
            take: 1,
          },
        },
      });

      if (!currentModule) {
        return reply.status(404).send({ error: 'Module not found' });
      }

      // Update module
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (body.title) {
        updateData.title = body.title;
      }

      // Create new version if content changed
      if (body.contentMarkdown) {
        const contentHtml = await convertMarkdownToHtml(body.contentMarkdown);
        const latestVersion = currentModule.versions[0];

        updateData.versions = {
          create: {
            versionNumber: latestVersion.versionNumber + 1,
            contentMarkdown: body.contentMarkdown,
            contentHtml,
          },
        };

        // Update references
        const references = parseReferences(body.contentMarkdown);
        
        // Delete old references
        await prisma.moduleReference.deleteMany({
          where: {
            sourceModuleId: id,
          },
        });

        // Create new references
        if (references.length > 0) {
          await prisma.moduleReference.createMany({
            data: references.map((refId) => ({
              sourceModuleId: id,
              referencedModuleId: refId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Update tags
      if (body.tags) {
        await prisma.moduleTag.deleteMany({
          where: {
            moduleId: id,
          },
        });

        updateData.tags = {
          create: body.tags.map((tag) => ({ tag })),
        };
      }

      const module = await prisma.module.update({
        where: { id },
        data: updateData,
        include: {
          versions: {
            orderBy: {
              versionNumber: 'desc',
            },
            take: 1,
          },
          tags: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return reply.send({ module });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get module versions
  fastify.get('/:id/versions', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;

      const versions = await prisma.moduleVersion.findMany({
        where: { moduleId: id },
        orderBy: {
          versionNumber: 'desc',
        },
      });

      return reply.send({ versions });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Restore module version
  fastify.post('/:id/restore', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { versionNumber } = request.body as any;

      // Get the version to restore
      const versionToRestore = await prisma.moduleVersion.findUnique({
        where: {
          moduleId_versionNumber: {
            moduleId: id,
            versionNumber,
          },
        },
      });

      if (!versionToRestore) {
        return reply.status(404).send({ error: 'Version not found' });
      }

      // Get latest version number
      const latestVersion = await prisma.moduleVersion.findFirst({
        where: { moduleId: id },
        orderBy: {
          versionNumber: 'desc',
        },
      });

      if (!latestVersion) {
        return reply.status(404).send({ error: 'Module not found' });
      }

      // Create new version with restored content
      const newVersion = await prisma.moduleVersion.create({
        data: {
          moduleId: id,
          versionNumber: latestVersion.versionNumber + 1,
          contentMarkdown: versionToRestore.contentMarkdown,
          contentHtml: versionToRestore.contentHtml,
        },
      });

      // Update module timestamp
      await prisma.module.update({
        where: { id },
        data: {
          updatedAt: new Date(),
        },
      });

      return reply.send({ version: newVersion });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Delete module
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const userId = (request.user as any).id;

      const module = await prisma.module.findUnique({
        where: { id },
      });

      if (!module) {
        return reply.status(404).send({ error: 'Module not found' });
      }

      // Only author can delete
      if (module.authorId !== userId) {
        return reply.status(403).send({ error: 'Not authorized' });
      }

      await prisma.module.delete({
        where: { id },
      });

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

