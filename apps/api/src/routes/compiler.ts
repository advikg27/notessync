import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../storage/db';
import { compileToHtml, compileToPdf } from '../modules/compiler';

const compileSchema = z.object({
  moduleIds: z.array(z.string()).min(1),
  format: z.enum(['html', 'pdf']),
  title: z.string().optional(),
});

export async function compilerRoutes(fastify: FastifyInstance) {
  // Compile modules
  fastify.post('/compile', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const body = compileSchema.parse(request.body);
      const userId = (request.user as any).id;

      // Fetch modules with latest versions
      const modules = await prisma.module.findMany({
        where: {
          id: {
            in: body.moduleIds,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
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
        },
      });

      if (modules.length === 0) {
        return reply.status(404).send({ error: 'No modules found' });
      }

      // Verify user has access to all modules
      const courseIds = [...new Set(modules.map((m) => m.courseId))];
      
      for (const courseId of courseIds) {
        const membership = await prisma.courseMembership.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId,
            },
          },
        });

        if (!membership) {
          return reply.status(403).send({ error: 'Not enrolled in all required courses' });
        }
      }

      // Sort modules in requested order
      const sortedModules = body.moduleIds
        .map((id) => modules.find((m) => m.id === id))
        .filter((m) => m !== undefined);

      // Compile based on format
      if (body.format === 'html') {
        const html = await compileToHtml(sortedModules, body.title || 'Compiled Textbook');
        return reply.type('text/html').send(html);
      } else {
        const pdfBuffer = await compileToPdf(sortedModules, body.title || 'Compiled Textbook');
        return reply
          .type('application/pdf')
          .header('Content-Disposition', 'attachment; filename="textbook.pdf"')
          .send(pdfBuffer);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get module dependency graph
  fastify.get('/dependency-graph/:moduleId', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { moduleId } = request.params as any;

      const visited = new Set<string>();
      const graph: any = {};

      async function buildGraph(id: string) {
        if (visited.has(id)) return;
        visited.add(id);

        const module = await prisma.module.findUnique({
          where: { id },
          include: {
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
          },
        });

        if (!module) return;

        graph[id] = {
          id: module.id,
          title: module.title,
          type: module.type,
          references: module.outgoingRefs.map((ref) => ({
            id: ref.referencedModule.id,
            title: ref.referencedModule.title,
            type: ref.referencedModule.type,
          })),
        };

        // Recursively build graph for referenced modules
        for (const ref of module.outgoingRefs) {
          await buildGraph(ref.referencedModuleId);
        }
      }

      await buildGraph(moduleId);

      return reply.send({ graph });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

